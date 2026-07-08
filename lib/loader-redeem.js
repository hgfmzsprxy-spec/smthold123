import { createClient } from "@supabase/supabase-js";
import { queryApplicationMetaRecord } from "./loader-application-meta";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const PENDING_REDEEM_KEY = "loader_pending_redeem_v2";
export const COMPLETED_REDEEM_KEY = "loader_completed_redeem_v2";
export const DISCORD_AUTH_INTENT_KEY = "loader_discord_auth_intent_v1";
export const APP_META_CACHE_KEY = "loader_application_meta_cache_v5";

const LEGACY_PENDING_REDEEM_KEY = "loader_pending_redeem_v1";
const LEGACY_COMPLETED_REDEEM_KEY = "loader_completed_redeem_v1";

export const REDEEM_STEP_LABELS = ["License Verification", "Discord Connection", "Download Access"];
export const REDEEM_STEP_SCALES = ["0.333333", "0.666667", "1"];

export const LOADER_APP_IDS = {
  "fortnite-private": "1c4ff4689590600f",
  "hwid-spoofer": "49a4f8ea0801ead8",
  "arc-raiders": process.env.NEXT_PUBLIC_LOADER_APP_ID_ARC_RAIDERS || "2d45cb4054ca401b",
};

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

export function isExpiredLicenseRecord(license) {
  if (!license) return false;

  const status = normalizeLicenseStatus(license.status);
  if (status === "expired") return true;

  if (!license.expires_at) return false;

  const expiresAt = new Date(license.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return false;

  return expiresAt.getTime() <= Date.now();
}

export const APPLICATION_PRODUCT_STATUSES = ["Undetected", "Maintenance", "Detected"];

export function formatApplicationProductStatus(status) {
  const normalized = String(status || "").trim();
  if (APPLICATION_PRODUCT_STATUSES.includes(normalized)) return normalized;

  const lowered = normalized.toLowerCase();
  if (lowered === "maintenance" || lowered === "paused") return "Maintenance";
  if (lowered === "detected") return "Detected";
  if (lowered === "undetected" || lowered === "active") return "Undetected";
  return "Undetected";
}

export function isApplicationFrozenRecord(app) {
  if (app?.is_frozen === true) return true;
  return String(app?.status || "").trim().toLowerCase() === "freezed";
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

function getProductStorageKey(productSlug, appId) {
  const slug = String(productSlug || "").trim();
  if (slug) return slug;
  return String(appId || "").trim() || "unknown";
}

function isLegacyRedeemPayload(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.licenseKey || value.productSlug || value.appId),
  );
}

function readRedeemStore(storageKey) {
  const store = safeJsonParse(typeof window !== "undefined" ? localStorage.getItem(storageKey) || "" : "");
  if (!store || typeof store !== "object" || Array.isArray(store)) return {};
  if (isLegacyRedeemPayload(store)) {
    const key = getProductStorageKey(store.productSlug, store.appId);
    return key ? { [key]: store } : {};
  }
  return store;
}

function writeRedeemStore(storageKey, store) {
  if (typeof window === "undefined") return;
  const entries = Object.entries(store || {}).filter(([, value]) => value && typeof value === "object");
  if (!entries.length) {
    localStorage.removeItem(storageKey);
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(entries)));
}

function migrateLegacyRedeemStorage() {
  if (typeof window === "undefined") return;

  const legacyCompleted = safeJsonParse(localStorage.getItem(LEGACY_COMPLETED_REDEEM_KEY) || "");
  if (isLegacyRedeemPayload(legacyCompleted)) {
    const completedStore = readRedeemStore(COMPLETED_REDEEM_KEY);
    const key = getProductStorageKey(legacyCompleted.productSlug, legacyCompleted.appId);
    if (key && !completedStore[key]) {
      completedStore[key] = legacyCompleted;
      writeRedeemStore(COMPLETED_REDEEM_KEY, completedStore);
    }
    localStorage.removeItem(LEGACY_COMPLETED_REDEEM_KEY);
  }

  const legacyPending = safeJsonParse(localStorage.getItem(LEGACY_PENDING_REDEEM_KEY) || "");
  if (isLegacyRedeemPayload(legacyPending)) {
    const pendingStore = readRedeemStore(PENDING_REDEEM_KEY);
    const key = getProductStorageKey(legacyPending.productSlug, legacyPending.appId);
    if (key && !pendingStore[key]) {
      pendingStore[key] = legacyPending;
      writeRedeemStore(PENDING_REDEEM_KEY, pendingStore);
    }
    localStorage.removeItem(LEGACY_PENDING_REDEEM_KEY);
  }
}

