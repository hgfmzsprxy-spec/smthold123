import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import { getLicenseRemainingMs } from "./license-freeze";
import {
  ensureProtectionsBucket,
  PANEL_PROTECTIONS_BUCKET,
} from "./panel-protections";
import { getResellerDisplayName, readResellersStore } from "./resellers";
import { readStorageJson, writeStorageJson } from "./storage-json";
import {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
} from "./panel-protection-log-columns";

export {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
  defaultProtectionLogColumns,
} from "./panel-protection-log-columns";

const TABLE = "protection_logs";
export const PROTECTION_SCREENSHOTS_BUCKET = "protection-screenshots";
export const PROTECTION_LOG_IGNORED_USERS_PATH = "protection-log-ignored-users.json";
export const PROTECTION_LOG_IGNORED_USERS_VERSIONS_FOLDER = "protection-log-ignored-users-versions";
export const PROTECTION_LOG_IGNORED_USERS_VERSIONS_PREFIX = `${PROTECTION_LOG_IGNORED_USERS_VERSIONS_FOLDER}/`;
const MAX_IGNORED_USER_VERSIONS = 30;
const MAX_PROTECTION_LOGS = 500;
const SCREENSHOT_SIGNED_URL_SECONDS = 60 * 60;

let memoryIgnoredUsersStore = null;

