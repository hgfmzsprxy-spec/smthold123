export const CUSTOM_LICENSE_FORMAT_SLUG = "custom-license-format";
export const DEFAULT_LICENSE_KEY_LENGTH = 14;
export const LICENSE_FORMAT_PATTERN_MAX = 48;
export const LICENSE_FORMAT_STAR_MIN = 1;
export const LICENSE_FORMAT_STAR_MAX = 32;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SPECIALS = "!@#$%&*_+=?-";

export function normalizeLicenseFormat(value) {
  if (!value || typeof value !== "object") return null;
  const pattern = String(value.pattern || "").trim().slice(0, LICENSE_FORMAT_PATTERN_MAX);
  if (!pattern) return null;
  return {
    pattern,
    special_chars: Boolean(value.special_chars ?? value.specialChars),
    digits: value.digits !== undefined ? Boolean(value.digits) : true,
  };
}

export function validateLicenseFormatPattern(pattern) {
  const raw = String(pattern || "").trim();
  if (!raw) return "Enter a license format pattern.";
  if (raw.length > LICENSE_FORMAT_PATTERN_MAX) {
    return `Pattern must be ${LICENSE_FORMAT_PATTERN_MAX} characters or fewer.`;
  }
  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return "Pattern contains invalid control characters.";
  }
  const stars = (raw.match(/\*/g) || []).length;
  if (stars < LICENSE_FORMAT_STAR_MIN) {
    return "Add at least one * where random characters should appear.";
  }
  if (stars > LICENSE_FORMAT_STAR_MAX) {
    return `Use at most ${LICENSE_FORMAT_STAR_MAX} * placeholders.`;
  }
  return "";
}

export function buildLicenseAlphabet({ specialChars = false, digits = true } = {}) {
  let alphabet = LETTERS;
  if (digits) alphabet += DIGITS;
  if (specialChars) alphabet += SPECIALS;
  return alphabet || LETTERS;
}

function fillRandomChars(length, alphabet) {
  const chars = String(alphabet || LETTERS);
  const result = [];
  const bytes = new Uint8Array(Math.max(16, length * 2));
  while (result.length < length) {
    crypto.getRandomValues(bytes);
    for (let index = 0; index < bytes.length && result.length < length; index += 1) {
      result.push(chars[bytes[index] % chars.length]);
    }
  }
  return result.join("");
}

export function generateDefaultLicenseKey(length = DEFAULT_LICENSE_KEY_LENGTH) {
  return fillRandomChars(length, LETTERS + DIGITS);
}

export function generateLicenseKeyFromFormat(format) {
  const normalized = normalizeLicenseFormat(format);
  if (!normalized) return generateDefaultLicenseKey();

  const alphabet = buildLicenseAlphabet({
    specialChars: normalized.special_chars,
    digits: normalized.digits,
  });

  return normalized.pattern.replace(/\*/g, () => fillRandomChars(1, alphabet));
}

export function resellerOwnsStoreProductId(reseller, productId) {
  const id = String(productId || "").trim();
  if (!id || !reseller) return false;
  if ((reseller.purchased_store_product_ids || []).some((entry) => String(entry) === id)) return true;
  return (reseller.purchased_store_products || []).some((entry) => String(entry?.id) === id);
}
