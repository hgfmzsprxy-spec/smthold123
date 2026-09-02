import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  computeResellerMetrics,
  normalizeLoaderBrand,
  readResellersStore,
  updateResellerRecord,
} from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "resellers.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const resellerId = String(body?.id || body?.resellerId || "").trim();
    if (!resellerId) {
      return NextResponse.json({ error: "Reseller id is required." }, { status: 400 });
    }

    const blocked = Boolean(body?.blocked);

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    const current = (store.resellers || []).find((entry) => entry.id === resellerId);
    if (!current) {
      return NextResponse.json({ error: "Reseller not found." }, { status: 404 });
    }

    const existing = normalizeLoaderBrand(current.loader_brand) || {
      color: "",
      brand_name: "",
      logo: "",
      discord_link: "",
      auto_logo_size: true,
      slug: "",
      blocked: false,
    };

    const loaderBrand = normalizeLoaderBrand({
      ...existing,
      blocked,
    });

    const updated = await updateResellerRecord(resellerId, { loader_brand: loaderBrand }, admin);
    const nextStore = await readResellersStore(admin);

    return NextResponse.json({
      ok: true,
      reseller: updated,
      resellers: nextStore.resellers,
      metrics: computeResellerMetrics(nextStore.resellers),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
