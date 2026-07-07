import {
  clearCompletedRedeem,
  createScopedLicenseClient,
  extractDiscordProfile,
  loadCompletedRedeem,
  normalizeLicenseStatus,
} from "./loader-redeem";
import { isFrozenLicense, getLicenseRemainingMs } from "./license-freeze";

const LICENSE_SELECT =
  "id, license_key, status, activated_at, expires_at, duration_value, duration_unit, frozen_at, frozen_remaining_ms, discord_auth_user_id, discord_user_id, discord_username";

export function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimeLeft(ms) {
  if (!Number.isFinite(ms)) return "Unlimited";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTime(value) {
  const date = parseDateSafe(value);
  if (!date) return "Unlimited";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function getLicenseDurationUnit(license) {
  return String(license?.duration_unit || "").trim().toLowerCase();
}

function getLicenseDurationMs(license) {
  const unit = getLicenseDurationUnit(license);
  const value = Number(license?.duration_value ?? 0);
  if (!Number.isFinite(value) || value <= 0) return null;

  if (unit === "seconds") return value * 1000;
  if (unit === "minutes") return value * 60 * 1000;
  if (unit === "hours") return value * 60 * 60 * 1000;
  if (unit === "days") return value * 24 * 60 * 60 * 1000;
  return null;
}

export function isActiveLinkedLicense(license) {
  if (!license) return false;
  if (isFrozenLicense(license)) return false;

  const status = normalizeLicenseStatus(license?.status);
  if (status === "banned" || status === "revoked" || status === "disabled" || status === "expired") {
    return false;
  }

  const expiresAt = parseDateSafe(license?.expires_at);
  const activatedAt = parseDateSafe(license?.activated_at);
  const isActivated = status === "activated" || status === "active" || Boolean(activatedAt);

  if (!isActivated) return false;
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

export function isNotActivatedLinkedLicense(license) {
  if (!license) return false;
  return !isActiveLinkedLicense(license) && !isBannedLinkedLicense(license) && !isExpiredLinkedLicense(license);
}

export function isFrozenLinkedLicense(license) {
  return isFrozenLicense(license);
}

export function isBannedLinkedLicense(license) {
  const status = normalizeLicenseStatus(license?.status);
  return status === "banned" || status === "revoked" || status === "disabled";
}

export function isExpiredLinkedLicense(license) {
  const status = normalizeLicenseStatus(license?.status);
  if (status === "expired") return true;
  if (status !== "activated" && status !== "active") return false;
  const expiresAt = parseDateSafe(license?.expires_at);
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}

export function resolveSubscriptionMode(license) {
  if (!license) return "empty";
  if (isBannedLinkedLicense(license)) return "banned";
  if (isFrozenLinkedLicense(license)) return "frozen";
  if (isActiveLinkedLicense(license)) return "active";
  if (isExpiredLinkedLicense(license)) return "expired";
  if (isNotActivatedLinkedLicense(license)) return "pending";
  return "pending";
}

export function computeSubscriptionMetrics(license) {
  const expiresAt = parseDateSafe(license?.expires_at);
  const activatedAt = parseDateSafe(license?.activated_at);
  const now = Date.now();
  const frozen = isFrozenLicense(license);

  let remainingMs = getLicenseRemainingMs(license, now);
  if (!Number.isFinite(remainingMs)) {
    remainingMs = Number.POSITIVE_INFINITY;
  }

  let progressPercent = 100;
  if (expiresAt && activatedAt) {
    const totalMs = Math.max(0, expiresAt.getTime() - activatedAt.getTime());
    if (totalMs > 0) {
      progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
    }
  } else if (expiresAt) {
    const totalMs = getLicenseDurationMs(license);
    if (totalMs && totalMs > 0) {
      progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
    }
  }

  const isExpired = !frozen && remainingMs === 0 && Boolean(expiresAt);

  return {
    timeLeft: isExpired ? "Expired" : formatTimeLeft(remainingMs),
    expiryDate: formatDateTime(license?.expires_at),
    progressPercent: frozen ? progressPercent : progressPercent,
    statusLabel: frozen ? "Freezed" : isExpired ? "Expired" : "Active",
    isFrozen: frozen,
  };
}

async function queryLicenseByKey(licenseKey, appId) {
  const scopedClient = createScopedLicenseClient(licenseKey, appId);
  if (!scopedClient) return null;

  const { data, error } = await scopedClient
    .from("licenses")
    .select(LICENSE_SELECT)
    .eq("license_key", licenseKey)
    .eq("app_id", appId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function queryLicensesForProfile(supabaseClient, appId, profile) {
  if (!profile?.authUserId) return [];

  const { data: authMatches, error: authError } = await supabaseClient
    .from("licenses")
    .select(LICENSE_SELECT)
    .eq("app_id", appId)
    .eq("discord_auth_user_id", profile.authUserId)
    .order("expires_at", { ascending: false, nullsFirst: false })
    .limit(5);

  if (authError) return [];

  const rows = Array.isArray(authMatches) ? [...authMatches] : [];

  if (!rows.length && profile.discordUserId) {
    const { data: discordMatches } = await supabaseClient
      .from("licenses")
      .select(LICENSE_SELECT)
      .eq("app_id", appId)
      .eq("discord_user_id", profile.discordUserId)
      .order("expires_at", { ascending: false, nullsFirst: false })
      .limit(5);

    rows.push(...(Array.isArray(discordMatches) ? discordMatches : []));
  }

  return rows;
}

export async function fetchLinkedLicense(supabaseClient, { appId, licenseKey, profile }) {
  if (!appId) return null;

  if (licenseKey) {
    return queryLicenseByKey(licenseKey, appId);
  }

  const profileRows = await queryLicensesForProfile(supabaseClient, appId, profile);
  return profileRows[0] || null;
}

export async function syncLinkedLicense(supabaseClient, { appId, licenseKey, profile }) {
  if (!appId) {
    return { license: null, mode: "empty", keyMissing: false };
  }

  if (licenseKey) {
    const license = await queryLicenseByKey(licenseKey, appId);
    if (!license) {
      return { license: null, mode: "empty", keyMissing: true };
    }

    return {
      license,
      mode: resolveSubscriptionMode(license),
      keyMissing: false,
    };
  }

  const license = await fetchLinkedLicense(supabaseClient, { appId, licenseKey: null, profile });
  const mode = license ? resolveSubscriptionMode(license) : profile?.authUserId ? "pending" : "empty";

  return { license, mode, keyMissing: false };
}

export function licenseBelongsToProfile(license, profile) {
  if (!license || !profile?.authUserId) return false;

  const linkedAuthId = String(license.discord_auth_user_id || "").trim();
  if (linkedAuthId) return linkedAuthId === profile.authUserId;

  const linkedDiscordId = String(license.discord_user_id || "").trim();
  if (linkedDiscordId && profile.discordUserId) {
    return linkedDiscordId === profile.discordUserId;
  }

  return false;
}

export async function resolveRestoredSubscriptionSession(supabaseClient, { appId, productSlug, authUser }) {
  if (!appId || !authUser) {
    return { redeemState: null, clearStorage: false };
  }

  const profile = extractDiscordProfile(authUser);
  const completed = loadCompletedRedeem(productSlug, appId);
  let staleCompleted = false;

  if (completed?.licenseKey) {
    const storedResult = await syncLinkedLicense(supabaseClient, {
      appId,
      licenseKey: completed.licenseKey,
      profile,
    });

    if (storedResult.license && licenseBelongsToProfile(storedResult.license, profile)) {
      if (isExpiredLinkedLicense(storedResult.license)) {
        return { redeemState: null, clearStorage: true };
      }

      return {
        redeemState: {
          licenseKey: String(storedResult.license.license_key || completed.licenseKey).trim(),
          profile,
        },
        clearStorage: false,
      };
    }

    staleCompleted = true;
  }

  const profileResult = await syncLinkedLicense(supabaseClient, {
    appId,
    licenseKey: null,
    profile,
  });

  if (profileResult.license && licenseBelongsToProfile(profileResult.license, profile)) {
    if (isExpiredLinkedLicense(profileResult.license)) {
      return { redeemState: null, clearStorage: true };
    }

    return {
      redeemState: {
        licenseKey: String(profileResult.license.license_key || "").trim(),
        profile,
      },
      clearStorage: false,
    };
  }

  return { redeemState: null, clearStorage: staleCompleted };
}
