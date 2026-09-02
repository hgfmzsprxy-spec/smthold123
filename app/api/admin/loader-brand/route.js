import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  computeResellerMetrics,
  readResellersStore,
  updateResellerRecord,
} from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
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

    const admin = getSupabaseAdmin();
    const store = await readResellersStore(admin);
    const current = (store.resellers || []).find((entry) => entry.id === resellerId);
    if (!current) {
      return NextResponse.json({ error: "Reseller not found." }, { status: 404 });
    }

    const updated = await updateResellerRecord(resellerId, { loader_brand: null }, admin);
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