export function normalizeIgnoredProtectionLogUserIds(value) {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(value?.user_ids)
      ? value.user_ids
      : Array.isArray(value?.ignored_user_ids)
        ? value.ignored_user_ids
        : [];
  const seen = new Set();
  const ids = [];
  for (const entry of source) {
    const id = String(entry || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function isProtectionLogUserIgnored(userId, ignoredIds = []) {
  const id = String(userId || "").trim();
  if (!id) return false;
  const list = Array.isArray(ignoredIds) ? ignoredIds : [];
  return list.some((entry) => String(entry || "").trim() === id);
}

function setMemoryIgnoredUsersStore(userIds, versionPath, fromWrite = false) {
  memoryIgnoredUsersStore = {
    ignored_user_ids: normalizeIgnoredProtectionLogUserIds(userIds),
    versionPath: versionPath || null,
    writtenAt: Date.now(),
    fromWrite: Boolean(fromWrite),
  };
}

async function downloadIgnoredUsersPayload(admin, path) {
  const parsed = await readStorageJson(PANEL_PROTECTIONS_BUCKET, path, admin);
  if (!parsed) return null;
  return {
    ignored_user_ids: normalizeIgnoredProtectionLogUserIds(parsed),
    updated_at: String(parsed?.updated_at || "").trim() || null,
  };
}

async function listLatestIgnoredUsersVersionPath(admin) {
  const { data, error } = await admin.storage.from(PANEL_PROTECTIONS_BUCKET).list(
    PROTECTION_LOG_IGNORED_USERS_VERSIONS_FOLDER,
    {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    }
  );
  if (error || !Array.isArray(data) || !data.length) return null;
  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return files[0] ? `${PROTECTION_LOG_IGNORED_USERS_VERSIONS_PREFIX}${files[0]}` : null;
}

async function pruneIgnoredUsersVersions(admin) {
  const { data, error } = await admin.storage.from(PANEL_PROTECTIONS_BUCKET).list(
    PROTECTION_LOG_IGNORED_USERS_VERSIONS_FOLDER,
    {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    }
  );
  if (error || !Array.isArray(data) || data.length <= MAX_IGNORED_USER_VERSIONS) return;

  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const stale = files
    .slice(MAX_IGNORED_USER_VERSIONS)
    .map((name) => `${PROTECTION_LOG_IGNORED_USERS_VERSIONS_PREFIX}${name}`);
  if (!stale.length) return;
  await admin.storage.from(PANEL_PROTECTIONS_BUCKET).remove(stale);
}

export async function readIgnoredProtectionLogUserIds(admin = getSupabaseAdmin()) {
  await ensureProtectionsBucket(admin);

  try {
    const latestPath = await listLatestIgnoredUsersVersionPath(admin);
    if (latestPath) {
      if (
        memoryIgnoredUsersStore?.fromWrite &&
        memoryIgnoredUsersStore.versionPath &&
        memoryIgnoredUsersStore.versionPath > latestPath &&
        Date.now() - memoryIgnoredUsersStore.writtenAt < 15_000
      ) {
        return memoryIgnoredUsersStore.ignored_user_ids;
      }

      const versioned = await downloadIgnoredUsersPayload(admin, latestPath);
      if (versioned) {
        setMemoryIgnoredUsersStore(versioned.ignored_user_ids, latestPath, false);
        return versioned.ignored_user_ids;
      }
    }
  } catch {
    // fall through
  }

  if (memoryIgnoredUsersStore?.fromWrite && Date.now() - memoryIgnoredUsersStore.writtenAt < 15_000) {
    return memoryIgnoredUsersStore.ignored_user_ids;
  }

  const legacy = await downloadIgnoredUsersPayload(admin, PROTECTION_LOG_IGNORED_USERS_PATH);
  if (legacy) {
    setMemoryIgnoredUsersStore(legacy.ignored_user_ids, PROTECTION_LOG_IGNORED_USERS_PATH, false);
    return legacy.ignored_user_ids;
  }

  return [];
}

export async function writeIgnoredProtectionLogUserIds(userIds, admin = getSupabaseAdmin()) {
  await ensureProtectionsBucket(admin);
  const ignored_user_ids = normalizeIgnoredProtectionLogUserIds(userIds);
  const payload = {
    ignored_user_ids,
    updated_at: new Date().toISOString(),
  };
  const versionPath = `${PROTECTION_LOG_IGNORED_USERS_VERSIONS_PREFIX}${Date.now()}-${randomUUID()}.json`;

  // New object key each write → no CDN overwrite lag for the source of truth.
  await writeStorageJson(PANEL_PROTECTIONS_BUCKET, versionPath, payload, admin);

  const verified = await downloadIgnoredUsersPayload(admin, versionPath);
  if (!verified) {
    throw new Error("Ignored user IDs write verification failed.");
  }

  setMemoryIgnoredUsersStore(verified.ignored_user_ids, versionPath, true);

  // Legacy path kept for older readers (best-effort).
  void writeStorageJson(PANEL_PROTECTIONS_BUCKET, PROTECTION_LOG_IGNORED_USERS_PATH, payload, admin).catch(
    () => {}
  );
  void pruneIgnoredUsersVersions(admin).catch(() => {});

  return {
    ignored_user_ids: verified.ignored_user_ids,
    updated_at: verified.updated_at || payload.updated_at,
  };
}

function normalizeScreenshotEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    const path = entry.trim();
    if (!path) return null;
    return { path, monitor: null, width: null, height: null, url: "", mime: "image/jpeg", data: "" };
  }
  if (typeof entry !== "object") return null;

  const data = String(entry.data || entry.b64 || entry.base64 || "").trim();
  const path = String(entry.path || entry.Path || "").trim();
  if (!data && !path) return null;

  const mime = String(entry.mime || entry.content_type || "image/jpeg").trim() || "image/jpeg";
  const monitorRaw = entry.monitor ?? entry.Monitor;
  const widthRaw = entry.width ?? entry.Width;
  const heightRaw = entry.height ?? entry.Height;

  let url = String(entry.url || entry.signedUrl || entry.signed_url || "").trim();
  if (!url && data) {
    url = `data:${mime};base64,${data}`;
  }

  return {
    path,
    monitor: Number.isFinite(Number(monitorRaw)) ? Number(monitorRaw) : null,
    width: Number.isFinite(Number(widthRaw)) ? Number(widthRaw) : null,
    height: Number.isFinite(Number(heightRaw)) ? Number(heightRaw) : null,
    mime,
    data,
    url,
  };
}

function normalizeScreenshots(value) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source.map(normalizeScreenshotEntry).filter(Boolean);
}