function getRedeemEntry(storageKey, productSlug, appId) {
  migrateLegacyRedeemStorage();
  const key = getProductStorageKey(productSlug, appId);
  if (!key) return null;
  const store = readRedeemStore(storageKey);
  const payload = store[key];
  return matchesProduct(payload, productSlug, appId) ? payload : null;
}

function setRedeemEntry(storageKey, productSlug, appId, payload) {
  migrateLegacyRedeemStorage();
  const key = getProductStorageKey(productSlug, appId);
  if (!key) return;

  const store = readRedeemStore(storageKey);
  store[key] = {
    ...(payload || {}),
    appId: payload?.appId || appId,
    productSlug: payload?.productSlug || productSlug,
  };
  writeRedeemStore(storageKey, store);
}

function removeRedeemEntry(storageKey, productSlug, appId) {
  migrateLegacyRedeemStorage();
  const key = getProductStorageKey(productSlug, appId);
  if (!key) return;

  const store = readRedeemStore(storageKey);
  if (!store[key]) return;

  delete store[key];
  writeRedeemStore(storageKey, store);
}

export function loadAllCompletedRedeems() {
  migrateLegacyRedeemStorage();
  return readRedeemStore(COMPLETED_REDEEM_KEY);
}

export function loadPendingRedeem(productSlug, appId) {
  return getRedeemEntry(PENDING_REDEEM_KEY, productSlug, appId);
}

export function savePendingRedeem(payload, productSlug, appId) {
  setRedeemEntry(PENDING_REDEEM_KEY, productSlug, appId, payload);
}

export function clearPendingRedeem(productSlug, appId) {
  if (!productSlug && !appId) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PENDING_REDEEM_KEY);
    return;
  }

  removeRedeemEntry(PENDING_REDEEM_KEY, productSlug, appId);
}

export function loadCompletedRedeem(productSlug, appId) {
  return getRedeemEntry(COMPLETED_REDEEM_KEY, productSlug, appId);
}

export function saveCompletedRedeem(payload, productSlug, appId) {
  setRedeemEntry(COMPLETED_REDEEM_KEY, productSlug, appId, payload);
}

export function clearCompletedRedeem(productSlug, appId) {
  removeRedeemEntry(COMPLETED_REDEEM_KEY, productSlug, appId);
}

