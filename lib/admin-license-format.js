import {
  normalizeLicenseFormat,
  validateLicenseFormatPattern,
} from "./license-key-format";
import { RESELLERS_BUCKET } from "./resellers";
import { getSupabaseAdmin } from "./supabase-admin";
import { readStorageJson, writeStorageJson } from "./storage-json";

export const ADMIN_LICENSE_FORMAT_OBJECT_PATH = "admin-license-format.json";

export const DEFAULT_ADMIN_LICENSE_FORMAT = normalizeLicenseFormat({
  pattern: "PREFIX-********",
  special_chars: false,
  digits: true,
});

export async function readAdminLicenseFormat(admin = getSupabaseAdmin()) {
  const parsed = await readStorageJson(RESELLERS_BUCKET, ADMIN_LICENSE_FORMAT_OBJECT_PATH, admin);
  const normalized = normalizeLicenseFormat(parsed?.license_format || parsed);
  return normalized || { ...DEFAULT_ADMIN_LICENSE_FORMAT };
}

export async function writeAdminLicenseFormat(format, admin = getSupabaseAdmin()) {
  const normalized = normalizeLicenseFormat(format);
  if (!normalized) throw new Error("Enter a license format pattern.");
  const validationError = validateLicenseFormatPattern(normalized.pattern);
  if (validationError) throw new Error(validationError);

  const payload = {
    license_format: normalized,
    updated_at: new Date().toISOString(),
  };
  await writeStorageJson(RESELLERS_BUCKET, ADMIN_LICENSE_FORMAT_OBJECT_PATH, payload, admin);
  return normalized;
}
