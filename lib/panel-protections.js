import { getSupabaseAdmin } from "./supabase-admin";
import { defaultProtectionFlags, PROTECTION_OPTIONS } from "./panel-protection-options";
import { readStorageJson, writeStorageJson } from "./storage-json";

export { defaultProtectionFlags, PROTECTION_OPTIONS } from "./panel-protection-options";

export const PANEL_PROTECTIONS_BUCKET = "panel-config";
export const PANEL_PROTECTIONS_OBJECT_PATH = "protections.json";

const PROTECTION_IDS = new Set(PROTECTION_OPTIONS.map((item) => item.id));

export function normalizeProtectionFlags(input) {
  const defaults = defaultProtectionFlags();
  const source = input && typeof input === "object" ? input : {};
  const flags = { ...defaults };
  for (const id of PROTECTION_IDS) {
    if (typeof source[id] === "boolean") flags[id] = source[id];
    else if (source[id] === 1 || source[id] === "1" || source[id] === "true") flags[id] = true;
  }
  return flags;
}

export function emptyProtectionStore() {
  return {
    flags: defaultProtectionFlags(),
    updated_at: null,
    updated_by: "",
  };
}

export async function ensureProtectionsBucket(admin = getSupabaseAdmin()) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === PANEL_PROTECTIONS_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(PANEL_PROTECTIONS_BUCKET, {
    public: false,
    fileSizeLimit: 1 * 1024 * 1024,
    allowedMimeTypes: ["application/json", "text/plain"],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

export async function readProtectionStore(admin = getSupabaseAdmin()) {
  await ensureProtectionsBucket(admin);
  const parsed = await readStorageJson(PANEL_PROTECTIONS_BUCKET, PANEL_PROTECTIONS_OBJECT_PATH, admin);
  if (!parsed || typeof parsed !== "object") return emptyProtectionStore();
  return {
    flags: normalizeProtectionFlags(parsed.flags || parsed),
    updated_at: parsed.updated_at || parsed.updatedAt || null,
    updated_by: String(parsed.updated_by || parsed.updatedBy || "").trim(),
  };
}

export async function writeProtectionStore(flags, updatedBy = "", admin = getSupabaseAdmin()) {
  await ensureProtectionsBucket(admin);
  const payload = {
    flags: normalizeProtectionFlags(flags),
    updated_at: new Date().toISOString(),
    updated_by: String(updatedBy || "").trim(),
  };
  await writeStorageJson(PANEL_PROTECTIONS_BUCKET, PANEL_PROTECTIONS_OBJECT_PATH, payload, admin);
  return payload;
}
