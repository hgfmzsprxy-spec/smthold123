import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./supabase-admin";

const TABLE = "reseller_deposit_variants";
export const DEPOSIT_TABLE_MISSING_HINT =
  "Deposit variants table is missing. Run supabase/reseller-deposit-variants.sql in the Supabase SQL Editor.";

export const DEFAULT_DEPOSIT_VARIANTS = [
  { slug: "deposit-20", name: "Deposit $20", payAmount: 20, bonusPercent: 0, popular: false, sort_order: 0 },
  { slug: "deposit-50", name: "Deposit $50", payAmount: 50, bonusPercent: 0, popular: false, sort_order: 1 },
  { slug: "deposit-100", name: "Deposit $100", payAmount: 100, bonusPercent: 10, popular: true, sort_order: 2 },
  { slug: "deposit-250", name: "Deposit $250", payAmount: 250, bonusPercent: 25, popular: false, sort_order: 3 },
  { slug: "deposit-1000", name: "VIP Guy", payAmount: 1000, bonusPercent: 100, popular: false, sort_order: 4 },
];

function isMissingTableError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");
  return code === "42P01" || /relation .* does not exist|could not find the table/i.test(message);
}

function throwTableMissing(error) {
  if (isMissingTableError(error)) {
    const err = new Error(DEPOSIT_TABLE_MISSING_HINT);
    err.code = "TABLE_MISSING";
    throw err;
  }
  throw error;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function computeDepositCredit(payAmount, bonusPercent) {
  const pay = Math.round((Number(payAmount) || 0) * 100) / 100;
  const bonus = Math.max(0, Number(bonusPercent) || 0);
  return Math.round(pay * (1 + bonus / 100) * 100) / 100;
}

export function normalizeDepositVariant(entry, index = 0) {
  if (!entry || typeof entry !== "object") return null;
  const payAmount = Math.round((Number(entry.payAmount ?? entry.pay_amount) || 0) * 100) / 100;
  if (!(payAmount > 0)) return null;

  const bonusPercent = Math.max(0, Math.round((Number(entry.bonusPercent ?? entry.bonus_percent) || 0) * 100) / 100);
  const creditRaw = Number(entry.creditAmount ?? entry.credit_amount);
  const creditAmount = Number.isFinite(creditRaw) && creditRaw > 0
    ? Math.round(creditRaw * 100) / 100
    : computeDepositCredit(payAmount, bonusPercent);

  const name = String(entry.name || "").trim() || `Deposit $${payAmount.toFixed(0)}`;
  const productId = Math.max(0, Math.trunc(Number(entry.productId ?? entry.product_id) || 0));
  const variantId = Math.max(0, Math.trunc(Number(entry.variantId ?? entry.variant_id) || 0));
  const id = String(entry.id || "").trim() || randomUUID();
  const slug = slugify(entry.slug) || slugify(name) || `deposit-${index + 1}`;

  return {
    id,
    slug,
    name,
    payAmount,
    payLabel: `$${payAmount.toFixed(2)}`,
    bonusPercent,
    creditAmount,
    creditLabel: `$${creditAmount.toFixed(2)}`,
    popular: Boolean(entry.popular),
    productId,
    variantId,
    sort_order: Number.isFinite(Number(entry.sort_order)) ? Number(entry.sort_order) : index,
    created_at: String(entry.created_at || "").trim() || new Date().toISOString(),
    updated_at: String(entry.updated_at || entry.created_at || "").trim() || new Date().toISOString(),
  };
}

export function sortDepositVariants(variants) {
  return [...variants].sort((a, b) => {
    const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    if (orderDiff !== 0) return orderDiff;
    return (Number(a.payAmount) || 0) - (Number(b.payAmount) || 0);
  });
}

function rowToVariant(row, index = 0) {
  return normalizeDepositVariant(
    {
      id: row.id,
      slug: row.slug,
      name: row.name,
      payAmount: row.pay_amount,
      bonusPercent: row.bonus_percent,
      creditAmount: row.credit_amount,
      popular: row.popular,
      productId: row.product_id,
      variantId: row.variant_id,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    index
  );
}

function variantToRow(variant, index = 0) {
  const normalized = normalizeDepositVariant(variant, index);
  if (!normalized) return null;
  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    pay_amount: normalized.payAmount,
    bonus_percent: normalized.bonusPercent,
    credit_amount: normalized.creditAmount,
    popular: normalized.popular,
    product_id: normalized.productId,
    variant_id: normalized.variantId,
    sort_order: Number.isFinite(Number(normalized.sort_order)) ? Number(normalized.sort_order) : index,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

async function seedDefaults(admin) {
  const now = new Date().toISOString();
  const rows = DEFAULT_DEPOSIT_VARIANTS.map((entry, index) =>
    variantToRow(
      {
        ...entry,
        creditAmount: computeDepositCredit(entry.payAmount, entry.bonusPercent),
        created_at: now,
        updated_at: now,
      },
      index
    )
  ).filter(Boolean);

  const { error } = await admin.from(TABLE).upsert(rows, { onConflict: "slug" });
  if (error) throwTableMissing(error);
  return readDepositVariantsStore(admin, { skipSeed: true });
}

export async function readDepositVariantsStore(admin = getSupabaseAdmin(), { skipSeed = false } = {}) {
  const { data, error } = await admin
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("pay_amount", { ascending: true });

  if (error) throwTableMissing(error);

  const variants = sortDepositVariants((data || []).map((row, index) => rowToVariant(row, index)).filter(Boolean));
  if (variants.length || skipSeed) return { variants };
  return seedDefaults(admin);
}

export async function writeDepositVariantsStore(variants, admin = getSupabaseAdmin()) {
  const normalized = sortDepositVariants(
    (Array.isArray(variants) ? variants : [])
      .map((entry, index) => normalizeDepositVariant(entry, index))
      .filter(Boolean)
  );

  const usedSlugs = new Set();
  const unique = normalized.map((variant, index) => {
    let slug = variant.slug || `deposit-${index + 1}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index + 1}`;
    usedSlugs.add(slug);
    return { ...variant, slug, sort_order: index };
  });

  const { data: existing, error: existingError } = await admin.from(TABLE).select("id");
  if (existingError) throwTableMissing(existingError);

  const keepIds = new Set(unique.map((entry) => entry.id));
  const removeIds = (existing || []).map((row) => row.id).filter((id) => !keepIds.has(String(id)));
  if (removeIds.length) {
    const { error: deleteError } = await admin.from(TABLE).delete().in("id", removeIds);
    if (deleteError) throwTableMissing(deleteError);
  }

  const rows = unique.map((entry, index) => variantToRow(entry, index)).filter(Boolean);
  if (rows.length) {
    const { error: upsertError } = await admin.from(TABLE).upsert(rows, { onConflict: "id" });
    if (upsertError) throwTableMissing(upsertError);
  }

  return { variants: unique };
}

export async function getDepositVariantById(id, admin = getSupabaseAdmin()) {
  const store = await readDepositVariantsStore(admin);
  return store.variants.find((variant) => variant.id === id) || null;
}
