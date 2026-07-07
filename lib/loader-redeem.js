import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PENDING_REDEEM_KEY = "loader_pending_redeem_v1";
export const COMPLETED_REDEEM_KEY = "loader_completed_redeem_v1";
export const DISCORD_AUTH_INTENT_KEY = "loader_discord_auth_intent_v1";
export const APP_META_CACHE_KEY = "loader_application_meta_cache_v1";

export const REDEEM_STEP_LABELS = ["License Verification", "Discord Connection", "Download Access"];
export const REDEEM_STEP_SCALES = ["0.333333", "0.666667", "1"];

export const LOADER_APP_IDS = {
  "fortnite-private": "1c4ff4689590600f",
  "hwid-spoofer": "49a4f8ea0801ead8",
  "arc-raiders": process.env.NEXT_PUBLIC_LOADER_APP_ID_ARC_RAIDERS || "",
};

const APPLICATION_META_PUBLIC_SELECT = "id, app_id, version, status, download_updated_at";
const APPLICATION_META_PRIVATE_SELECT = `${APPLICATION_META_PUBLIC_SELECT}, download_file_name, download_file_type, download_file_size, download_file_data_base64`;

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getLoaderAppId(slug) {
  return String(LOADER_APP_IDS[slug] || "").trim();
}

export function getRedeemRedirectUrl(productSlug) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/loader/${productSlug}`;
}

export function createScopedLicenseClient(licenseKey, appId) {
  if (!supabaseUrl || !supabaseAnonKey || !licenseKey || !appId) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-license-key": licenseKey,
        "x-app-id": appId,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function normalizeLicenseStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function extractDiscordProfile(user) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity) => identity?.provider === "discord") || identities[0] || null;
  const identityData = discordIdentity?.identity_data || {};
  const meta = { ...(user?.user_metadata || {}), ...identityData };
  const discordUserId = String(meta.provider_id || meta.sub || "").trim();
  const avatarHash = String(meta.avatar || "").trim();
  let avatarUrl = String(meta.avatar_url || meta.picture || "").trim();

  if (!avatarUrl && discordUserId && avatarHash) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarHash}.png?size=128`;
  }

  const username =
    meta.preferred_username ||
    meta.global_name ||
    meta.user_name ||
    meta.name ||
    meta.full_name ||
    user?.email ||
    "-";

  return {
    authUserId: String(user?.id || "").trim(),
    discordUserId,
    username: String(username || "-").trim() || "-",
    avatarUrl,
  };
}

function matchesProduct(payload, productSlug, appId) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.productSlug) return payload.productSlug === productSlug;
  if (payload.appId) return payload.appId === appId;
  return false;
}

export function loadPendingRedeem(productSlug, appId) {
  const payload = safeJsonParse(typeof window !== "undefined" ? localStorage.getItem(PENDING_REDEEM_KEY) || "" : "");
  return matchesProduct(payload, productSlug, appId) ? payload : null;
}

export function savePendingRedeem(payload, productSlug, appId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PENDING_REDEEM_KEY,
    JSON.stringify({
      ...(payload || {}),
      appId: payload?.appId || appId,
      productSlug: payload?.productSlug || productSlug,
    }),
  );
}

export function clearPendingRedeem() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_REDEEM_KEY);
}

export function loadCompletedRedeem(productSlug, appId) {
  const payload = safeJsonParse(typeof window !== "undefined" ? localStorage.getItem(COMPLETED_REDEEM_KEY) || "" : "");
  return matchesProduct(payload, productSlug, appId) ? payload : null;
}

export function saveCompletedRedeem(payload, productSlug, appId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    COMPLETED_REDEEM_KEY,
    JSON.stringify({
      ...(payload || {}),
      appId: payload?.appId || appId,
      productSlug: payload?.productSlug || productSlug,
    }),
  );
}

export function clearCompletedRedeem(productSlug, appId) {
  if (typeof window === "undefined") return;
  const payload = safeJsonParse(localStorage.getItem(COMPLETED_REDEEM_KEY) || "");
  if (matchesProduct(payload, productSlug, appId)) {
    localStorage.removeItem(COMPLETED_REDEEM_KEY);
  }
}

export function saveDiscordAuthIntent(payload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISCORD_AUTH_INTENT_KEY, JSON.stringify(payload));
}

export function loadDiscordAuthIntent() {
  return safeJsonParse(typeof window !== "undefined" ? localStorage.getItem(DISCORD_AUTH_INTENT_KEY) || "" : "");
}

export function clearDiscordAuthIntent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DISCORD_AUTH_INTENT_KEY);
}

