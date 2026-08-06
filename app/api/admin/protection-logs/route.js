import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
  defaultProtectionLogColumns,
  deleteProtectionLogById,
  deleteProtectionLogsByFilter,
  loadProtectionLogScreenshotsByIds,
  readProtectionLogStore,
  signProtectionLogScreenshotPaths,
  writeIgnoredProtectionLogUserIds,
} from "../../../../lib/panel-protection-logs";
import { getResellerDisplayName, readResellersStore } from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    // Never sign screenshots on the list GET — that was timing out (504) on Vercel.
    // Thumbnails are signed lazily via POST { sign_paths: [...] }.
    let store;
    try {
      store = await readProtectionLogStore(admin, { signScreenshots: false });
    } catch (e) {
      console.error("readProtectionLogStore error:", e);
      return NextResponse.json(
        {
          ok: false,
          error: e?.message || String(e),
          entries: [],
          sources: [],
          ignored_user_ids: [],
          columns: PROTECTION_LOG_COLUMNS,
          default_columns: defaultProtectionLogColumns(),
          local_source_id: LOCAL_PROTECTION_SOURCE_ID,
          screenshots_signed: false,
        },
        { status: 500 }
      );
    }

    const resellerStore = await readResellersStore(admin).catch(() => ({ resellers: [] }));

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
      screenshots_signed: false,
    });
  } catch (error) {
    console.error("GET protection-logs ERROR:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const admin = getSupabaseAdmin();

    const entryIds = Array.isArray(body.entry_ids)
      ? body.entry_ids
      : Array.isArray(body.entryIds)
        ? body.entryIds
        : [];

    // Lazy-load slim screenshot meta (+ signed URLs) for visible log rows only.
    if (entryIds.length) {
      const result = await loadProtectionLogScreenshotsByIds(entryIds, admin, {
        sign: true,
        // Allow data: URLs only for legacy rows that never uploaded to storage.
        allowDataUrl: true,
      });
      return NextResponse.json({
        ok: true,
        by_id: result.by_id,
        urls: result.urls,
      });
    }

    const paths = Array.isArray(body.sign_paths)
      ? body.sign_paths
      : Array.isArray(body.signPaths)
        ? body.signPaths
        : [];

    const urls = await signProtectionLogScreenshotPaths(paths, admin);
    return NextResponse.json({ ok: true, urls });
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
