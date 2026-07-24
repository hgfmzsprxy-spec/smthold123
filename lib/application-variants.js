import { getSupabaseAdmin } from "./supabase-admin";

const TABLE = "application_variants";
export const TABLE_MISSING_HINT =
  "Application variants table is missing. Run supabase/application-variants.sql in the Supabase SQL Editor.";

export const VARIANT_DURATION_UNITS = ["minutes", "hours", "days", "weeks", "months", "unlimited"];

function isMissingTableError(error) {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");
  return code === "42P01" || /relation .* does not exist|could not find the table/i.test(message);
}

export function slugifyVariant(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeVariant(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "").trim();
  const applicationId = String(row.application_id || row.applicationId || "").trim();
  const label = String(row.label || "").trim();
  if (!id || !applicationId || !label) return null;

  const unit = String(row.duration_unit || row.durationUnit || "days")
    .trim()
    .toLowerCase();
  const durationUnit = VARIANT_DURATION_UNITS.includes(unit) ? unit : "days";
  const rawValue = row.duration_value ?? row.durationValue;
  const durationValue =
    durationUnit === "unlimited"
      ? null
      : Number.isFinite(Number(rawValue))
        ? Math.max(1, Math.trunc(Number(rawValue)))
        : 1;

  const price = Number(row.price);
  return {
    id,
    applicationId,
    application_id: applicationId,
    slug: String(row.slug || slugifyVariant(label) || id).trim(),
    label,
    price: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : 0,
    durationValue,
    duration_value: durationValue,
    durationUnit,
    duration_unit: durationUnit,
    sortOrder: Number.isFinite(Number(row.sort_order ?? row.sortOrder))
      ? Number(row.sort_order ?? row.sortOrder)
      : 0,
    sort_order: Number.isFinite(Number(row.sort_order ?? row.sortOrder))
      ? Number(row.sort_order ?? row.sortOrder)
      : 0,
    active: row.active !== false,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

export function formatVariantDuration(variant) {
  if (!variant) return "-";
  const unit = String(variant.durationUnit || variant.duration_unit || "").toLowerCase();
  if (unit === "unlimited") return "Unlimited";
  const value = variant.durationValue ?? variant.duration_value;
  if (!Number.isFinite(Number(value))) return "-";
  const label = unit.endsWith("s") ? unit : `${unit}s`;
  return `${value} ${label}`;
}

export function computeResellerUnitPrice(retailPrice, discountPercent) {
  const price = Number(retailPrice);
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  if (!Number.isFinite(price) || price <= 0) return 0;
  const unit = Math.round(price * (1 - discount / 100) * 100) / 100;
  return Math.max(0, unit);
}

export async function listVariantsForApplication(applicationId, admin = getSupabaseAdmin(), { activeOnly = false } = {}) {
  const appId = String(applicationId || "").trim();
  if (!appId) return [];

  let query = admin
    .from(TABLE)
    .select("*")
    .eq("application_id", appId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }

  return (data || []).map(normalizeVariant).filter(Boolean);
}

export async function listVariantsForApplications(applicationIds, admin = getSupabaseAdmin(), { activeOnly = true } = {}) {
  const ids = [...new Set((Array.isArray(applicationIds) ? applicationIds : []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return [];

  let query = admin
    .from(TABLE)
    .select("*")
    .in("application_id", ids)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }

  return (data || []).map(normalizeVariant).filter(Boolean);
}

export async function getVariantById(variantId, admin = getSupabaseAdmin()) {
  const id = String(variantId || "").trim();
  if (!id) return null;
  const { data, error } = await admin.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }
  return normalizeVariant(data);
}

export async function createVariant(payload, admin = getSupabaseAdmin()) {
  const applicationId = String(payload?.applicationId || payload?.application_id || "").trim();
  const label = String(payload?.label || "").trim();
  if (!applicationId || !label) throw new Error("Application and variant label are required.");

  const unit = String(payload?.durationUnit || payload?.duration_unit || "days")
    .trim()
    .toLowerCase();
  const durationUnit = VARIANT_DURATION_UNITS.includes(unit) ? unit : "days";
  const price = Number(payload?.price);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid non-negative number.");

  const durationValue =
    durationUnit === "unlimited"
      ? null
      : Math.max(1, Math.trunc(Number(payload?.durationValue ?? payload?.duration_value ?? 1)));

  const slug =
    slugifyVariant(payload?.slug || label) ||
    `variant-${Date.now().toString(36)}`;

  const row = {
    application_id: applicationId,
    slug,
    label,
    price: Math.round(price * 100) / 100,
    duration_value: durationValue,
    duration_unit: durationUnit,
    sort_order: Number.isFinite(Number(payload?.sortOrder ?? payload?.sort_order))
      ? Number(payload?.sortOrder ?? payload?.sort_order)
      : 0,
    active: payload?.active !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin.from(TABLE).insert(row).select("*").single();
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }
  return normalizeVariant(data);
}

export async function updateVariant(variantId, payload, admin = getSupabaseAdmin()) {
  const id = String(variantId || "").trim();
  if (!id) throw new Error("Variant id is required.");

  const patch = { updated_at: new Date().toISOString() };

  if (payload?.label != null) {
    const label = String(payload.label || "").trim();
    if (!label) throw new Error("Variant label is required.");
    patch.label = label;
  }

  if (payload?.slug != null) {
    const slug = slugifyVariant(payload.slug);
    if (!slug) throw new Error("Variant slug is required.");
    patch.slug = slug;
  }

  if (payload?.price != null) {
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid non-negative number.");
    patch.price = Math.round(price * 100) / 100;
  }

  if (payload?.durationUnit != null || payload?.duration_unit != null || payload?.durationValue != null || payload?.duration_value != null) {
    const unit = String(payload?.durationUnit ?? payload?.duration_unit ?? "days")
      .trim()
      .toLowerCase();
    const durationUnit = VARIANT_DURATION_UNITS.includes(unit) ? unit : "days";
    patch.duration_unit = durationUnit;
    patch.duration_value =
      durationUnit === "unlimited"
        ? null
        : Math.max(1, Math.trunc(Number(payload?.durationValue ?? payload?.duration_value ?? 1)));
  }

  if (payload?.sortOrder != null || payload?.sort_order != null) {
    patch.sort_order = Number(payload?.sortOrder ?? payload?.sort_order) || 0;
  }

  if (payload?.active != null) {
    patch.active = Boolean(payload.active);
  }

  const { data, error } = await admin.from(TABLE).update(patch).eq("id", id).select("*").maybeSingle();
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }
  if (!data) throw new Error("Variant not found.");
  return normalizeVariant(data);
}

export async function deleteVariant(variantId, admin = getSupabaseAdmin()) {
  const id = String(variantId || "").trim();
  if (!id) throw new Error("Variant id is required.");
  const { error } = await admin.from(TABLE).delete().eq("id", id);
  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error(TABLE_MISSING_HINT);
      err.code = "TABLE_MISSING";
      throw err;
    }
    throw error;
  }
  return true;
}
