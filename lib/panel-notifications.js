import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import { writeStorageJson } from "./storage-json";
import { NOTIFICATION_BADGE_COLORS } from "./panel-notification-badges";

export { NOTIFICATION_BADGE_COLORS } from "./panel-notification-badges";

export const PANEL_NOTIFICATIONS_BUCKET = "panel-notifications";
export const PANEL_NOTIFICATIONS_OBJECT_PATH = "notifications.json";
export const PANEL_NOTIFICATIONS_VERSIONS_FOLDER = "versions";
export const PANEL_NOTIFICATIONS_VERSIONS_PREFIX = `${PANEL_NOTIFICATIONS_VERSIONS_FOLDER}/`;
export const NOTIFICATION_BADGE_MAX = 3;
const MAX_NOTIFICATION_VERSIONS = 30;

let memoryNotificationsStore = null;

function emptyStore() {
  return { entries: [] };
}

function isHexColor(value) {
  return /^#([0-9a-fA-F]{6})$/.test(String(value || "").trim());
}

export function normalizeNotificationBadge(badge) {
  if (!badge || typeof badge !== "object") return null;
  const label = String(badge.label || badge.badge_label || badge.badgeLabel || "").trim().slice(0, 24);
  if (!label) return null;
  let color = String(badge.color || badge.badge_color || badge.badgeColor || "").trim();
  if (!isHexColor(color)) color = NOTIFICATION_BADGE_COLORS[0].value;
  return { label, color };
}

export function normalizeNotificationBadges(entry) {
  const fromArray = Array.isArray(entry?.badges)
    ? entry.badges.map(normalizeNotificationBadge).filter(Boolean)
    : [];

  if (fromArray.length) {
    return fromArray.slice(0, NOTIFICATION_BADGE_MAX);
  }

  const legacy = normalizeNotificationBadge({
    label: entry?.badge_label || entry?.badgeLabel,
    color: entry?.badge_color || entry?.badgeColor,
  });
  return legacy ? [legacy] : [];
}

export function normalizeNotificationEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  const title = String(entry.title || "").trim();
  const description = String(entry.description || entry.body || "").trim();
  if (!id || !title || !description) return null;

  const badges = normalizeNotificationBadges(entry);
  const createdAt = String(entry.created_at || entry.createdAt || "").trim() || new Date().toISOString();

  return {
    id,
    title,
    description,
    badges,
    badge_label: badges[0]?.label || "",
    badge_color: badges[0]?.color || "",
    created_at: createdAt,
    created_by: String(entry.created_by || entry.createdBy || "").trim(),
  };
}

export function sortNotificationEntries(entries) {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

export async function ensureNotificationsBucket(admin = getSupabaseAdmin()) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === PANEL_NOTIFICATIONS_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(PANEL_NOTIFICATIONS_BUCKET, {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["application/json", "text/plain"],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

function parseNotificationsPayload(parsed) {
  const entries = Array.isArray(parsed?.entries)
    ? parsed.entries.map(normalizeNotificationEntry).filter(Boolean)
    : [];
  return { entries: sortNotificationEntries(entries) };
}

async function downloadNotificationsPayload(admin, path) {
  const { data, error } = await admin.storage.from(PANEL_NOTIFICATIONS_BUCKET).download(path);
  if (error) {
    if (/not found|does not exist|404/i.test(error.message || "")) return null;
    throw error;
  }
  try {
    const text = await data.text();
    return parseNotificationsPayload(JSON.parse(text || "{}"));
  } catch {
    return null;
  }
}

async function listLatestNotificationVersionPath(admin) {
  const { data, error } = await admin.storage.from(PANEL_NOTIFICATIONS_BUCKET).list(PANEL_NOTIFICATIONS_VERSIONS_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !Array.isArray(data) || !data.length) return null;
  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return files[0] ? `${PANEL_NOTIFICATIONS_VERSIONS_PREFIX}${files[0]}` : null;
}

async function pruneNotificationVersions(admin) {
  const { data, error } = await admin.storage.from(PANEL_NOTIFICATIONS_BUCKET).list(PANEL_NOTIFICATIONS_VERSIONS_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !Array.isArray(data) || data.length <= MAX_NOTIFICATION_VERSIONS) return;

  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const stale = files.slice(MAX_NOTIFICATION_VERSIONS).map((name) => `${PANEL_NOTIFICATIONS_VERSIONS_PREFIX}${name}`);
  if (!stale.length) return;
  await admin.storage.from(PANEL_NOTIFICATIONS_BUCKET).remove(stale);
}

function setMemoryNotificationsStore(entries, versionPath, fromWrite = false) {
  memoryNotificationsStore = {
    entries: sortNotificationEntries(entries),
    versionPath: versionPath || null,
    writtenAt: Date.now(),
    fromWrite: Boolean(fromWrite),
  };
}

export async function readNotificationStore(admin = getSupabaseAdmin()) {
  await ensureNotificationsBucket(admin);

  try {
    const latestPath = await listLatestNotificationVersionPath(admin);
    if (latestPath) {
      if (
        memoryNotificationsStore?.fromWrite &&
        memoryNotificationsStore.versionPath &&
        memoryNotificationsStore.versionPath > latestPath &&
        Date.now() - memoryNotificationsStore.writtenAt < 15_000
      ) {
        return { entries: memoryNotificationsStore.entries };
      }

      const versioned = await downloadNotificationsPayload(admin, latestPath);
      if (versioned) {
        setMemoryNotificationsStore(versioned.entries, latestPath, false);
        return versioned;
      }
    }
  } catch {
    // fall through
  }

  if (memoryNotificationsStore?.fromWrite && Date.now() - memoryNotificationsStore.writtenAt < 15_000) {
    return { entries: memoryNotificationsStore.entries };
  }

  const legacy = await downloadNotificationsPayload(admin, PANEL_NOTIFICATIONS_OBJECT_PATH);
  if (legacy) {
    setMemoryNotificationsStore(legacy.entries, PANEL_NOTIFICATIONS_OBJECT_PATH, false);
    return legacy;
  }

  return emptyStore();
}

export async function writeNotificationStore(entries, admin = getSupabaseAdmin()) {
  await ensureNotificationsBucket(admin);
  const normalized = sortNotificationEntries(
    (Array.isArray(entries) ? entries : []).map(normalizeNotificationEntry).filter(Boolean)
  );
  const payload = { entries: normalized, updated_at: new Date().toISOString() };
  const versionPath = `${PANEL_NOTIFICATIONS_VERSIONS_PREFIX}${Date.now()}-${randomUUID()}.json`;

  // New object key each write → no CDN overwrite lag for the source of truth.
  await writeStorageJson(PANEL_NOTIFICATIONS_BUCKET, versionPath, payload, admin);

  const verified = await downloadNotificationsPayload(admin, versionPath);
  if (!verified) {
    throw new Error("Notification write verification failed.");
  }

  setMemoryNotificationsStore(verified.entries, versionPath, true);

  // Legacy path kept for older readers (best-effort).
  void writeStorageJson(PANEL_NOTIFICATIONS_BUCKET, PANEL_NOTIFICATIONS_OBJECT_PATH, payload, admin).catch(() => {});
  void pruneNotificationVersions(admin).catch(() => {});

  return { entries: verified.entries };
}

export function createNotificationEntry({ title, description, badges = [], createdBy = "" }) {
  const entry = normalizeNotificationEntry({
    id: randomUUID(),
    title,
    description,
    badges,
    created_at: new Date().toISOString(),
    created_by: createdBy,
  });
  if (!entry) throw new Error("Invalid notification payload.");
  return entry;
}
