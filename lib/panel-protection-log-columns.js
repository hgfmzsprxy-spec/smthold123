export const LOCAL_PROTECTION_SOURCE_ID = "local";
export const LOCAL_PROTECTION_SOURCE_LABEL = "phantom-cheat.com";

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

  const appName = String(entry?.application || "").trim();

  // Legacy rows may store "App · Variant" (or mojibake / dash separators).
  const separated = raw.match(/^(.*?)\s*(?:Â·|·|•|–|—|\|)\s+(.+)$/) || raw.match(/^(.*?)\s+-\s+(.+)$/);
  if (separated) {
    const right = separated[2].trim();
    if (right) return right;
  }

  if (appName) {
    if (raw.toLowerCase() === appName.toLowerCase()) return "";
    if (raw.toLowerCase().startsWith(appName.toLowerCase())) {
      const rest = raw
        .slice(appName.length)
        .replace(/^\s*(?:Â·|·|•|–|—|\||-)\s*/, "")
        .trim();
      if (rest) return rest;
      return "";
    }
  }

  return raw;
}
