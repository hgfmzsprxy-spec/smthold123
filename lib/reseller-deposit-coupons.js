import { getSupabaseAdmin } from "./supabase-admin";
import {
  generateCouponsFromFormat,
  normalizeCouponCode,
  parseCouponCodesBulk,
} from "./reseller-store-coupons";

const TABLE = "reseller_deposit_variant_coupons";
export const DEPOSIT_COUPONS_TABLE_MISSING_HINT =
  "Deposit coupons table is missing. Run supabase/reseller-deposit-variants.sql in the Supabase SQL Editor.";

function isMissingTableError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");
  return code === "42P01" || /relation .* does not exist|could not find the table/i.test(message);
}

function throwTableMissing(error) {
  if (isMissingTableError(error)) {
    const err = new Error(DEPOSIT_COUPONS_TABLE_MISSING_HINT);
    err.code = "TABLE_MISSING";
    throw err;
  }
  throw error;
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
    variantId: String(row.variant_id),
    productId: String(row.variant_id),
    code: normalizeCouponCode(row.code),
    created_at: row.created_at || null,
  };
}

export async function listCouponsForDepositVariant(variantId, admin = getSupabaseAdmin()) {
  const id = String(variantId || "").trim();
  if (!id) return [];

  const { data, error } = await admin
    .from(TABLE)
    .select("id, variant_id, code, created_at")
    .eq("variant_id", id)
    .order("created_at", { ascending: true });

  if (error) throwTableMissing(error);
  return (data || []).map(mapCouponRow).filter((row) => row?.code);
}

export async function findDepositCouponByCode(codeInput, admin = getSupabaseAdmin()) {
  const code = normalizeCouponCode(codeInput);
  if (!code) return null;

  const exact = await admin
    .from(TABLE)
    .select("id, variant_id, code, created_at")
    .eq("code", code)
    .limit(1);
  if (exact.error) throwTableMissing(exact.error);
  const exactRow = mapCouponRow(Array.isArray(exact.data) ? exact.data[0] : null);
  if (exactRow) return exactRow;

  const fuzzy = await admin
    .from(TABLE)
    .select("id, variant_id, code, created_at")
    .ilike("code", escapeIlikeExact(code))
    .limit(1);
  if (fuzzy.error) throwTableMissing(fuzzy.error);
  return mapCouponRow(Array.isArray(fuzzy.data) ? fuzzy.data[0] : null);
}

export async function consumeDepositCouponById(couponId, admin = getSupabaseAdmin()) {
  const id = String(couponId || "").trim();
  if (!id) throw new Error("Coupon id is required.");
  const { error } = await admin.from(TABLE).delete().eq("id", id);
  if (error) throwTableMissing(error);
  return true;
}

export async function replaceCouponsForDepositVariant(variantId, codesInput, admin = getSupabaseAdmin()) {
  const id = String(variantId || "").trim();
  if (!id) throw new Error("Variant id is required.");

  const codes = Array.isArray(codesInput) ? parseCouponCodesBulk(codesInput.join("\n")) : parseCouponCodesBulk(codesInput);

  const { error: deleteError } = await admin.from(TABLE).delete().eq("variant_id", id);
  if (deleteError) throwTableMissing(deleteError);

  if (!codes.length) return { codes: [], count: 0 };

  const rows = codes.map((code) => ({ variant_id: id, code }));
  const { data, error } = await admin.from(TABLE).insert(rows).select("id, variant_id, code, created_at");
  if (error) throwTableMissing(error);

  return {
    codes: (data || []).map((row) => normalizeCouponCode(row.code)).filter(Boolean),
    count: (data || []).length,
  };
}

export { generateCouponsFromFormat, parseCouponCodesBulk, normalizeCouponCode };
