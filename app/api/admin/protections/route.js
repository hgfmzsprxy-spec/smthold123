import { NextResponse } from "next/server";
import { isMainAdminDiscordId, requireAdmin, requireMainAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  PROTECTION_OPTIONS,
  readProtectionStore,
  writeProtectionStore,
} from "../../../../lib/panel-protections";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "protections.view");
    if (denied) return denied;

    const admin = getSupabaseAdmin();
    const store = await readProtectionStore(admin);
    return NextResponse.json({
      ok: true,
      options: PROTECTION_OPTIONS,
      flags: store.flags,
      updated_at: store.updated_at,
      updated_by: store.updated_by,
      can_edit: isMainAdminDiscordId(auth.discord?.discordUserId),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireMainAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const admin = getSupabaseAdmin();
    const saved = await writeProtectionStore(
      body?.flags || body,
      auth.discord?.username || auth.user?.email || "",
      admin
    );

    return NextResponse.json({
      ok: true,
      options: PROTECTION_OPTIONS,
      flags: saved.flags,
      updated_at: saved.updated_at,
      updated_by: saved.updated_by,
      can_edit: true,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
