import { getSupabaseAdmin } from "./supabase-admin";
import { writeStorageJson } from "./storage-json";

export const APPLICATION_CHANGELOGS_BUCKET = "application-changelogs";

function emptyStore() {
  return { entries: [] };
}

function normalizeNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note) => String(note || "").trim()).filter(Boolean);
}

export function normalizeChangelogEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  const title = String(entry.title || "").trim();
  if (!id || !title) return null;

  const releasedAt = String(entry.released_at || entry.created_at || "").trim() || new Date().toISOString();
  return {
    id,
    title,
    notes: normalizeNotes(entry.notes),
    released_at: releasedAt,
    updated_at: String(entry.updated_at || releasedAt).trim() || releasedAt,
  };
}

export function sortChangelogEntries(entries) {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.released_at || 0).getTime();
    const bTime = new Date(b.released_at || 0).getTime();
    return bTime - aTime;
  });
}

export function formatChangelogDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function toLoaderChangelogEntry(entry) {
  const normalized = normalizeChangelogEntry(entry);
  if (!normalized) return null;
  return {
    version: normalized.title,
    date: formatChangelogDate(normalized.released_at),
    notes: normalized.notes,
  };
}

export async function ensureChangelogBucket(admin = getSupabaseAdmin()) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === APPLICATION_CHANGELOGS_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(APPLICATION_CHANGELOGS_BUCKET, {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["application/json", "text/plain"],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

function changelogObjectPath(applicationId) {
  return `${applicationId}/changelogs.json`;
}

export async function readChangelogStore(applicationId, admin = getSupabaseAdmin()) {
  if (!applicationId) return emptyStore();

  await ensureChangelogBucket(admin);
  const path = changelogObjectPath(applicationId);
  const { data, error } = await admin.storage.from(APPLICATION_CHANGELOGS_BUCKET).download(path);

  if (error) {
    if (/not found|does not exist|404/i.test(error.message || "")) {
      return emptyStore();
    }
    throw error;
  }

  try {
    const text = await data.text();
    const parsed = JSON.parse(text || "{}");
    const entries = Array.isArray(parsed?.entries)
      ? parsed.entries.map(normalizeChangelogEntry).filter(Boolean)
      : [];
    return { entries: sortChangelogEntries(entries) };
  } catch {
    return emptyStore();
  }
}

export async function writeChangelogStore(applicationId, entries, admin = getSupabaseAdmin()) {
  if (!applicationId) throw new Error("applicationId is required.");

  await ensureChangelogBucket(admin);
  const normalized = sortChangelogEntries(
    (Array.isArray(entries) ? entries : []).map(normalizeChangelogEntry).filter(Boolean)
  );
  const path = changelogObjectPath(applicationId);
  await writeStorageJson(APPLICATION_CHANGELOGS_BUCKET, path, { entries: normalized }, admin);
  return { entries: normalized };
}

export async function findApplicationByLoaderAppId(appId, admin = getSupabaseAdmin()) {
  if (!appId) return null;

  const { data, error } = await admin
    .from("applications")
    .select("id, app_id, name, version")
    .eq("app_id", appId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function findApplicationById(applicationId, admin = getSupabaseAdmin()) {
  if (!applicationId) return null;

  const { data, error } = await admin
    .from("applications")
    .select("id, app_id, name, version")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
