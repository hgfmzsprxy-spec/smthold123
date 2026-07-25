const STORAGE_MARKER_PREFIX = "storage:";

export const APPLICATION_PACKAGE_BUCKET = "application-packages";

function sanitizePathSegment(value, fallback = "file") {
  const normalized = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function encodeStoragePath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildApplicationPackagePath(appId, fileName = "", sha256 = "") {
  const safeAppId = sanitizePathSegment(appId, "app");
  const safeFileName = sanitizePathSegment(fileName, "package.bin");
  const shaPrefix = String(sha256 || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-f0-9]/g, "")
    .slice(0, 16);

  return `${safeAppId}/${shaPrefix ? `${shaPrefix}-` : ""}${safeFileName}`;
}

export function buildApplicationPackageStorageRef(path) {
  const normalized = String(path || "").trim().replace(/^\/+/, "");
  return normalized ? `${STORAGE_MARKER_PREFIX}${normalized}` : "";
}

export function isApplicationPackageStorageRef(value) {
  return String(value || "").trim().toLowerCase().startsWith(STORAGE_MARKER_PREFIX);
}

export function parseApplicationPackageStorageRef(value) {
  const normalized = String(value || "").trim();
  if (!isApplicationPackageStorageRef(normalized)) return "";
  return normalized.slice(STORAGE_MARKER_PREFIX.length).replace(/^\/+/, "");
}

export function getApplicationPackagePublicUrl(value, cacheBust = "") {
  const storagePath = isApplicationPackageStorageRef(value) ? parseApplicationPackageStorageRef(value) : String(value || "").trim();
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  if (!supabaseUrl || !storagePath) return "";

  const base = `${supabaseUrl}/storage/v1/object/public/${APPLICATION_PACKAGE_BUCKET}/${encodeStoragePath(storagePath)}`;
  return cacheBust ? `${base}?v=${encodeURIComponent(String(cacheBust))}` : base;
}
