import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  listCouponsForDepositVariant,
  parseCouponCodesBulk,
  replaceCouponsForDepositVariant,
} from "../../../../lib/reseller-deposit-coupons";
import { getDepositVariantById } from "../../../../lib/reseller-deposit-variants";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.view");
    if (denied) return denied;

    const variantId = String(
      request.nextUrl.searchParams.get("variantId") ||
        request.nextUrl.searchParams.get("productId") ||
        ""
    ).trim();
    if (!variantId) {
      return NextResponse.json({ error: "variantId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const variant = await getDepositVariantById(variantId, admin);
    if (!variant) {
      return NextResponse.json({ error: "Deposit variant not found." }, { status: 404 });
    }

    const coupons = await listCouponsForDepositVariant(variantId, admin);
    return NextResponse.json({
      product: { id: variant.id, name: variant.name, slug: variant.slug },
      variant,
      coupons,
      codes: coupons.map((entry) => entry.code),
      text: coupons.map((entry) => entry.code).join("\n"),
    });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "products.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const variantId = String(body?.variantId || body?.variant_id || body?.productId || body?.product_id || "").trim();
    if (!variantId) {
      return NextResponse.json({ error: "variantId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const variant = await getDepositVariantById(variantId, admin);
    if (!variant) {
      return NextResponse.json({ error: "Deposit variant not found." }, { status: 404 });
    }

    const codes =
      body?.codes != null
        ? Array.isArray(body.codes)
          ? body.codes
          : parseCouponCodesBulk(String(body.codes))
        : parseCouponCodesBulk(body?.text || "");

    const result = await replaceCouponsForDepositVariant(variantId, codes, admin);
    return NextResponse.json({
      ok: true,
      product: { id: variant.id, name: variant.name, slug: variant.slug },
      variant,
      codes: result.codes,
      text: result.codes.join("\n"),
      count: result.count,
    });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}
