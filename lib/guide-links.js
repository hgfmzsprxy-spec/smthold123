const PRODUCT_INJECTION_GUIDE_SLUGS = new Set([
  "fortnite-private",
  "call-of-duty",
  "apex-legends",
  "arc-raiders",
]);

const GUIDE_BASE_PATH = "/guide";

export const LOADER_INSTALLATION_GUIDE_HREF = `${GUIDE_BASE_PATH}?view=loader-installation`;

export function getProductGuideView(slug) {
  const value = String(slug || "").trim();
  if (!value) return "loader-installation";
  if (PRODUCT_INJECTION_GUIDE_SLUGS.has(value)) return `${value}-injection`;
  if (value === "emulator") return "loader-installation";
  if (value === "permanent-spoofer") return "permanent-spoofer-spoofing";
  return value;
}

export function getProductGuideHref(slug) {
  return `${GUIDE_BASE_PATH}?view=${encodeURIComponent(getProductGuideView(slug))}`;
}
