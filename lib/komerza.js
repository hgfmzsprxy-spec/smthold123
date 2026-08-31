export const KOMERZA_STORE_ID = process.env.NEXT_PUBLIC_KOMERZA_STORE_ID || "";

export const CHECKOUT_EMAIL_KEY = "checkout-email";
export const CHECKOUT_COUPON_KEY = "checkout-coupon";

export const KOMERZA_COUPON_MIN_LENGTH = 3;
export const KOMERZA_COUPON_MAX_LENGTH = 32;

export const KOMERZA_PRODUCTS = {
  "call-of-duty": {
    productId: "90f8cc09-5a34-4703-b2da-6c4046ac2563",
    variants: {
      "1 Day License": "e7dedcac-5c76-4972-b2e3-8473950ee90b",
      "7 Days License": "590de181-80a8-42c6-965e-f2248f7aa754",
      "30 Days License": "fa229066-4d39-439b-8cc8-e633b1a0fc7c",
      "Lifetime License": "7e6af246-8fda-4084-9ccf-585202c2dbde",
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
  "permanent-spoofer": {
    productId: "9601602a-a01f-4aab-a00a-044f976bf2c4",
    variants: {
      "One-Time License": "c9aea07a-bece-48f9-9892-f6f477441395",
      "Lifetime License": "3ea1faf9-b667-401c-b0f1-7c46e506d2b9",
    },
  },
  "apex-legends": {
    productId: "15554845-43c3-4413-b2d0-c171f9a42e6d",
    variants: {
      "1 Day License": "902d6324-f62c-4860-a3ec-1a51a15f44d0",
      "7 Days License": "c6e9d3fb-e24d-49a4-a7d3-3e6e674301ca",
      "30 Days License": "b7207305-7866-458c-a9fc-5d71a64d75e1",
      "Lifetime License": "675721d1-8cbd-4126-8f7b-5442eccdabaa",
    },
  },
  "temporary-spoofer": {
    productId: "8c354b96-f3c1-4fb4-bbb7-28fead9cc334",
    variants: {
      "1 Day License": "34ec5994-4790-4c8d-a474-6ae486bf8833",
      "7 Days License": "6c86e561-334c-430f-acc5-38f4e52c521f",
      "30 Days License": "7bf97876-804f-45a9-9900-b713a3cd3104",
      "90 Days License": "b13bf207-eac9-45f9-8cec-996c49564f66",
    },
  },
  "kbm-aim-assist": {
    productId: "87b89a5b-a0d3-46a3-9d56-9b133ebf38ed",
    variants: {
      "7 Days License": "e72fe858-19e6-4ab4-bfe5-ef386132fca5",
      "30 Days License": "781c0e85-3054-48ef-9d85-3c94cec92e69",
      "365 Days License": "d4da982e-6323-4c6a-8087-491024f30aa5",
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