function formatTimeLeftLabel(ms) {
  if (ms == null) return "—";
  if (!Number.isFinite(ms)) return "Unlimited";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatExpirationLabel(expiresAt) {
  const raw = String(expiresAt || "").trim();
  if (!raw) return "Unlimited";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString();
}

export function normalizeProtectionLogEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  if (!id) return null;

  const resellerId = String(entry.reseller_id || entry.resellerId || "").trim();
  const isLocal = !resellerId;
  const createdAt = String(entry.created_at || entry.createdAt || "").trim() || new Date().toISOString();
  const expiresAt = String(entry.expires_at || entry.expiresAt || "").trim();
  // Prefer the snapshot saved at launch. Only recompute as a fallback for older rows,
  // and always relative to created_at — never "now", so refresh doesn't tick down.
  const storedTimeLeft = String(entry.time_left || entry.timeLeft || "").trim();
  const createdAtMs = Date.parse(createdAt);
  const remainingAtLaunchMs = getLicenseRemainingMs(
    { expires_at: expiresAt || null },
    Number.isFinite(createdAtMs) ? createdAtMs : Date.now()
  );

  return {
    id,
    created_at: createdAt,
    success: entry.success !== false && entry.success !== 0 && entry.success !== "false",
    message: String(entry.message || "").trim(),
    application: String(entry.application || entry.app_name || entry.appName || "").trim(),
    app_id: String(entry.app_id || entry.appId || "").trim(),
    reseller_id: isLocal ? "" : resellerId,
    reseller: isLocal
      ? LOCAL_PROTECTION_SOURCE_LABEL
      : String(entry.reseller || entry.reseller_name || entry.resellerName || "").trim() || resellerId,
    source_id: isLocal ? LOCAL_PROTECTION_SOURCE_ID : resellerId,
    discord_username: String(entry.discord_username || entry.discordUsername || "").trim(),
    discord_avatar_url: String(entry.discord_avatar_url || entry.discordAvatarUrl || "").trim(),
    discord_user_id: String(entry.discord_user_id || entry.discordUserId || "").trim(),
    discord_email: String(entry.discord_email || entry.discordEmail || "").trim(),
    license_key: String(entry.license_key || entry.licenseKey || entry.license || "").trim(),
    product_variant: String(entry.product_variant || entry.productVariant || "").trim(),
    expires_at: expiresAt,
    expiration: String(entry.expiration || "").trim() || formatExpirationLabel(expiresAt),
    time_left: storedTimeLeft || formatTimeLeftLabel(remainingAtLaunchMs),
    hwid: String(entry.hwid || entry.hardware_id || "").trim(),
    screenshots: normalizeScreenshots(entry.screenshots),
  };
}

async function attachSignedScreenshotUrls(entries, admin = getSupabaseAdmin()) {
  const list = Array.isArray(entries) ? entries : [];

  const pathsToSign = new Set();
  for (const entry of list) {
    if (!entry?.screenshots?.length) continue;
    for (const shot of entry.screenshots) {
      if (shot?.url || shot?.data) continue;
      if (shot?.path) pathsToSign.add(shot.path);
    }
  }

  const urlMap = new Map();
  if (pathsToSign.size > 0) {
    const pathsArray = Array.from(pathsToSign);
    const chunkSize = 100;
    
    const chunks = [];
    for (let i = 0; i < pathsArray.length; i += chunkSize) {
      chunks.push(pathsArray.slice(i, i + chunkSize));
    }

    // Process chunks with limited concurrency (e.g., 3 at a time)
    const CONCURRENCY = 3;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const batch = chunks.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (chunk) => {
          try {
            const { data, error } = await admin.storage
              .from(PROTECTION_SCREENSHOTS_BUCKET)
              .createSignedUrls(chunk, SCREENSHOT_SIGNED_URL_SECONDS);

            if (Array.isArray(data)) {
              for (const item of data) {
                if (item?.path && (item?.signedUrl || item?.signedURL)) {
                  urlMap.set(item.path, item.signedUrl || item.signedURL);
                }
              }
            }
          } catch {
            // fallback if bulk fails
          }
        })
      );
    }
  }

  for (const entry of list) {
    if (!entry?.screenshots?.length) continue;
    entry.screenshots = entry.screenshots.map((shot) => {
      if (shot?.url) {
        return shot.data ? { ...shot, data: "" } : shot;
      }
      if (shot?.data) {
        return {
          ...shot,
          data: "",
          url: `data:${shot.mime || "image/jpeg"};base64,${shot.data}`,
        };
      }
      if (!shot?.path) return shot;
      const signedUrl = urlMap.get(shot.path);
      if (signedUrl) {
        return { ...shot, url: signedUrl };
      }
      return shot;
    });
  }

  return list;
}

