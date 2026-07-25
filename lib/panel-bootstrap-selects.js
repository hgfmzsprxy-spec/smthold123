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
