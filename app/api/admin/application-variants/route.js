import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  createVariant,
  deleteVariant,
  listVariantsForApplication,
  updateVariant,
} from "../../../../lib/application-variants";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "apps.view");
    if (denied) return denied;

    const applicationId = String(request.nextUrl.searchParams.get("applicationId") || "").trim();
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const variants = await listVariantsForApplication(applicationId, admin, { activeOnly: false });
    return NextResponse.json({ variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "apps.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const admin = getSupabaseAdmin();
    const variant = await createVariant(body, admin);
    const variants = await listVariantsForApplication(variant.applicationId, admin, { activeOnly: false });
    return NextResponse.json({ ok: true, variant, variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 400;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "apps.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Variant id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const variant = await updateVariant(id, body, admin);
    const variants = await listVariantsForApplication(variant.applicationId, admin, { activeOnly: false });
    return NextResponse.json({ ok: true, variant, variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 400;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "apps.edit");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const applicationId = String(body?.applicationId || body?.application_id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Variant id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await deleteVariant(id, admin);
    const variants = applicationId
      ? await listVariantsForApplication(applicationId, admin, { activeOnly: false })
      : [];
    return NextResponse.json({ ok: true, variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 400;
    return NextResponse.json({ error: error?.message || String(error) }, { status });
  }
}