function matchesProtectionLogFilter(entry, appId = "", sourceId = "") {
  if (!entry) return false;
  if (appId && appId !== "all" && String(entry.app_id || "") !== appId) return false;
  if (sourceId && sourceId !== "all") {
    if (sourceId === LOCAL_PROTECTION_SOURCE_ID) {
      if (String(entry.reseller_id || "").trim()) return false;
    } else if (String(entry.reseller_id || "") !== sourceId) {
      return false;
    }
  }
  return true;
}

export async function deleteProtectionLogsByFilter(
  { appId = "all", sourceId = "all" } = {},
  admin = getSupabaseAdmin()
) {
  const { data, error: readError } = await admin
    .from(TABLE)
    .select("id, app_id, reseller_id, screenshots")
    .order("created_at", { ascending: false })
    .limit(MAX_PROTECTION_LOGS);

  if (readError) throw readError;

  const matched = (data || [])
    .map((row) => normalizeProtectionLogEntry(row))
    .filter((entry) => matchesProtectionLogFilter(entry, String(appId || "all"), String(sourceId || "all")));

  if (!matched.length) {
    return { deleted: 0, ids: [] };
  }

  const ids = matched.map((entry) => entry.id).filter(Boolean);
  const storagePaths = matched.flatMap((entry) =>
    (entry.screenshots || []).map((shot) => String(shot?.path || "").trim()).filter(Boolean)
  );

  if (storagePaths.length) {
    await admin.storage.from(PROTECTION_SCREENSHOTS_BUCKET).remove(storagePaths).catch(() => {});
  }

  const { error } = await admin.from(TABLE).delete().in("id", ids);
  if (error) throw error;

  return { deleted: ids.length, ids };
}

export async function deleteProtectionLogById(id, admin = getSupabaseAdmin()) {
  const logId = String(id || "").trim();
  if (!logId) throw new Error("Log id is required.");

  const { data, error: readError } = await admin
    .from(TABLE)
    .select("id, screenshots")
    .eq("id", logId)
    .maybeSingle();

  if (readError) throw readError;
  if (!data) return { deleted: 0, ids: [] };

  const entry = normalizeProtectionLogEntry(data);
  const storagePaths = (entry?.screenshots || [])
    .map((shot) => String(shot?.path || "").trim())
    .filter(Boolean);

  if (storagePaths.length) {
    await admin.storage.from(PROTECTION_SCREENSHOTS_BUCKET).remove(storagePaths).catch(() => {});
  }

  const { error } = await admin.from(TABLE).delete().eq("id", logId);
  if (error) throw error;

  return { deleted: 1, ids: [logId] };
}

