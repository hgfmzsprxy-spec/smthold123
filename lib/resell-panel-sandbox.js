import { isBannedLicense } from "./license-freeze";
import { fullPermissions } from "./panel-permissions";

export const SANDBOX_RESELLER_ID = "sandbox-reseller";
export const SANDBOX_APP_ID = "sandbox-example-app";

const DEFAULT_RESELLER_STORE_PRODUCTS = [
  {
    slug: "loader-rebrand",
    name: "Loader Rebrand",
    price: 149.99,
    variantLabel: "One-Time",
    description:
      "A fully rebranded web-remote Loader tailored for your reseller brand. It will only include the products you currently resell.",
  },
  {
    slug: "cheat-menu-rebrand",
    name: "Cheat Menu Rebrand",
    price: 249.99,
    variantLabel: "One-Time",
    description: "Rebrand a single cheat menu exclusively for your brand.",
  },
  {
    slug: "bundle-rebrand-vip",
    name: "Bundle Rebrand (VIP)",
    price: 699.99,
    variantLabel: "VIP Bundle",
    description: "Full VIP rebrand package: custom Loader plus three cheat menu rebrands.",
  },
  {
    slug: "custom-license-format",
    name: "Custom License(s) Format",
    price: 29.99,
    variantLabel: "One-Time",
    description: "Customize how license keys are generated and displayed for your customers.",
  },
  {
    slug: "discord-bot-auth",
    name: "Discord Bot Auth",
    price: 74.99,
    variantLabel: "One-Time",
    description: "Generate license keys directly from Discord and manage support staff permissions.",
  },
];

const DEFAULT_DEPOSIT_VARIANTS = [
  { slug: "deposit-20", name: "Deposit $20", payAmount: 20, bonusPercent: 0, popular: false, sort_order: 0 },
  { slug: "deposit-50", name: "Deposit $50", payAmount: 50, bonusPercent: 0, popular: false, sort_order: 1 },
  { slug: "deposit-100", name: "Deposit $100", payAmount: 100, bonusPercent: 10, popular: true, sort_order: 2 },
  { slug: "deposit-250", name: "Deposit $250", payAmount: 250, bonusPercent: 25, popular: false, sort_order: 3 },
  { slug: "deposit-1000", name: "VIP Guy", payAmount: 1000, bonusPercent: 100, popular: false, sort_order: 4 },
];

function computeDepositCredit(payAmount, bonusPercent) {
  const pay = Number(payAmount) || 0;
  const bonus = Number(bonusPercent) || 0;
  return Math.round(pay * (1 + bonus / 100) * 100) / 100;
}

