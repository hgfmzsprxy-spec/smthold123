import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Persist a JSON object to a private Supabase Storage path.
 * Prefer unique/versioned paths at the call site when overwriting a hot key —
 * fixed-path upserts can be served stale by Storage CDN for several seconds.
 */
export async function writeStorageJson(bucket, path, data, admin = getSupabaseAdmin()) {
  const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const { error } = await admin.storage.from(bucket).upload(path, Buffer.from(payload, "utf8"), {
    contentType: "application/json",
    upsert: true,
    cacheControl: "0",
  });
  if (error) throw error;
  return true;
}

export async function readStorageJson(bucket, path, admin = getSupabaseAdmin()) {
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error) {
    if (/not found|does not exist|404/i.test(error.message || "")) {
      return null;
    }
    throw error;
  }
  const text = await data.text();
  try {
    return JSON.parse(text || "null");
  } catch {
    return null;
  }
}
