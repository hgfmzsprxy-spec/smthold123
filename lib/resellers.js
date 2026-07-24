import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import { extractDiscordProfile } from "./loader-redeem";
import { writeStorageJson } from "./storage-json";

export const RESELLERS_BUCKET = "resellers-data";
export const RESELLERS_OBJECT_PATH = "resellers.json";
export const RESELLERS_VERSIONS_PREFIX = "resellers.versions/";
const RESELLERS_VERSIONS_FOLDER = "resellers.versions";
const MAX_RESELLER_VERSIONS = 30;

/** Process-local cache — avoids Supabase Storage CDN serving a stale resellers.json right after writes. */
let memoryResellersStore = null;

function emptyStore() {
  return { resellers: [] };
}

export const RESELLER_ROLES = ["panel_access", "reseller"];

export function normalizeResellerRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return role === "panel_access" ? "panel_access" : "reseller";
}

export function normalizeResellerDiscount(role, value) {
  if (normalizeResellerRole(role) === "panel_access") return 100;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.min(100, Math.max(0, Math.round(amount * 100) / 100));
}

export function formatResellerRoleLabel(role) {
  return normalizeResellerRole(role) === "panel_access" ? "Panel Access" : "Reseller";
}

export function normalizePurchasedStoreProduct(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  if (!id) return null;
  const priceRaw = Number(entry.price);
  return {
    id,
    name: String(entry.name || "").trim() || "Product",
    description: String(entry.description || "").trim(),
    price: Number.isFinite(priceRaw) ? Math.round(priceRaw * 100) / 100 : 0,
    priceLabel:
      String(entry.priceLabel || entry.price_label || "").trim() ||
      (Number.isFinite(priceRaw) ? `$${priceRaw.toFixed(2)}` : ""),
    variantLabel: String(entry.variantLabel || entry.variant_label || "One-Time").trim() || "One-Time",
    purchased_at: String(entry.purchased_at || entry.purchasedAt || "").trim() || new Date().toISOString(),
    source: String(entry.source || "").trim() || "purchase",
  };
}

export function mergePurchasedStoreProducts(...lists) {
  const byId = new Map();
  lists.flat().forEach((entry) => {
    const normalized = normalizePurchasedStoreProduct(entry);
    if (!normalized) return;
    const prev = byId.get(normalized.id);
    byId.set(normalized.id, prev ? { ...prev, ...normalized, id: normalized.id } : normalized);
  });
  return [...byId.values()].sort(
    (a, b) => new Date(b.purchased_at || 0).getTime() - new Date(a.purchased_at || 0).getTime()
  );
}

export function normalizeReseller(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  const email = String(entry.email || "").trim().toLowerCase();
  if (!id || !email) return null;

  const applicationAccess = Array.isArray(entry.application_access)
    ? entry.application_access.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  const generatedLicenseIds = Array.isArray(entry.generated_license_ids)
    ? [...new Set(entry.generated_license_ids.map((value) => String(value || "").trim()).filter(Boolean))]
    : [];

  const purchasedFromIds = Array.isArray(entry.purchased_store_product_ids)
    ? entry.purchased_store_product_ids.map((value) => ({ id: String(value || "").trim() })).filter((row) => row.id)
    : [];
  const purchasedStoreProducts = mergePurchasedStoreProducts(
    entry.purchased_store_products,
    purchasedFromIds
  );
  const purchasedStoreProductIds = purchasedStoreProducts.map((row) => row.id);

  const role = normalizeResellerRole(entry.role);
  const discountPercent = normalizeResellerDiscount(role, entry.discount_percent ?? entry.discountPercent);

  return {
    id,
    email,
    discord_auth_user_id: String(entry.discord_auth_user_id || "").trim() || null,
    discord_user_id: String(entry.discord_user_id || "").trim() || null,
    discord_username: String(entry.discord_username || "").trim() || null,
    discord_avatar_url: String(entry.discord_avatar_url || "").trim() || null,
    application_access: applicationAccess,
    generated_license_ids: generatedLicenseIds,
    purchased_store_product_ids: purchasedStoreProductIds,
    purchased_store_products: purchasedStoreProducts,
    role,
    discount_percent: discountPercent,
    total_licenses: Number.isFinite(Number(entry.total_licenses))
      ? Number(entry.total_licenses)
      : generatedLicenseIds.length,
    balance: Number.isFinite(Number(entry.balance)) ? Number(entry.balance) : 0,
    total_spent: Number.isFinite(Number(entry.total_spent)) ? Number(entry.total_spent) : 0,
    status: String(entry.status || "active").trim().toLowerCase() === "disabled" ? "disabled" : "active",
    created_at: String(entry.created_at || "").trim() || new Date().toISOString(),
    updated_at: String(entry.updated_at || entry.created_at || "").trim() || new Date().toISOString(),
  };
}