function computeResellerUnitPrice(retailPrice, discountPercent) {
  const price = Number(retailPrice);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

function formatPriceLabel(price) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSandboxLicenseKey() {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SBOX-${segment()}-${segment()}-${segment()}`;
}

function computeLicenseMetrics(licenses) {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  let banned = 0;

  licenses.forEach((license) => {
    const status = String(license.status || "").trim().toLowerCase();
    if (status === "banned" || status === "revoked") {
      banned += 1;
      return;
    }
    if (status === "expired") {
      expired += 1;
      return;
    }
    const expires = license.expires_at ? new Date(license.expires_at).getTime() : null;
    if (expires && expires <= now) {
      expired += 1;
      return;
    }
    if (status === "not activated" || status === "active" || status === "activated" || license.activated_at) {
      active += 1;
    }
  });

  return {
    total: licenses.length,
    active,
    expired,
    banned,
  };
}

function buildExampleApplication() {
  const variants = [
    {
      id: "sandbox-variant-day",
      applicationId: SANDBOX_APP_ID,
      application_id: SANDBOX_APP_ID,
      slug: "1-day",
      label: "1 Day",
      price: 5,
      durationValue: 1,
      duration_value: 1,
      durationUnit: "days",
      duration_unit: "days",
      sortOrder: 0,
      sort_order: 0,
      active: true,
    },
    {
      id: "sandbox-variant-week",
      applicationId: SANDBOX_APP_ID,
      application_id: SANDBOX_APP_ID,
      slug: "7-days",
      label: "7 Days",
      price: 15,
      durationValue: 7,
      duration_value: 7,
      durationUnit: "days",
      duration_unit: "days",
      sortOrder: 1,
      sort_order: 1,
      active: true,
    },
    {
      id: "sandbox-variant-month",
      applicationId: SANDBOX_APP_ID,
      application_id: SANDBOX_APP_ID,
      slug: "30-days",
      label: "30 Days",
      price: 40,
      durationValue: 30,
      duration_value: 30,
      durationUnit: "days",
      duration_unit: "days",
      sortOrder: 2,
      sort_order: 2,
      active: true,
    },
  ];

  return {
    id: SANDBOX_APP_ID,
    app_id: "example-product",
    name: "Example Product",
    description: "Sandbox preview app for trying key generation, bans, HWID resets, and license management.",
    version: "1.0.0",
    status: "online",
    webhook: null,
    created_at: new Date().toISOString(),
    has_access: true,
    locked: false,
    variants,
  };
}

function buildStoreProducts() {
  return DEFAULT_RESELLER_STORE_PRODUCTS.map((entry, index) => ({
    id: `sandbox-store-${entry.slug}`,
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    price: entry.price,
    priceLabel: formatPriceLabel(entry.price),
    variantLabel: entry.variantLabel,
    productId: 804600 + index,
    variantId: 1376500 + index,
    sort_order: index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function buildDepositVariants() {
  return DEFAULT_DEPOSIT_VARIANTS.map((entry, index) => {
    const payAmount = Math.round((Number(entry.payAmount) || 0) * 100) / 100;
    const bonusPercent = Math.max(0, Math.round((Number(entry.bonusPercent) || 0) * 100) / 100);
    const creditAmount = computeDepositCredit(payAmount, bonusPercent);

    return {
      id: `sandbox-deposit-${entry.slug}`,
      slug: entry.slug,
      name: entry.name,
      payAmount,
      payLabel: `$${payAmount.toFixed(2)}`,
      bonusPercent,
      creditAmount,
      creditLabel: `$${creditAmount.toFixed(2)}`,
      popular: Boolean(entry.popular),
      productId: 804500 + index + 1,
      variantId: 1376400 + index + 1,
      sort_order: entry.sort_order ?? index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }).sort((a, b) => {
    const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    if (orderDiff !== 0) return orderDiff;
    return (Number(a.payAmount) || 0) - (Number(b.payAmount) || 0);
  });
}

function buildNotifications() {
  const now = new Date().toISOString();
  return [
    {
      id: "sandbox-notif-welcome",
      title: "Sandbox preview",
      description: "You are browsing a demo reseller panel. Changes here are not saved.",
      badge_label: "Preview",
      badge_color: "#91a0db",
      created_at: now,
      created_by: "Phantom Team",
      created_by_avatar_url: null,
    },
    {
      id: "sandbox-notif-example",
      title: "Try Example Product",
      description: "Generate keys, ban licenses, reset HWID, and explore every tab without affecting real data.",
      badge_label: "Demo",
      badge_color: "#5f8cff",
      created_at: now,
      created_by: "Phantom Team",
      created_by_avatar_url: null,
    },
  ];
}

export function getSandboxResellerProfile() {
  return {
    id: SANDBOX_RESELLER_ID,
    email: "sandbox@example.com",
    username: "Sandbox Mode",
    discord_username: "Sandbox Mode",
    discord_user_id: "000000000000000000",
    discord_auth_user_id: "sandbox-auth-user",
    discord_avatar_url: null,
    role: "reseller",
    actor: "owner",
    discount_percent: 15,
    balance: 100,
    total_spent: 0,
    application_access: [SANDBOX_APP_ID],
    total_licenses: 0,
    generated_license_ids: [],
    purchased_store_product_ids: [],
    purchased_store_products: [],
    loader_brand: null,
    license_format: null,
    discord_notification_webhook: null,
    discord_notification_branding: null,
    team_member_limit: 5,
    team_invite_blocked: false,
    team_members: [],
    permissions: fullPermissions("reseller"),
    updated_at: new Date().toISOString(),
  };
}

function createSandboxState() {
  const reseller = getSandboxResellerProfile();
  return {
    reseller,
    applications: [buildExampleApplication()],
    licenses: [],
    teamMembers: [],
    transactions: [],
    notifications: buildNotifications(),
    storeProducts: buildStoreProducts(),
    depositVariants: buildDepositVariants(),
    sessions: [
      {
        id: "sandbox-session-current",
        device_label: "Sandbox preview",
        ip_address: "127.0.0.1",
        user_agent: "Sandbox Browser",
        created_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        current: true,
      },
    ],
  };
}

let sandboxState = null;

export function resetSandboxState() {
  sandboxState = createSandboxState();
  return sandboxState;
}

function getState() {
  if (!sandboxState) resetSandboxState();
  return sandboxState;
}

function publicReseller() {
  const state = getState();
  return {
    ...state.reseller,
    team_members: state.teamMembers,
    total_licenses: state.licenses.length,
    generated_license_ids: state.licenses.map((license) => String(license.id)),
    updated_at: new Date().toISOString(),
  };
}

function bootstrapPayload() {
  const state = getState();
  return {
    ok: true,
    allowed: true,
    reseller: publicReseller(),
    applications: state.applications,
    licenses: state.licenses,
    metrics: computeLicenseMetrics(state.licenses),
    storeProducts: state.storeProducts,
    depositVariants: state.depositVariants,
    notifications: state.notifications,
    transactions: state.transactions,
    fetchedAt: new Date().toISOString(),
  };
}

function findVariant(variantId) {
  const state = getState();
  for (const app of state.applications) {
    const variant = (app.variants || []).find((entry) => String(entry.id) === String(variantId));
    if (variant) return { app, variant };
  }
  return { app: null, variant: null };
}

function findLicense(licenseId) {
  return getState().licenses.find((license) => String(license.id) === String(licenseId)) || null;
}

function appendTransaction(entry) {
  const state = getState();
  state.transactions = [
    {
      id: createId("sandbox-tx"),
      created_at: new Date().toISOString(),
      ...entry,
    },
    ...state.transactions,
  ];
}

async function parseJsonBody(init) {
  try {
    if (!init?.body) return {};
    return JSON.parse(String(init.body));
  } catch {
    return {};
  }
}

function handleLicensesPost(body) {
  const state = getState();
  const applicationId = String(body.applicationId || body.application_id || "").trim();
  const variantId = String(body.variantId || body.variant_id || "").trim();
  const quantity = Math.max(1, Math.min(50, Number(body.quantity || 1)));

  if (applicationId !== SANDBOX_APP_ID) {
    return jsonResponse({ error: "You do not have permission for this application." }, 403);
  }

  const { app, variant } = findVariant(variantId);
  if (!app || !variant) {
    return jsonResponse({ error: "Variant not found." }, 404);
  }

  const unitPrice = computeResellerUnitPrice(variant.price, state.reseller.discount_percent);
  const totalCost = Math.round(unitPrice * quantity * 100) / 100;
  const currentBalance = Number(state.reseller.balance) || 0;

  if (totalCost > currentBalance) {
    return jsonResponse(
      {
        error: `Insufficient balance. Need ${totalCost.toFixed(2)} USD, you have ${currentBalance.toFixed(2)} USD.`,
        balance: currentBalance,
        unitPrice,
        totalCost,
      },
      402
    );
  }

  const created = Array.from({ length: quantity }, () => {
    const id = createId("sandbox-license");
    return {
      id,
      license_key: generateSandboxLicenseKey(),
      status: "Not Activated",
      application_id: app.id,
      app_id: app.app_id,
      app_name: app.name,
      app_version: app.version,
      app_webhook: app.webhook,
      duration_value: variant.durationValue,
      duration_unit: variant.durationUnit,
      activated_at: null,
      expires_at: null,
      hwid: null,
      reseller_id: state.reseller.id,
      variant_id: variant.id,
      variant_label: variant.label,
      created_at: new Date().toISOString(),
    };
  });

  state.licenses = [...created, ...state.licenses];
  const nextBalance = Math.round((currentBalance - totalCost) * 100) / 100;
  const nextSpent = Math.round(((Number(state.reseller.total_spent) || 0) + totalCost) * 100) / 100;
  state.reseller.balance = nextBalance;
  state.reseller.total_spent = nextSpent;

  appendTransaction({
    type: "license_purchase",
    amount: -totalCost,
    balance_before: currentBalance,
    balance_after: nextBalance,
    description: `Purchased ${quantity}× ${variant.label} for ${app.name}`,
    actor: "reseller",
    meta: {
      application_id: app.id,
      application_name: app.name,
      variant_id: variant.id,
      variant_label: variant.label,
      quantity,
      license_ids: created.map((license) => license.id),
    },
  });

  return jsonResponse({
    ok: true,
    licenses: created,
    pricing: {
      variantId: variant.id,
      variantLabel: variant.label,
      retailPrice: variant.price,
      unitPrice,
      quantity,
      totalCost,
      discountPercent: state.reseller.discount_percent,
      role: state.reseller.role,
    },
    reseller: {
      id: state.reseller.id,
      role: state.reseller.role,
      discount_percent: state.reseller.discount_percent,
      balance: nextBalance,
      total_spent: nextSpent,
      total_licenses: state.licenses.length,
      application_access: state.reseller.application_access,
      generated_license_ids: state.licenses.map((license) => license.id),
      updated_at: new Date().toISOString(),
    },
  });
}

function handleLicensesPatch(body) {
  const licenseId = String(body.id || body.licenseId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const license = findLicense(licenseId);

  if (!license) {
    return jsonResponse({ error: "License not found." }, 404);
  }

  let patch = {};
  if (action === "reset_hwid") {
    patch = { hwid: null };
  } else if (action === "ban") {
    patch = { status: "Banned" };
  } else if (action === "unban") {
    patch = { status: "Not Activated", frozen_at: null, frozen_remaining_ms: null };
  } else if (action === "toggle_ban") {
    patch = isBannedLicense(license)
      ? { status: "Not Activated", frozen_at: null, frozen_remaining_ms: null }
      : { status: "Banned" };
  } else {
    return jsonResponse({ error: "Unsupported license action." }, 400);
  }

  const state = getState();
  state.licenses = state.licenses.map((entry) =>
    String(entry.id) === licenseId ? { ...entry, ...patch } : entry
  );

  const updated = state.licenses.find((entry) => String(entry.id) === licenseId);
  return jsonResponse({ ok: true, action, license: updated });
}

function handleLicensesDelete(body, url) {
  const params = new URL(url, "http://localhost").searchParams;
  const licenseId = String(body.id || body.licenseId || params.get("id") || "").trim();
  const license = findLicense(licenseId);

  if (!license) {
    return jsonResponse({ error: "License not found." }, 404);
  }

  const state = getState();
  state.licenses = state.licenses.filter((entry) => String(entry.id) !== licenseId);
  return jsonResponse({ ok: true, deleted: true, id: licenseId });
}

function handleTeamGet() {
  const state = getState();
  return jsonResponse({
    ok: true,
    team_member_limit: state.reseller.team_member_limit,
    team_invite_blocked: state.reseller.team_invite_blocked,
    members: state.teamMembers,
    actor: "owner",
  });
}

function handleTeamPost(body) {
  const state = getState();
  const discordUserId = String(body.discord_user_id || body.discordUserId || "").trim();
  if (!discordUserId) {
    return jsonResponse({ error: "Discord user ID is required." }, 400);
  }
  if (state.teamMembers.length >= state.reseller.team_member_limit) {
    return jsonResponse({ error: `Team member limit reached (${state.reseller.team_member_limit}).` }, 400);
  }
  if (state.teamMembers.some((member) => String(member.discord_user_id) === discordUserId)) {
    return jsonResponse({ error: "This Discord user is already on your team." }, 400);
  }

  const member = {
    id: createId("sandbox-team"),
    discord_user_id: discordUserId,
    discord_username: String(body.discord_username || `User ${discordUserId.slice(-4)}`).trim(),
    discord_avatar_url: null,
    discord_auth_user_id: null,
    email: null,
    status: "active",
    permissions: body.permissions || fullPermissions("reseller"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  state.teamMembers = [...state.teamMembers, member];
  return jsonResponse({
    ok: true,
    member,
    members: state.teamMembers,
    team_member_limit: state.reseller.team_member_limit,
    team_invite_blocked: state.reseller.team_invite_blocked,
  });
}

function handleTeamPatch(body) {
  const state = getState();
  const memberId = String(body.memberId || body.id || "").trim();
  const index = state.teamMembers.findIndex((member) => String(member.id) === memberId);
  if (index < 0) {
    return jsonResponse({ error: "Team member not found." }, 404);
  }

  const current = state.teamMembers[index];
  const updated = {
    ...current,
    permissions: body.permissions ?? current.permissions,
    status: body.status ?? current.status,
    discord_username: body.discord_username ?? current.discord_username,
    updated_at: new Date().toISOString(),
  };
  state.teamMembers = state.teamMembers.map((member, memberIndex) =>
    memberIndex === index ? updated : member
  );

  return jsonResponse({ ok: true, member: updated, members: state.teamMembers });
}

function handleTeamDelete(body) {
  const state = getState();
  const memberId = String(body.memberId || body.id || "").trim();
  state.teamMembers = state.teamMembers.filter((member) => String(member.id) !== memberId);
  return jsonResponse({ ok: true, members: state.teamMembers });
}

function handleStorePurchase(body) {
  const state = getState();
  const productId = String(body.productId || body.product_id || "").trim();
  const product = state.storeProducts.find((entry) => String(entry.id) === productId);
  if (!product) {
    return jsonResponse({ error: "Product not found." }, 404);
  }

  const purchasedIds = state.reseller.purchased_store_product_ids || [];
  if (purchasedIds.includes(productId)) {
    return jsonResponse({ error: "You already purchased this product." }, 409);
  }

  const price = Math.round((Number(product.price) || 0) * 100) / 100;
  const currentBalance = Number(state.reseller.balance) || 0;
  if (price > currentBalance) {
    return jsonResponse(
      {
        error: `Insufficient balance. Need $${price.toFixed(2)}, you have $${currentBalance.toFixed(2)}.`,
        balance: currentBalance,
        price,
      },
      402
    );
  }

  const nextBalance = Math.round((currentBalance - price) * 100) / 100;
  const nextSpent = Math.round(((Number(state.reseller.total_spent) || 0) + price) * 100) / 100;
  const purchasedSnapshot = {
    id: productId,
    name: product.name,
    description: product.description,
    price,
    priceLabel: product.priceLabel,
    variantLabel: product.variantLabel,
    purchased_at: new Date().toISOString(),
    source: "balance",
  };

  state.reseller.balance = nextBalance;
  state.reseller.total_spent = nextSpent;
  state.reseller.purchased_store_product_ids = [...purchasedIds, productId];
  state.reseller.purchased_store_products = [
    ...(state.reseller.purchased_store_products || []),
    purchasedSnapshot,
  ];

  appendTransaction({
    type: "store_purchase",
    amount: -price,
    balance_before: currentBalance,
    balance_after: nextBalance,
    description: `Store purchase: ${product.name}`,
    actor: "reseller",
    meta: { product_id: productId, product_name: product.name, price },
  });

  return jsonResponse({
    ok: true,
    product: {
      id: product.id,
      name: product.name,
      price,
      priceLabel: product.priceLabel,
    },
    deliveryCode: "SANDBOX-DEMO-CODE",
    purchased: true,
    pricing: {
      price,
      previousBalance: currentBalance,
      balance: nextBalance,
    },
    reseller: publicReseller(),
  });
}

function handleStoreRedeem(body) {
  const state = getState();
  const code = String(body.code || body.coupon || "").trim().toUpperCase();
  if (!code) {
    return jsonResponse({ error: "Enter a coupon code." }, 400);
  }

  if (code === "SANDBOX10") {
    const credit = 10;
    const currentBalance = Number(state.reseller.balance) || 0;
    const nextBalance = Math.round((currentBalance + credit) * 100) / 100;
    state.reseller.balance = nextBalance;
    appendTransaction({
      type: "deposit_redeem",
      amount: credit,
      balance_before: currentBalance,
      balance_after: nextBalance,
      description: "Redeemed sandbox coupon SANDBOX10",
      actor: "reseller",
    });
    return jsonResponse({
      ok: true,
      redeemed: true,
      credit,
      balance: nextBalance,
      reseller: publicReseller(),
      message: "Sandbox coupon redeemed for $10.00 preview credit.",
    });
  }

  return jsonResponse({ error: "Invalid coupon code. Try SANDBOX10 in sandbox preview." }, 404);
}

function handleLoaderBrandPut(body) {
  const state = getState();
  const brandName = String(body.brandName || body.brand_name || "").trim();
  const logo = String(body.logo || "").trim();
  if (!brandName) return jsonResponse({ error: "Brand name is required." }, 400);
  if (!logo) return jsonResponse({ error: "Logo is required." }, 400);

  const slug = String(state.reseller.loader_brand?.slug || "sandbox-brand").trim() || "sandbox-brand";
  state.reseller.loader_brand = {
    color: String(body.color || "#9783d1"),
    brand_name: brandName,
    logo,
    discord_link: String(body.discordLink || body.discord_link || "").trim(),
    auto_logo_size: body.auto_logo_size !== undefined ? Boolean(body.auto_logo_size) : true,
    remove_loader_faq: Boolean(body.remove_loader_faq ?? body.removeLoaderFaq),
    remove_guides: Boolean(body.remove_guides ?? body.removeGuides),
    slug,
    blocked: false,
  };

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : String(process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://phantom-cheats.com";

  return jsonResponse({
    ok: true,
    loader_brand: state.reseller.loader_brand,
    link: `${origin.replace(/\/$/, "")}/loader?${slug}`,
    reseller: publicReseller(),
  });
}

function handleLicenseFormatPut(body) {
  const state = getState();
  state.reseller.license_format = {
    pattern: String(body.pattern || "XXXX-XXXX-XXXX"),
    special_chars: Boolean(body.special_chars ?? body.specialChars),
    digits: body.digits !== undefined ? Boolean(body.digits) : true,
  };
  return jsonResponse({ ok: true, license_format: state.reseller.license_format, reseller: publicReseller() });
}

function handleNotificationWebhook(body, method) {
  const state = getState();
  if (method === "PUT" || method === "POST") {
    state.reseller.discord_notification_webhook = String(body.webhook || body.url || "").trim() || null;
    state.reseller.discord_notification_branding = body.branding || body.discord_notification_branding || null;
  }
  return jsonResponse({
    ok: true,
    discord_notification_webhook: state.reseller.discord_notification_webhook,
    discord_notification_branding: state.reseller.discord_notification_branding,
    reseller: publicReseller(),
  });
}

async function handleSandboxApi(url, init = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const path = new URL(url, "http://localhost").pathname;
  const body = await parseJsonBody(init);

  if (path.endsWith("/session") && method === "GET") {
    return jsonResponse({ ok: true, allowed: true, reseller: publicReseller(), actor: "owner" });
  }

  if (path.endsWith("/bootstrap") && method === "GET") {
    return jsonResponse(bootstrapPayload());
  }

  if (path.endsWith("/dashboard") && method === "GET") {
    const state = getState();
    return jsonResponse({
      ok: true,
      applications: state.applications,
      licenses: state.licenses,
      metrics: computeLicenseMetrics(state.licenses),
    });
  }

  if (path.endsWith("/licenses")) {
    if (method === "POST") return handleLicensesPost(body);
    if (method === "PATCH") return handleLicensesPatch(body);
    if (method === "DELETE") return handleLicensesDelete(body, url);
  }

  if (path.endsWith("/team")) {
    if (method === "GET") return handleTeamGet();
    if (method === "POST") return handleTeamPost(body);
    if (method === "PATCH") return handleTeamPatch(body);
    if (method === "DELETE") return handleTeamDelete(body);
  }

  if (path.endsWith("/transactions") && method === "GET") {
    return jsonResponse({ ok: true, transactions: getState().transactions });
  }

  if (path.endsWith("/deposit-variants") && method === "GET") {
    return jsonResponse({ variants: getState().depositVariants });
  }

  if (path.endsWith("/store-products") && method === "GET") {
    return jsonResponse({ ok: true, products: getState().storeProducts });
  }

  if (path.endsWith("/store-purchase") && method === "POST") {
    return handleStorePurchase(body);
  }

  if (path.endsWith("/store-redeem") && method === "POST") {
    return handleStoreRedeem(body);
  }

  if (path.endsWith("/notifications") && method === "GET") {
    return jsonResponse({ ok: true, entries: getState().notifications });
  }

  if (path.endsWith("/sessions")) {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        sessions: getState().sessions,
        current_session_id: "sandbox-session-current",
      });
    }
    if (method === "DELETE") {
      return jsonResponse({ ok: true, revoked: false, message: "Session actions are disabled in sandbox preview." });
    }
  }

  if (path.endsWith("/loader-brand") && method === "PUT") {
    return handleLoaderBrandPut(body);
  }

  if (path.endsWith("/license-format") && method === "PUT") {
    return handleLicenseFormatPut(body);
  }

  if (path.endsWith("/notification-webhook") && (method === "PUT" || method === "POST")) {
    return handleNotificationWebhook(body, method);
  }

  return jsonResponse({ error: `Sandbox preview does not implement ${method} ${path}` }, 404);
}

export function installResellPanelSandboxFetch() {
  if (typeof window === "undefined") return () => {};

  resetSandboxState();
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.includes("/api/resell-panel/")) {
      return handleSandboxApi(url, init || {});
    }
    return originalFetch(input, init);
  };

  return () => {
    window.fetch = originalFetch;
    sandboxState = null;
  };
}