export function clearLoaderSubscriptionSession(productSlug, appId) {
  clearCompletedRedeem(productSlug, appId);
  clearPendingRedeem(productSlug, appId);
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

export async function checkApplicationFrozen(supabaseClient, appId) {
  if (!supabaseClient || !appId) return false;

  const result = await fetchApplicationMeta(supabaseClient, appId, false);
  if (!result.ok || !result.data) return false;
  return isApplicationFrozenRecord(result.data);
}

export async function validateLicense(licenseKey, appId) {
  const scopedClient = createScopedLicenseClient(licenseKey, appId);
  if (!scopedClient) return { ok: false, error: "Supabase client is not configured." };

  const { data, error } = await scopedClient
    .from("licenses")
    .select("id, license_key, app_id, status, activated_at, expires_at, hwid, discord_auth_user_id, discord_user_id, discord_username, discord_avatar_url")
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
  if (isExpiredLicenseRecord(data)) {
    return { ok: false, error: "This license has expired." };
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
  return queryApplicationMetaRecord(supabaseClient, appId, isLoggedIn);
}

async function fetchApplicationMetaFromApi(appId) {
  if (typeof window === "undefined" || !appId) return { ok: false, error: "Unavailable.", data: null };

  try {
    const response = await fetch(`/api/loader-meta?appId=${encodeURIComponent(appId)}`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: "Application metadata could not be loaded.", data: null };
    }

    const body = await response.json();
    if (!body?.app || typeof body.app !== "object") {
      return { ok: false, error: "Application metadata could not be loaded.", data: null };
    }

    return { ok: true, data: body.app, error: null };
  } catch {
    return { ok: false, error: "Application metadata could not be loaded.", data: null };
  }
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
  const text = String(value || "").trim();
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) return text;

  const date = parseDateSafe(value);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatDisplayDateTime(value) {
  const date = parseDateSafe(value);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function formatFallbackUpdated(value) {
  const text = String(value || "").trim();
  if (!text) return "-";

  const formatted = formatLoaderAppDate(text);
  return formatted !== "-" ? formatted : text;
}

function resolveLastUpdateSource(app) {
  const downloadUpdatedAt = String(app?.download_updated_at || "").trim();
  if (downloadUpdatedAt) return downloadUpdatedAt;

  const createdAt = String(app?.created_at || "").trim();
  if (createdAt) return createdAt;

  return null;
}

export function resolveLoaderDisplayMeta(app, fallback = {}) {
  const version = String(app?.version || "").trim() || String(fallback.version || "").trim() || "-";
  const status = formatApplicationProductStatus(app?.status || fallback.status);
  const lastUpdateSource = resolveLastUpdateSource(app);
  const lastUpdate = lastUpdateSource
    ? formatLoaderAppDate(lastUpdateSource)
    : formatFallbackUpdated(fallback.updated);

  return { version, lastUpdate, status };
}

export function getStaticLoaderDisplayMetaMap(items = []) {
  return Object.fromEntries(
    items.map((item) => [item.slug, resolveLoaderDisplayMeta(null, item)]),
  );
}

export function getInitialLoaderDisplayMetaMap(items = []) {
  if (typeof window === "undefined") {
    return getStaticLoaderDisplayMetaMap(items);
  }

  return Object.fromEntries(
    items.map((item) => {
      const appId = getLoaderAppId(item.slug);
      const cached = appId ? getCachedApplicationMeta(appId) : null;
      return [item.slug, resolveLoaderDisplayMeta(cached, item)];
    }),
  );
}

export async function refreshLoaderDisplayMetaMap(items = []) {
  const appIds = [...new Set(items.map((item) => getLoaderAppId(item.slug)).filter(Boolean))];
  if (!appIds.length) {
    return getInitialLoaderDisplayMetaMap(items);
  }

  try {
    const response = await fetch(
      `/api/loader-meta?appIds=${appIds.map((appId) => encodeURIComponent(appId)).join(",")}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const body = await response.json();
      const appsById = body?.apps && typeof body.apps === "object" ? body.apps : {};

      return Object.fromEntries(
        items.map((item) => {
          const appId = getLoaderAppId(item.slug);
          const app = appId ? appsById[appId] : null;
          if (app) saveCachedApplicationMeta(app);
          const cached = app || (appId ? getCachedApplicationMeta(appId) : null);
          return [item.slug, resolveLoaderDisplayMeta(cached, item)];
        }),
      );
    }
  } catch {
    // fall back to cache/static values below
  }

  return getInitialLoaderDisplayMetaMap(items);
}

export async function fetchLoaderDisplayMeta(supabaseClient, appId, fallback = {}, options = {}) {
  const preferApi = options?.preferApi === true;

  if (!appId) {
    return resolveLoaderDisplayMeta(null, fallback);
  }

  if (preferApi) {
    const apiResult = await fetchApplicationMetaFromApi(appId);
    if (apiResult.ok && apiResult.data) {
      saveCachedApplicationMeta(apiResult.data);
      return resolveLoaderDisplayMeta(apiResult.data, fallback);
    }

    const cached = getCachedApplicationMeta(appId);
    if (cached) {
      return resolveLoaderDisplayMeta(cached, fallback);
    }

    return resolveLoaderDisplayMeta(null, fallback);
  }

  let result = supabaseClient
    ? await fetchApplicationMeta(supabaseClient, appId, false)
    : { ok: false, error: "Supabase client is not configured.", data: null };

  if (!result.ok && supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      result = await fetchApplicationMeta(supabaseClient, appId, true);
    }
  }

  if (!result.ok) {
    result = await fetchApplicationMetaFromApi(appId);
  }

  if (result.ok && result.data) {
    saveCachedApplicationMeta(result.data);
    return resolveLoaderDisplayMeta(result.data, fallback);
  }

  const cached = getCachedApplicationMeta(appId);
  if (cached) {
    return resolveLoaderDisplayMeta(cached, fallback);
  }

  return resolveLoaderDisplayMeta(null, fallback);
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
