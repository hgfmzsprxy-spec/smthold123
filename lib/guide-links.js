const PRODUCT_INJECTION_GUIDE_SLUGS = new Set([
  "fortnite-private",
  "call-of-duty",
  "apex-legends",
]);

const GUIDE_BASE_PATH = "/guide";

export const LOADER_INSTALLATION_GUIDE_HREF = `${GUIDE_BASE_PATH}?view=loader-installation`;

export function getProductGuideView(slug) {
  const value = String(slug || "").trim();
  if (!value) return "loader-installation";
  if (PRODUCT_INJECTION_GUIDE_SLUGS.has(value)) return `${value}-injection`;
  if (value === "permanent-spoofer") return "permanent-spoofer-spoofing";
  if (value === "kbm-aim-assist" || value === "controller-emulator") {
    return "controller-emulator-setup";
  }
  return value;
}

export function getProductGuideHref(slug) {
  return `${GUIDE_BASE_PATH}?view=${encodeURIComponent(getProductGuideView(slug))}`;
}
