import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getResellerProductById } from "../../../../lib/reseller-products";
import {
  listCouponsForProduct,
  parseCouponCodesBulk,
  replaceCouponsForProduct,
} from "../../../../lib/reseller-store-coupons";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const productId = String(request.nextUrl.searchParams.get("productId") || "").trim();
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const product = await getResellerProductById(productId, admin);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const coupons = await listCouponsForProduct(productId, admin);
    return NextResponse.json({
      product: { id: product.id, name: product.name, slug: product.slug },
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

    const body = await request.json().catch(() => ({}));
    const productId = String(body?.productId || body?.product_id || "").trim();
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const product = await getResellerProductById(productId, admin);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const codes =
      body?.codes != null
        ? Array.isArray(body.codes)
          ? body.codes
          : parseCouponCodesBulk(String(body.codes))
        : parseCouponCodesBulk(body?.text || "");

    const result = await replaceCouponsForProduct(productId, codes, admin);
    return NextResponse.json({
      ok: true,
      product: { id: product.id, name: product.name, slug: product.slug },
      codes: result.codes,
      text: result.codes.join("\n"),
      count: result.count,
    });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}