export async function validateLicense(licenseKey, appId) {
  const scopedClient = createScopedLicenseClient(licenseKey, appId);
  if (!scopedClient) return { ok: false, error: "Supabase client is not configured." };

  const { data, error } = await scopedClient
    .from("licenses")
    .select("id, license_key, app_id, status, activated_at, hwid, discord_auth_user_id, discord_user_id, discord_username, discord_avatar_url")
    .eq("license_key", licenseKey)
    .eq("app_id", appId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "License not found!" };
  if (String(data.app_id || "").trim() !== appId) {
    return { ok: false, error: "This license belongs to a different product." };
  }

  const status = normalizeLicenseStatus(data.status);
  if (status === "banned" || status === "revoked" || status === "disabled") {
    return { ok: false, error: "This license is not available for redeem." };
  }
  if (data.activated_at || data.hwid) {
    return { ok: false, error: "This license was already activated in the loader." };
  }

  return { ok: true, data };
}

export async function claimDiscordForLicense(licenseKey, appId, profile) {
  const scopedClient = createScopedLicenseClient(licenseKey, appId);
  if (!scopedClient) return { ok: false, error: "Supabase client is not configured." };

  const { data, error } = await scopedClient
    .from("licenses")
    .update({
      discord_auth_user_id: profile.authUserId,
      discord_user_id: profile.discordUserId,
      discord_username: profile.username,
      discord_avatar_url: profile.avatarUrl || null,
      discord_connected_at: new Date().toISOString(),
    })
    .eq("license_key", licenseKey)
    .eq("app_id", appId)
    .select("license_key, app_id, discord_username, discord_avatar_url, discord_auth_user_id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message || "Could not assign Discord to this license." };
  if (String(data.app_id || "").trim() !== appId) {
    return { ok: false, error: "This license belongs to a different product." };
  }

  return { ok: true, data };
}

function getCachedApplicationMeta(appId) {
  const cachedStore = safeJsonParse(typeof window !== "undefined" ? localStorage.getItem(APP_META_CACHE_KEY) || "" : "");
  if (!cachedStore || typeof cachedStore !== "object") return null;
  const cached = cachedStore[appId] || (cachedStore.app_id ? cachedStore : null);
  if (!cached || typeof cached !== "object") return null;
  return cached;
}

export function saveCachedApplicationMeta(app) {
  if (!app || typeof app !== "object" || typeof window === "undefined") return;
  try {
    const appId = app.app_id;
    const cachedStore = safeJsonParse(localStorage.getItem(APP_META_CACHE_KEY) || "");
    const nextStore = cachedStore && typeof cachedStore === "object" && !cachedStore.app_id ? cachedStore : {};
    nextStore[appId] = app;
    localStorage.setItem(APP_META_CACHE_KEY, JSON.stringify(nextStore));
  } catch {
    // ignore storage errors
  }
}

export function buildApplicationDownloadUrl(app) {
  const fileName = String(app?.download_file_name || "").trim();
  const mimeType = String(app?.download_file_type || "").trim() || "application/octet-stream";
  const base64Payload = String(app?.download_file_data_base64 || "").trim();
  if (!fileName || !base64Payload) return "";

  try {
    const bytes = Uint8Array.from(atob(base64Payload), (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch {
    return "";
  }
}

export async function fetchApplicationMeta(supabaseClient, appId, isLoggedIn) {
  if (!supabaseClient) return { ok: false, error: "Supabase client is not configured.", data: null };

  const selectClause = isLoggedIn ? APPLICATION_META_PRIVATE_SELECT : APPLICATION_META_PUBLIC_SELECT;
  const { data, error } = await supabaseClient.from("applications").select(selectClause).eq("app_id", appId).maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message || "Application metadata could not be loaded.", data: null };
  }

  return { ok: true, data };
}

export function restoreCachedApplicationMeta(appId) {
  return getCachedApplicationMeta(appId);
}

export function cleanupDiscordAuthReturnUrl() {
  if (typeof window === "undefined") return;
  if (!location.search.includes("code=") && !location.search.includes("state=")) return;
  history.replaceState({}, document.title, location.pathname + location.hash);
}

export function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLoaderAppDate(value) {
  const date = parseDateSafe(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildDownloadFileMeta(app) {
  const fileName = String(app?.download_file_name || "").trim();
  const parts = [];
  if (fileName) parts.push(fileName);
  if (app?.download_file_size) parts.push(formatFileSize(app.download_file_size));
  if (app?.download_updated_at) parts.push(formatLoaderAppDate(app.download_updated_at));
  return parts.length ? parts.join(" • ") : "No file uploaded yet.";
}

export async function resolveLoaderDownloadAccess(supabaseClient, appId, profile) {
  if (!appId || !profile?.authUserId) {
    return { downloadUrl: "", fileName: "", fileMeta: "No file uploaded yet." };
  }

  let appMeta = restoreCachedApplicationMeta(appId);
  const result = await fetchApplicationMeta(supabaseClient, appId, true);
  if (result.ok && result.data) {
    appMeta = result.data;
    saveCachedApplicationMeta(result.data);
  }

  if (!appMeta) {
    return { downloadUrl: "", fileName: "", fileMeta: "No file uploaded yet." };
  }

  const downloadUrl = buildApplicationDownloadUrl(appMeta);
  const fileName = String(appMeta.download_file_name || "").trim();
  return {
    downloadUrl,
    fileName,
    fileMeta: buildDownloadFileMeta(appMeta),
  };
}
