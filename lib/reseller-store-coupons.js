import { getSupabaseAdmin } from "./supabase-admin";

const TABLE = "reseller_store_product_coupons";
export const COUPONS_TABLE_MISSING_HINT =
  "Store product coupons table is missing. Run supabase/reseller-store-product-coupons.sql in the Supabase SQL Editor.";

const RANDOM_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function isMissingTableError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");
  return code === "42P01" || /relation .* does not exist|could not find the table/i.test(message);
}

function throwTableMissing(error) {
  if (isMissingTableError(error)) {
    const err = new Error(COUPONS_TABLE_MISSING_HINT);
    err.code = "TABLE_MISSING";
    throw err;
  }
  throw error;
}

export function normalizeCouponCode(value) {
  return String(value || "").trim();
}

export function parseCouponCodesBulk(text) {
  const seen = new Set();
  const codes = [];
  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const code = normalizeCouponCode(line);
      if (!code) return;
      const key = code.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      codes.push(code);
    });
  return codes;
}

function randomChar() {
  return RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
}

export function generateCouponFromFormat(format) {
  const template = String(format || "").trim() || "COUPON-****";
  if (!template.includes("*")) {
    return `${template}${template.endsWith("-") ? "" : "-"}${randomChar()}${randomChar()}${randomChar()}${randomChar()}`;
  }
  return template.replace(/\*/g, () => randomChar());
}

export function generateCouponsFromFormat(format, quantity, existingCodes = []) {
  const count = Math.max(1, Math.min(500, Math.trunc(Number(quantity) || 1)));
  const existing = new Set(
    (Array.isArray(existingCodes) ? existingCodes : []).map((code) => normalizeCouponCode(code).toLowerCase()).filter(Boolean)
  );
  const generated = [];
  let attempts = 0;
  const maxAttempts = count * 40;

  while (generated.length < count && attempts < maxAttempts) {
    attempts += 1;
    const code = generateCouponFromFormat(format);
    const key = code.toLowerCase();
    if (!code || existing.has(key)) continue;
    existing.add(key);
    generated.push(code);
  }

  return generated;
}

export async function listCouponsForProduct(productId, admin = getSupabaseAdmin()) {
  const id = String(productId || "").trim();
  if (!id) return [];

  const { data, error } = await admin
    .from(TABLE)
    .select("id, product_id, code, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: true });

  if (error) throwTableMissing(error);
  return (data || [])
    .map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      code: normalizeCouponCode(row.code),
      created_at: row.created_at || null,
    }))
    .filter((row) => row.code);
}

function escapeIlikeExact(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

function mapCouponRow(row) {
  if (!row?.id) return null;
  return {
    id: String(row.id),
    productId: String(row.product_id),
    code: normalizeCouponCode(row.code),
    created_at: row.created_at || null,
  };
}

/** Find a coupon by code (case-insensitive) without consuming it. */
export async function findCouponByCode(codeInput, admin = getSupabaseAdmin()) {
  const code = normalizeCouponCode(codeInput);
  if (!code) return null;

  const exact = await admin
    .from(TABLE)
    .select("id, product_id, code, created_at")
    .eq("code", code)
    .limit(1);
  if (exact.error) throwTableMissing(exact.error);
  const exactRow = mapCouponRow(Array.isArray(exact.data) ? exact.data[0] : null);
  if (exactRow) return exactRow;

  const fuzzy = await admin
    .from(TABLE)
    .select("id, product_id, code, created_at")
    .ilike("code", escapeIlikeExact(code))
    .limit(1);
  if (fuzzy.error) throwTableMissing(fuzzy.error);
  return mapCouponRow(Array.isArray(fuzzy.data) ? fuzzy.data[0] : null);
}

/** Consume a coupon row by id. */
export async function consumeCouponById(couponId, admin = getSupabaseAdmin()) {
  const id = String(couponId || "").trim();
  if (!id) throw new Error("Coupon id is required.");

  const { error } = await admin.from(TABLE).delete().eq("id", id);
  if (error) throwTableMissing(error);
  return true;
}

/** Find a coupon by code (case-insensitive) and remove it from stock. */
export async function claimCouponByCode(codeInput, admin = getSupabaseAdmin()) {
  const coupon = await findCouponByCode(codeInput, admin);
  if (!coupon) {
    const err = new Error("Invalid or already used coupon.");
    err.code = "INVALID_CODE";
    throw err;
  }
  await consumeCouponById(coupon.id, admin);
  return coupon;
}

/** Claim the oldest unused coupon for a store product (FIFO). Removes it from stock. */
export async function claimNextCouponForProduct(productId, admin = getSupabaseAdmin()) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("Product id is required.");

  const { data, error } = await admin
    .from(TABLE)
    .select("id, product_id, code, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throwTableMissing(error);

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id) {
    const err = new Error("This product is out of stock. Pay with crypto or try again later.");
    err.code = "OUT_OF_STOCK";
    throw err;
  }

  const { error: deleteError } = await admin.from(TABLE).delete().eq("id", row.id);
  if (deleteError) throwTableMissing(deleteError);

  return {
    id: String(row.id),
    productId: String(row.product_id),
    code: normalizeCouponCode(row.code),
    created_at: row.created_at || null,
  };
}

export async function replaceCouponsForProduct(productId, codesInput, admin = getSupabaseAdmin()) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("Product id is required.");

  const codes = Array.isArray(codesInput) ? parseCouponCodesBulk(codesInput.join("\n")) : parseCouponCodesBulk(codesInput);

  const { error: deleteError } = await admin.from(TABLE).delete().eq("product_id", id);
  if (deleteError) throwTableMissing(deleteError);

  if (!codes.length) {
    return { codes: [], count: 0 };
  }

  const rows = codes.map((code) => ({
    product_id: id,
    code,
  }));

  const { data, error } = await admin.from(TABLE).insert(rows).select("id, product_id, code, created_at");
  if (error) throwTableMissing(error);

  return {
    codes: (data || []).map((row) => normalizeCouponCode(row.code)).filter(Boolean),
    count: (data || []).length,
  };
}