export function sortResellers(resellers) {
  return [...resellers].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

export function computeResellerMetrics(resellers) {
  const list = Array.isArray(resellers) ? resellers : [];
  const active = list.filter((entry) => entry.status === "active");
  return {
    total: list.length,
    active: active.length,
    totalBalance: active.reduce((sum, entry) => sum + (Number(entry.balance) || 0), 0),
    totalSpent: list.reduce((sum, entry) => sum + (Number(entry.total_spent) || 0), 0),
  };
}

export function getResellerDisplayName(reseller) {
  if (!reseller) return "-";
  return reseller.discord_username || reseller.email?.split("@")[0] || reseller.email || "-";
}

export async function ensureResellersBucket(admin = getSupabaseAdmin()) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets || []).some((bucket) => bucket.name === RESELLERS_BUCKET);
  if (exists) return;

  const { error } = await admin.storage.createBucket(RESELLERS_BUCKET, {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["application/json", "text/plain"],
  });

  if (error && !/already exists/i.test(error.message || "")) {
    throw error;
  }
}

function parseResellersPayload(parsed) {
  const resellers = Array.isArray(parsed?.resellers)
    ? parsed.resellers.map(normalizeReseller).filter(Boolean)
    : [];
  return { resellers: sortResellers(resellers) };
}

async function downloadResellersPayload(admin, path) {
  const { data, error } = await admin.storage.from(RESELLERS_BUCKET).download(path);
  if (error) {
    if (/not found|does not exist|404/i.test(error.message || "")) return null;
    throw error;
  }
  try {
    const text = await data.text();
    return parseResellersPayload(JSON.parse(text || "{}"));
  } catch {
    return null;
  }
}

async function listLatestResellerVersionPath(admin) {
  const { data, error } = await admin.storage.from(RESELLERS_BUCKET).list(RESELLERS_VERSIONS_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !Array.isArray(data) || !data.length) return null;
  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return files[0] ? `${RESELLERS_VERSIONS_PREFIX}${files[0]}` : null;
}

async function pruneResellerVersions(admin) {
  const { data, error } = await admin.storage.from(RESELLERS_BUCKET).list(RESELLERS_VERSIONS_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !Array.isArray(data) || data.length <= MAX_RESELLER_VERSIONS) return;

  const files = data
    .map((entry) => String(entry?.name || "").trim())
    .filter((name) => /\.json$/i.test(name))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const stale = files.slice(MAX_RESELLER_VERSIONS).map((name) => `${RESELLERS_VERSIONS_PREFIX}${name}`);
  if (!stale.length) return;
  await admin.storage.from(RESELLERS_BUCKET).remove(stale);
}

function setMemoryResellersStore(resellers, versionPath, fromWrite = false) {
  memoryResellersStore = {
    resellers: sortResellers(resellers),
    versionPath: versionPath || null,
    writtenAt: Date.now(),
    fromWrite: Boolean(fromWrite),
  };
}

export async function readResellersStore(admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);

  // Prefer immutable version objects (new path each write → no stale CDN overwrite).
  try {
    const latestPath = await listLatestResellerVersionPath(admin);
    if (latestPath) {
      // Same-instance write can be newer than Storage list for a moment.
      if (
        memoryResellersStore?.fromWrite &&
        memoryResellersStore.versionPath &&
        memoryResellersStore.versionPath > latestPath &&
        Date.now() - memoryResellersStore.writtenAt < 15_000
      ) {
        return { resellers: memoryResellersStore.resellers };
      }

      const versioned = await downloadResellersPayload(admin, latestPath);
      if (versioned) {
        setMemoryResellersStore(versioned.resellers, latestPath, false);
        return versioned;
      }
    }
  } catch {
    // fall through
  }

  // List lag / first boot: serve a very recent local write if we have one.
  if (memoryResellersStore?.fromWrite && Date.now() - memoryResellersStore.writtenAt < 15_000) {
    return { resellers: memoryResellersStore.resellers };
  }

  const legacy = await downloadResellersPayload(admin, RESELLERS_OBJECT_PATH);
  if (legacy) {
    setMemoryResellersStore(legacy.resellers, RESELLERS_OBJECT_PATH, false);
    return legacy;
  }

  return emptyStore();
}

export async function writeResellersStore(resellers, admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);
  const normalized = sortResellers((Array.isArray(resellers) ? resellers : []).map(normalizeReseller).filter(Boolean));
  const payload = { resellers: normalized };
  const versionPath = `${RESELLERS_VERSIONS_PREFIX}${Date.now()}-${randomUUID()}.json`;

  // New object key each write → no CDN overwrite lag for the source of truth.
  await writeStorageJson(RESELLERS_BUCKET, versionPath, payload, admin);
  setMemoryResellersStore(normalized, versionPath, true);

  // Legacy path kept for backups / older readers (best-effort, non-blocking).
  void writeStorageJson(RESELLERS_BUCKET, RESELLERS_OBJECT_PATH, payload, admin).catch(() => {});
  void pruneResellerVersions(admin).catch(() => {});

  return { resellers: normalized };
}