export function sortProtectionLogEntries(entries) {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

function rowToEntry(row) {
  return normalizeProtectionLogEntry(row);
}

export async function readProtectionLogStore(admin = getSupabaseAdmin(), options = {}) {
  const signScreenshots = options.signScreenshots !== false;

  const { data, error } = await admin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_PROTECTION_LOGS);

  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message || "")) {
      throw new Error(
        "protection_logs table is missing. Run supabase/protection-logs.sql in the Supabase SQL Editor."
      );
    }
    throw error;
  }

  const resellerStore = await readResellersStore(admin).catch(() => ({ resellers: [] }));
  const resellerById = new Map(
    (resellerStore.resellers || []).map((entry) => [String(entry.id), entry])
  );

  const ignoredUserIds = await readIgnoredProtectionLogUserIds(admin).catch(() => []);
  const ignoredSet = new Set(ignoredUserIds.map((id) => String(id)));

  const entries = sortProtectionLogEntries(
    (data || [])
      .map((row) => {
        const entry = rowToEntry(row);
        if (!entry) return null;
        if (entry.discord_user_id && ignoredSet.has(String(entry.discord_user_id))) {
          return null;
        }
        if (entry.reseller_id) {
          const reseller = resellerById.get(entry.reseller_id);
          if (reseller) entry.reseller = getResellerDisplayName(reseller);
        } else {
          entry.reseller = LOCAL_PROTECTION_SOURCE_LABEL;
        }
        // Bootstrap path: drop embedded screenshot payloads to keep the response small.
        if (!signScreenshots && Array.isArray(entry.screenshots)) {
          entry.screenshots = entry.screenshots.map((shot) => ({
            ...shot,
            data: "",
            url: String(shot?.url || "").startsWith("data:") ? "" : String(shot?.url || ""),
          }));
        }
        return entry;
      })
      .filter(Boolean)
  );

  if (signScreenshots) {
    await attachSignedScreenshotUrls(entries, admin);
  }
  return { entries, ignored_user_ids: ignoredUserIds };
}

export async function signProtectionLogScreenshots(entries, admin = getSupabaseAdmin()) {
  const list = Array.isArray(entries) ? entries : [];
  await attachSignedScreenshotUrls(list, admin);
  return list;
}

/** Sign a flat list of storage paths → { [path]: signedUrl }. */
export async function signProtectionLogScreenshotPaths(paths, admin = getSupabaseAdmin()) {
  const unique = Array.from(
    new Set((Array.isArray(paths) ? paths : []).map((p) => String(p || "").trim()).filter(Boolean))
  ).slice(0, 80);

  if (!unique.length) return {};

  const urlMap = {};
  const chunkSize = 50;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    try {
      const { data } = await admin.storage
        .from(PROTECTION_SCREENSHOTS_BUCKET)
        .createSignedUrls(chunk, SCREENSHOT_SIGNED_URL_SECONDS);
      if (Array.isArray(data)) {
        for (const item of data) {
          const path = String(item?.path || "").trim();
          const url = item?.signedUrl || item?.signedURL;
          if (path && url) urlMap[path] = url;
        }
      }
    } catch {
      // skip chunk
    }
  }
  return urlMap;
}

function buildProductVariantLabel(license) {
  const variant =
    String(license?.variant_label || license?.variantLabel || "").trim() ||
    (license?.duration_unit
      ? String(license.duration_unit).toLowerCase() === "unlimited"
        ? "Lifetime"
        : `${license.duration_value || ""} ${license.duration_unit || ""}`.trim()
      : "");

  return variant || "—";
}

async function resolveDiscordEmail(admin, license, fallbackEmail = "") {
  const direct = String(fallbackEmail || license?.discord_email || "").trim();
  if (direct) return direct;

  const authUserId = String(license?.discord_auth_user_id || "").trim();
  if (!authUserId) return "";

  try {
    const { data, error } = await admin.auth.admin.getUserById(authUserId);
    if (error || !data?.user) return "";
    return String(data.user.email || "").trim();
  } catch {
    return "";
  }
}

