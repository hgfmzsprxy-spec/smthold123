export const LOCAL_PROTECTION_SOURCE_ID = "local";
export const LOCAL_PROTECTION_SOURCE_LABEL = "unbanhwid.com";

export const PROTECTION_LOG_COLUMNS = [
  { id: "application", label: "Application" },
  { id: "reseller", label: "Reseller" },
  { id: "username_profile", label: "Username & Profile (DC)" },
  { id: "discord_user_id", label: "Discord user ID" },
  { id: "license", label: "License" },
  { id: "product_variant", label: "Variant" },
  { id: "expiration", label: "Expiration" },
  { id: "time_left", label: "Time Left" },
  { id: "screenshots", label: "Screenshots" },
];

export function defaultProtectionLogColumns() {
  return Object.fromEntries(PROTECTION_LOG_COLUMNS.map((column) => [column.id, true]));
}

export function getProtectionLogVariantLabel(entry) {
  const raw = String(entry?.product_variant || "").trim();
  if (!raw || raw === "—") return "";

  const separator = " · ";
  const separatorIndex = raw.indexOf(separator);
  if (separatorIndex >= 0) {
    return raw.slice(separatorIndex + separator.length).trim();
  }

  const appName = String(entry?.application || "").trim();
  if (appName && raw === appName) return "";
  return raw;
}
