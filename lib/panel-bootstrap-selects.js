/** Slim PostgREST selects for panel bootstrap (no package/image base64 blobs). */

export const ADMIN_APPLICATION_SELECT = [
  "id",
  "app_id",
  "name",
  "description",
  "version",
  "status",
  "webhook",
  "is_frozen",
  "created_at",
  "image_url",
  "image_file_type",
  "image_mime_type",
  "image_missing",
  "image_updated_at",
  "download_file_name",
  "download_file_type",
  "download_file_size",
  "download_file_sha256",
  "download_updated_at",
].join(",");

export const ADMIN_LICENSE_SELECT = [
  "id",
  "license_key",
  "application_id",
  "app_id",
  "app_name",
  "app_version",
  "app_webhook",
  "status",
  "expires_at",
  "activated_at",
  "duration_value",
  "duration_unit",
  "reseller_id",
  "created_at",
  "hwid",
  "frozen_at",
  "frozen_remaining_ms",
  "discord_username",
  "discord_user_id",
  "discord_avatar_url",
  "avatar_url",
].join(",");

export const RESELL_LICENSE_SELECT = [
  "id",
  "license_key",
  "application_id",
  "app_id",
  "app_name",
  "status",
  "expires_at",
  "activated_at",
  "duration_value",
  "duration_unit",
  "reseller_id",
  "created_at",
  "variant_id",
  "variant_label",
  "discord_username",
  "discord_user_id",
  "discord_avatar_url",
  "hwid",
].join(",");

/** Progressive selects for DBs that are missing optional license columns. */
export const RESELL_LICENSE_SELECT_FALLBACKS = [
  RESELL_LICENSE_SELECT,
  [
    "id",
    "license_key",
    "application_id",
    "app_id",
    "app_name",
    "status",
    "expires_at",
    "activated_at",
    "duration_value",
    "duration_unit",
    "reseller_id",
    "created_at",
    "discord_username",
    "discord_user_id",
    "discord_avatar_url",
    "hwid",
  ].join(","),
  [
    "id",
    "license_key",
    "application_id",
    "app_id",
    "app_name",
    "status",
    "expires_at",
    "activated_at",
    "duration_value",
    "duration_unit",
    "created_at",
    "discord_username",
    "discord_user_id",
    "discord_avatar_url",
    "hwid",
  ].join(","),
  [
    "id",
    "license_key",
    "application_id",
    "app_id",
    "app_name",
    "status",
    "expires_at",
    "activated_at",
    "duration_value",
    "duration_unit",
    "created_at",
    "hwid",
  ].join(","),
  "*",
];

function isMissingColumnError(error) {
  return /column|schema cache|does not exist/i.test(String(error?.message || error || ""));
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/**
 * Fetch licenses by id for the resell panel, tolerating missing optional columns
 * (e.g. reseller_id / variant_id) on older Supabase schemas.
 */
export async function fetchResellLicensesByIds(admin, ids) {
  const list = Array.isArray(ids) ? ids.map((id) => String(id || "").trim()).filter(Boolean) : [];
  if (!list.length) return [];

  const rows = [];
  for (const chunk of chunkArray(list, 80)) {
    let lastError = null;
    let chunkRows = null;

    for (const select of RESELL_LICENSE_SELECT_FALLBACKS) {
      const result = await admin
        .from("licenses")
        .select(select)
        .in("id", chunk)
        .order("created_at", { ascending: false });

      if (!result.error) {
        chunkRows = Array.isArray(result.data) ? result.data : [];
        lastError = null;
        break;
      }

      lastError = result.error;
      if (!isMissingColumnError(result.error)) break;
    }

    if (lastError) throw lastError;
    rows.push(...(chunkRows || []));
  }

  return rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function stripApplicationBlobs(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    if (!row || typeof row !== "object") return row;
    const next = { ...row };
    delete next.download_file_data_base64;
    delete next.image_data_base64;
    return next;
  });
}

export const RESELL_APPLICATION_SELECT = [
  "id",
  "app_id",
  "name",
  "description",
  "version",
  "status",
  "webhook",
  "created_at",
  "download_updated_at",
].join(",");