export async function buildProtectionLogFromLicense({
  license,
  appId = "",
  success = false,
  message = "",
  hardwareId = "",
  discordUsername = "",
  discordAvatarUrl = "",
  discordUserId = "",
  discordEmail = "",
  admin = getSupabaseAdmin(),
}) {
  if (!license) throw new Error("License is required.");

  const resellerStore = await readResellersStore(admin);
  const resellerId = String(license.reseller_id || "").trim();
  const reseller = resellerId
    ? (resellerStore.resellers || []).find((entry) => String(entry.id) === resellerId) || null
    : null;

  const email = await resolveDiscordEmail(admin, license, discordEmail);
  const expiresAt = String(license.expires_at || "").trim();
  const remainingMs = getLicenseRemainingMs(license);

  return normalizeProtectionLogEntry({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    success: Boolean(success),
    message: String(message || "").trim(),
    application: String(license.app_name || "").trim() || String(appId || license.app_id || "").trim(),
    app_id: String(license.app_id || appId || "").trim(),
    reseller_id: resellerId,
    reseller: reseller ? getResellerDisplayName(reseller) : resellerId ? resellerId : LOCAL_PROTECTION_SOURCE_LABEL,
    discord_username: String(discordUsername || license.discord_username || "").trim(),
    discord_avatar_url: String(discordAvatarUrl || license.discord_avatar_url || "").trim(),
    discord_user_id: String(discordUserId || license.discord_user_id || "").trim(),
    discord_email: email,
    license_key: String(license.license_key || "").trim(),
    product_variant: buildProductVariantLabel(license),
    expires_at: expiresAt,
    expiration: formatExpirationLabel(expiresAt),
    time_left: formatTimeLeftLabel(remainingMs),
    hwid: String(hardwareId || license.hwid || "").trim(),
  });
}

export async function appendProtectionLog(entry, admin = getSupabaseAdmin()) {
  const normalized = normalizeProtectionLogEntry(entry);
  if (!normalized) throw new Error("Invalid protection log entry.");

  const row = {
    id: normalized.id || randomUUID(),
    created_at: normalized.created_at || new Date().toISOString(),
    success: Boolean(normalized.success),
    message: normalized.message || "",
    application: normalized.application || "",
    app_id: normalized.app_id || "",
    reseller_id: normalized.reseller_id || "",
    reseller: normalized.reseller || "",
    discord_username: normalized.discord_username || "",
    discord_avatar_url: normalized.discord_avatar_url || "",
    discord_user_id: normalized.discord_user_id || "",
    discord_email: normalized.discord_email || "",
    license_key: normalized.license_key || "",
    product_variant: normalized.product_variant || "",
    expires_at: normalized.expires_at || null,
    expiration: normalized.expiration || "",
    time_left: normalized.time_left || "",
    hwid: normalized.hwid || "",
    screenshots: Array.isArray(normalized.screenshots) ? normalized.screenshots : [],
  };

  const { data, error } = await admin.from(TABLE).insert(row).select("*").maybeSingle();
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message || "")) {
      throw new Error(
        "protection_logs table is missing. Run supabase/protection-logs.sql in the Supabase SQL Editor."
      );
    }
    throw error;
  }

  return { entry: normalizeProtectionLogEntry(data || row), entries: [] };
}

export async function lookupLicenseForProtectionLog(licenseKey, appId, admin = getSupabaseAdmin()) {
  const key = String(licenseKey || "").trim();
  const scopedAppId = String(appId || "").trim();
  if (!key) return null;

  let query = admin
    .from("licenses")
    .select(
      "id, license_key, app_id, app_name, status, activated_at, expires_at, hwid, duration_value, duration_unit, reseller_id, variant_id, variant_label, discord_auth_user_id, discord_user_id, discord_username, discord_avatar_url, discord_email"
    )
    .eq("license_key", key);

  if (scopedAppId) query = query.eq("app_id", scopedAppId);

  let { data, error } = await query.maybeSingle();

  if (error && /column|schema cache/i.test(error.message || "")) {
    ({ data, error } = await admin
      .from("licenses")
      .select(
        "id, license_key, app_id, app_name, status, activated_at, expires_at, hwid, duration_value, duration_unit, reseller_id, discord_auth_user_id, discord_user_id, discord_username, discord_avatar_url"
      )
      .eq("license_key", key)
      .maybeSingle());
  }

  if (error || !data) return null;
  if (scopedAppId && String(data.app_id || "").trim() !== scopedAppId) return null;
  return data;
}
