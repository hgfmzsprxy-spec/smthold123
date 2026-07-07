export const KOMERZA_STORE_ID = process.env.NEXT_PUBLIC_KOMERZA_STORE_ID || "";

export const CHECKOUT_EMAIL_KEY = "checkout-email";
export const CHECKOUT_COUPON_KEY = "checkout-coupon";

export const KOMERZA_COUPON_MIN_LENGTH = 3;
export const KOMERZA_COUPON_MAX_LENGTH = 32;

export const KOMERZA_PRODUCTS = {
  "arc-raiders": {
    productId: "b9a245cf-d197-443f-877e-3c47d4a83723",
    variants: {
      "1 Day License": "9fc5afc7-0167-4e91-8042-914af53d724f",
      "7 Days License": "4ccbe304-338d-439c-9ee6-0182119d0c3d",
      "30 Days License": "abb9ba82-9233-4808-98fa-232ca7a0830e",
    },
  },
  "fortnite-private": {
    productId: "30743d63-83c7-4b0b-8397-34945b842254",
    variants: {
      "1 Day License": "81e4933e-4022-4308-b8fd-2636cd3004ba",
      "7 Days License": "9e5cd3ab-fa10-4cc4-ac59-0720f114ce43",
      "30 Days License": "4f58b118-8533-4021-ba2c-37d6df0d22cb",
      "Lifetime License": "68a1e3d1-42e9-4be6-8d03-024863439025",
    },
  },
};

export function isKomerzaConfigured() {
  return Boolean(KOMERZA_STORE_ID);
}

export function hasKomerzaProduct(slug) {
  return Boolean(KOMERZA_PRODUCTS[slug]);
}

export function getKomerzaVariantIds(slug, variantLabel) {
  const product = KOMERZA_PRODUCTS[slug];
  if (!product) return null;

  const variantId = product.variants[variantLabel];
  if (!variantId) return null;

  return {
    productId: product.productId,
    variantId,
  };
}

export function getUnsupportedCartItems(items = []) {
  return items.filter((item) => !getKomerzaVariantIds(item.slug, item.variant));
}

function getKomerzaClient() {
  if (typeof window === "undefined") {
    throw new Error("Checkout is only available in the browser.");
  }

  if (!KOMERZA_STORE_ID) {
    throw new Error("Checkout is not configured yet. Add your Komerza store ID.");
  }

  if (!window.komerza) {
    throw new Error("Payment system is still loading. Try again in a moment.");
  }

  window.komerza.init(KOMERZA_STORE_ID);
  return window.komerza;
}

export function waitForKomerza(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Checkout is only available in the browser."));
      return;
    }

    const startedAt = Date.now();

    const tick = () => {
      try {
        resolve(getKomerzaClient());
        return;
      } catch (error) {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(error);
          return;
        }

        window.setTimeout(tick, 50);
      }
    };

    tick();
  });
}

export async function syncKomerzaBasket(items) {
  const unsupported = getUnsupportedCartItems(items);
  if (unsupported.length) {
    const names = unsupported.map((item) => `${item.name} (${item.variant})`).join(", ");
    throw new Error(`These products are not available for checkout yet: ${names}.`);
  }

  const komerza = await waitForKomerza();
  komerza.clearBasket();

  for (const item of items) {
    const mapping = getKomerzaVariantIds(item.slug, item.variant);
    komerza.addToBasket(mapping.productId, mapping.variantId, item.quantity);
  }

  return komerza;
}

export async function startKomerzaCheckout({ items, email, couponCode = "" }) {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address to continue.");
  }

  if (!items.length) {
    throw new Error("Your cart is empty.");
  }

  const coupon = validateKomerzaCoupon(couponCode);
  const komerza = await syncKomerzaBasket(items);
  komerza.createBasketBackup?.();

  const response = await komerza.checkout(normalizedEmail, coupon || undefined);

  if (!response?.success) {
    komerza.restoreBasketFromBackup?.();
    throw new Error(formatKomerzaCheckoutError(response));
  }

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(CHECKOUT_EMAIL_KEY, normalizedEmail);
    persistCheckoutCoupon(coupon);
  }

  return response;
}

export function normalizeKomerzaCoupon(couponCode = "") {
  return String(couponCode || "").trim();
}

export function validateKomerzaCoupon(couponCode = "") {
  const coupon = normalizeKomerzaCoupon(couponCode);
  if (!coupon) return "";

  if (coupon.length < KOMERZA_COUPON_MIN_LENGTH || coupon.length > KOMERZA_COUPON_MAX_LENGTH) {
    throw new Error(`Coupon code must be between ${KOMERZA_COUPON_MIN_LENGTH} and ${KOMERZA_COUPON_MAX_LENGTH} characters.`);
  }

  return coupon;
}

export function formatKomerzaCheckoutError(response) {
  if (!response) return "Checkout failed. Please try again.";

  if (Array.isArray(response.invalidFields) && response.invalidFields.length) {
    const couponError = response.invalidFields.find((field) => field.fieldName === "coupon" || field.fieldName === "couponCode");
    if (couponError?.reason) return couponError.reason;

    const emailError = response.invalidFields.find((field) => field.fieldName === "email" || field.fieldName === "emailAddress");
    if (emailError?.reason) return emailError.reason;

    const fieldMessage = response.invalidFields.map((field) => field.reason).filter(Boolean).join(" ");
    if (fieldMessage) return fieldMessage;
  }

  return response.message || "Checkout failed. Please try again.";
}

export function readCheckoutCoupon() {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(CHECKOUT_COUPON_KEY) || "";
  } catch {
    return "";
  }
}

export function persistCheckoutCoupon(couponCode = "") {
  if (typeof window === "undefined") return;

  try {
    const coupon = normalizeKomerzaCoupon(couponCode);
    if (coupon) {
      window.sessionStorage.setItem(CHECKOUT_COUPON_KEY, coupon);
      return;
    }

    window.sessionStorage.removeItem(CHECKOUT_COUPON_KEY);
  } catch {
    // Ignore storage errors and keep checkout usable.
  }
}

export function readCheckoutEmail() {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(CHECKOUT_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}
