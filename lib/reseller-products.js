import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";

export const DEFAULT_RESELLER_STORE_PRODUCTS = [
  {
    slug: "loader-rebrand",
    name: "Loader Rebrand",
    price: 149.99,
    variantLabel: "One-Time",
    productId: 804671,
    variantId: 1376598,
    description:
      "A fully rebranded web-remote Loader tailored for your reseller brand. It will only include the products you currently resell, so your customers get a clean, white-labeled delivery experience.",
  },
  {
    slug: "cheat-menu-rebrand",
    name: "Cheat Menu Rebrand",
    price: 249.99,
    variantLabel: "One-Time",
    productId: 804668,
    variantId: 1376593,
    description:
      "Rebrand a single cheat menu exclusively for your brand. Ideal when you need a polished custom UI for one product without rebuilding the full loader stack.",
  },
  {
    slug: "bundle-rebrand-vip",
    name: "Bundle Rebrand (VIP)",
    price: 699.99,
    variantLabel: "VIP Bundle",
    productId: 804674,
    variantId: 1376603,
    description:
      "Full VIP rebrand package: custom Loader plus three cheat menu rebrands. Best value when you want a complete white-labeled reseller toolkit in one order.",
  },
  {
    slug: "custom-license-format",
    name: "Custom License(s) Format",
    price: 29.99,
    variantLabel: "One-Time",
    productId: 804679,
    variantId: 1376608,
    description:
      "Customize how license keys are generated and displayed for your customers — prefixes, segments, separators, and formatting rules that match your brand workflow.",
  },
  {
    slug: "discord-bot-auth",
    name: "Discord Bot Auth",
    price: 74.99,
    variantLabel: "One-Time",
    productId: 804684,
    variantId: 1376613,
    description:
      "Generate license keys directly from Discord and optionally grant support staff permission to create keys. Streamlines delivery and ticket handling inside your server.",
  },
];

const TABLE = "reseller_store_products";
const TABLE_MISSING_HINT =
  "Reseller store products table is missing. Run supabase/reseller-store-products.sql in the Supabase SQL Editor.";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatPriceLabel(price) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

function isMissingTableError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");
  return code === "42P01" || /relation .* does not exist|could not find the table/i.test(message);
}

export function normalizeResellerProduct(entry, index = 0) {
  if (!entry || typeof entry !== "object") return null;

  const name = String(entry.name || "").trim();
  const productId = Number(entry.productId ?? entry.product_id);
  const variantId = Number(entry.variantId ?? entry.variant_id);
  if (!name || !Number.isFinite(productId) || productId <= 0 || !Number.isFinite(variantId) || variantId <= 0) {
    return null;
  }

  const priceRaw = Number(entry.price);
  const price = Number.isFinite(priceRaw) ? Math.round(priceRaw * 100) / 100 : 0;
  const slugBase = slugify(entry.slug) || slugify(name) || `product-${index + 1}`;
  const id = String(entry.id || "").trim() || randomUUID();

  return {
    id,
    slug: slugBase,
    name,
    description: String(entry.description || "").trim(),
    price,
    priceLabel: String(entry.priceLabel || entry.price_label || "").trim() || formatPriceLabel(price),
    variantLabel: String(entry.variantLabel || entry.variant_label || "One-Time").trim() || "One-Time",
    productId: Math.trunc(productId),
    variantId: Math.trunc(variantId),
    sort_order: Number.isFinite(Number(entry.sort_order)) ? Number(entry.sort_order) : index,
    created_at: String(entry.created_at || "").trim() || new Date().toISOString(),
    updated_at: String(entry.updated_at || entry.created_at || "").trim() || new Date().toISOString(),
  };
}

export function sortResellerProducts(products) {
  return [...products].sort((a, b) => {
    const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function rowToProduct(row, index = 0) {
  return normalizeResellerProduct(
    {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      price: row.price,
      priceLabel: row.price_label,
      variantLabel: row.variant_label,
      productId: row.product_id,
      variantId: row.variant_id,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    index
  );
}

function productToRow(product, index = 0) {
  const normalized = normalizeResellerProduct(product, index);
  if (!normalized) return null;
  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    description: normalized.description,
    price: normalized.price,
    price_label: normalized.priceLabel,
    variant_label: normalized.variantLabel,
    product_id: normalized.productId,
    variant_id: normalized.variantId,
    sort_order: Number.isFinite(Number(normalized.sort_order)) ? Number(normalized.sort_order) : index,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

async function tryMigrateFromStorage(admin) {
  try {
    const { data, error } = await admin.storage.from("resellers-data").download("reseller-store-products.json");
    if (error || !data) return null;
    const text = await data.text();
    const parsed = JSON.parse(text || "{}");
    const products = Array.isArray(parsed?.products)
      ? sortResellerProducts(parsed.products.map((entry, index) => normalizeResellerProduct(entry, index)).filter(Boolean))
      : [];
    if (!products.length) return null;
    await writeResellerProductsStore(products, admin);
    return products;
  } catch {
    return null;
  }
}

export async function readResellerProductsStore(admin = getSupabaseAdmin()) {
  const { data, error } = await admin
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(TABLE_MISSING_HINT);
    }
    throw error;
  }

  const products = sortResellerProducts((data || []).map((row, index) => rowToProduct(row, index)).filter(Boolean));
  if (products.length) return { products };

  const migrated = await tryMigrateFromStorage(admin);
  if (migrated?.length) return { products: migrated };

  // Table exists but empty — do not re-seed (admin may have deleted everything).
  return { products: [] };
}

export async function writeResellerProductsStore(products, admin = getSupabaseAdmin()) {
  const normalized = sortResellerProducts(
    (Array.isArray(products) ? products : []).map((entry, index) => normalizeResellerProduct(entry, index)).filter(Boolean)
  );

  const usedSlugs = new Set();
  const unique = normalized.map((product, index) => {
    let slug = product.slug || `product-${index + 1}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index + 1}`;
    usedSlugs.add(slug);
    return { ...product, slug, sort_order: index, updated_at: new Date().toISOString() };
  });

  const rows = unique.map((product, index) => productToRow(product, index)).filter(Boolean);

  const { data: existing, error: existingError } = await admin.from(TABLE).select("id");
  if (existingError) {
    if (isMissingTableError(existingError)) {
      throw new Error(TABLE_MISSING_HINT);
    }
    throw existingError;
  }

  const nextIds = new Set(rows.map((row) => row.id));
  const staleIds = (existing || []).map((row) => row.id).filter((id) => !nextIds.has(id));

  if (staleIds.length) {
    const { error: deleteError } = await admin.from(TABLE).delete().in("id", staleIds);
    if (deleteError) throw deleteError;
  }

  if (rows.length) {
    const { error: upsertError } = await admin.from(TABLE).upsert(rows, { onConflict: "id" });
    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        throw new Error(TABLE_MISSING_HINT);
      }
      throw upsertError;
    }
  }

  return { products: unique };
}

export async function getResellerProductById(id, admin = getSupabaseAdmin()) {
  const store = await readResellerProductsStore(admin);
  return store.products.find((product) => product.id === id) || null;
}

export async function getResellerProductBySlug(slug, admin = getSupabaseAdmin()) {
  const normalized = slugify(slug);
  const store = await readResellerProductsStore(admin);
  return store.products.find((product) => product.slug === normalized) || null;
}