export async function findAuthUserByEmail(email, admin = getSupabaseAdmin()) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;

  let page = 1;
  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const users = Array.isArray(data?.users) ? data.users : [];
    const match = users.find((user) => String(user.email || "").trim().toLowerCase() === normalized);
    if (match) return match;
    if (users.length < 200) break;
    page += 1;
  }

  return null;
}

export function buildResellerProfileFromAuthUser(authUser) {
  if (!authUser) return {};
  const profile = extractDiscordProfile(authUser);
  return {
    discord_auth_user_id: profile.authUserId || authUser.id || null,
    discord_user_id: profile.discordUserId || null,
    discord_username: profile.username || null,
    discord_avatar_url: profile.avatarUrl || null,
  };
}

export async function findResellerForAuthUser(authUser, admin = getSupabaseAdmin()) {
  if (!authUser) return null;
  const store = await readResellersStore(admin);
  const email = String(authUser.email || "").trim().toLowerCase();
  const authUserId = String(authUser.id || "").trim();

  let match =
    store.resellers.find((entry) => entry.discord_auth_user_id && entry.discord_auth_user_id === authUserId) ||
    store.resellers.find((entry) => entry.email === email) ||
    null;

  if (!match || match.status !== "active") return null;

  const profile = buildResellerProfileFromAuthUser(authUser);
  const needsBackfill =
    (!match.discord_auth_user_id && profile.discord_auth_user_id) ||
    (!match.discord_username && profile.discord_username) ||
    (!match.discord_avatar_url && profile.discord_avatar_url);

  if (needsBackfill) {
    match = await updateResellerRecord(match.id, profile, admin);
  }

  return match;
}

export async function updateResellerRecord(resellerId, patch, admin = getSupabaseAdmin()) {
  const expectedBalance =
    patch.balance != null && Number.isFinite(Number(patch.balance)) ? Math.round(Number(patch.balance) * 100) / 100 : null;
  const expectsPurchased = Boolean(patch.purchased_store_product_ids || patch.purchased_store_products);

  const store = await readResellersStore(admin);
  const index = store.resellers.findIndex((entry) => entry.id === resellerId);
  if (index < 0) throw new Error("Reseller not found.");

  const current = store.resellers[index];
  const purchasedStoreProducts = mergePurchasedStoreProducts(
    current.purchased_store_products,
    current.purchased_store_product_ids?.map((id) => ({ id })),
    patch.purchased_store_products,
    Array.isArray(patch.purchased_store_product_ids)
      ? patch.purchased_store_product_ids.map((id) => ({ id }))
      : []
  );

  const updated = normalizeReseller({
    ...current,
    ...patch,
    purchased_store_products: purchasedStoreProducts,
    purchased_store_product_ids: purchasedStoreProducts.map((row) => row.id),
    ...(expectedBalance != null ? { balance: expectedBalance } : {}),
    updated_at: new Date().toISOString(),
  });

  const next = [...store.resellers];
  next[index] = updated;
  await writeResellersStore(next, admin);

  // Balance-only credits must return immediately — multi-retry verify against Storage
  // CDN caused multi-second lag before the API (and UI balance) could update.
  if (!expectsPurchased) {
    return updated;
  }

  // Purchased-product patches: one quick verify + single rewrite if Storage lagged.
  await new Promise((resolve) => setTimeout(resolve, 40));
  const verifyStore = await readResellersStore(admin);
  const verified = verifyStore.resellers.find((entry) => entry.id === resellerId);
  if (!verified) return updated;

  const expectedIds = new Set(updated.purchased_store_product_ids || []);
  const gotIds = new Set(verified.purchased_store_product_ids || []);
  const purchasedOk = [...expectedIds].every((id) => gotIds.has(id));
  const balanceOk =
    expectedBalance == null || Math.abs((Number(verified.balance) || 0) - expectedBalance) < 0.001;

  if (balanceOk && purchasedOk) {
    return normalizeReseller({
      ...verified,
      balance: expectedBalance != null ? expectedBalance : verified.balance,
      total_spent: patch.total_spent != null ? updated.total_spent : verified.total_spent,
      purchased_store_products: mergePurchasedStoreProducts(
        verified.purchased_store_products,
        updated.purchased_store_products
      ),
      updated_at: updated.updated_at,
    });
  }

  const rewritten = [...verifyStore.resellers];
  const rewriteIndex = rewritten.findIndex((entry) => entry.id === resellerId);
  if (rewriteIndex >= 0) {
    rewritten[rewriteIndex] = updated;
    await writeResellersStore(rewritten, admin);
  }
  return updated;
}

