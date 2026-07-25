import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
  defaultProtectionLogColumns,
  deleteProtectionLogById,
  deleteProtectionLogsByFilter,
  readProtectionLogStore,
  writeIgnoredProtectionLogUserIds,
} from "../../../../lib/panel-protection-logs";
import { getResellerDisplayName, readResellersStore } from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

function readFilterParams(request) {
  const url = new URL(request.url);
  return {
    appId: String(url.searchParams.get("appId") || url.searchParams.get("app_id") || "all").trim() || "all",
    sourceId:
      String(url.searchParams.get("sourceId") || url.searchParams.get("source_id") || "all").trim() || "all",
    id: String(url.searchParams.get("id") || "").trim(),
  };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const { appId, sourceId } = readFilterParams(request);

    const [store, resellerStore] = await Promise.all([readProtectionLogStore(admin), readResellersStore(admin)]);

    let entries = store.entries || [];
    if (appId && appId !== "all") {
      entries = entries.filter((entry) => String(entry.app_id || "") === appId);
    }
    if (sourceId && sourceId !== "all") {
      if (sourceId === LOCAL_PROTECTION_SOURCE_ID) {
        entries = entries.filter((entry) => !String(entry.reseller_id || "").trim());
      } else {
        entries = entries.filter((entry) => String(entry.reseller_id || "") === sourceId);
      }
    }

    const sources = [
      { id: LOCAL_PROTECTION_SOURCE_ID, label: LOCAL_PROTECTION_SOURCE_LABEL, type: "local" },
      ...(resellerStore.resellers || []).map((reseller) => ({
        id: reseller.id,
        label: getResellerDisplayName(reseller) || reseller.email || reseller.id,
        type: "reseller",
        email: reseller.email || "",
      })),
    ];

    return NextResponse.json({
      ok: true,
      entries,
      sources,
      ignored_user_ids: store.ignored_user_ids || [],
      columns: PROTECTION_LOG_COLUMNS,
      default_columns: defaultProtectionLogColumns(),
      local_source_id: LOCAL_PROTECTION_SOURCE_ID,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const admin = getSupabaseAdmin();

    if (
      Object.prototype.hasOwnProperty.call(body, "ignored_user_ids") ||
      Object.prototype.hasOwnProperty.call(body, "ignoredUserIds")
    ) {
      const payload = await writeIgnoredProtectionLogUserIds(
        body.ignored_user_ids ?? body.ignoredUserIds,
        admin
      );
      return NextResponse.json({
        ok: true,
        ignored_user_ids: payload.ignored_user_ids,
        updated_at: payload.updated_at,
      });
    }

    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const { appId, sourceId, id } = readFilterParams(request);

    if (id) {
      const result = await deleteProtectionLogById(id, admin);
      return NextResponse.json({
        ok: true,
        deleted: result.deleted,
        ids: result.ids,
      });
    }

    const result = await deleteProtectionLogsByFilter({ appId, sourceId }, admin);

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      ids: result.ids,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
