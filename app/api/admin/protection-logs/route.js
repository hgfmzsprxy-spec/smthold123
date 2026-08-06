import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
  defaultProtectionLogColumns,
  deleteProtectionLogById,
  deleteProtectionLogsByFilter,
  readIgnoredProtectionLogUserIds,
  readProtectionLogScreenshotsByIds,
  readProtectionLogStore,
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
    screenshotsFor: String(url.searchParams.get("screenshotsFor") || "").trim(),
  };
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const { appId, sourceId, screenshotsFor } = readFilterParams(request);

    // Lightweight path: hydrate screenshots for a few log cards only.
    if (screenshotsFor) {
      const ids = screenshotsFor
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const byId = await readProtectionLogScreenshotsByIds(ids, admin).catch((e) => {
        console.error("readProtectionLogScreenshotsByIds error:", e);
        return {};
      });
      return NextResponse.json({ ok: true, screenshots: byId });
    }

    const withDeadline = (promise, ms, fallback) =>
      Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);

    const [storeResult, ignoredResult, resellerStore] = await Promise.all([
      // Fast list: never pull screenshots jsonb (often multi‑MB base64).
      withDeadline(
        readProtectionLogStore(admin, {
          includeScreenshots: false,
          signScreenshots: false,
          limit: 200,
        })
          .then((store) => ({ ok: true, store }))
          .catch((e) => {
            console.error("readProtectionLogStore error:", e);
            return {
              ok: false,
              error: e?.message || String(e),
              store: { entries: [], ignored_user_ids: [] },
            };
          }),
        12_000,
        {
          ok: false,
          error: "timed out reading protection logs",
          store: { entries: [], ignored_user_ids: [] },
        }
      ),
      withDeadline(
        readIgnoredProtectionLogUserIds(admin)
          .then((ids) => ({ ok: true, ids }))
          .catch((e) => {
            console.error("readIgnoredProtectionLogUserIds error:", e);
            return { ok: false, ids: [] };
          }),
        4_000,
        { ok: false, ids: [] }
      ),
      withDeadline(readResellersStore(admin).catch(() => ({ resellers: [] })), 4_000, {
        resellers: [],
      }),
    ]);

    const store = storeResult.store || { entries: [], ignored_user_ids: [] };
    const ignored_user_ids =
      (Array.isArray(ignoredResult.ids) && ignoredResult.ids.length
        ? ignoredResult.ids
        : store.ignored_user_ids) || [];

    let entries = Array.isArray(store.entries) ? store.entries : [];
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
      ignored_user_ids,
      columns: PROTECTION_LOG_COLUMNS,
      default_columns: defaultProtectionLogColumns(),
      local_source_id: LOCAL_PROTECTION_SOURCE_ID,
      screenshots_deferred: true,
      warnings: [
        !storeResult.ok ? `logs: ${storeResult.error || "failed to load"}` : null,
        !ignoredResult.ok ? "ignored_user_ids: failed to load" : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("GET protection-logs ERROR:", error);
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
    console.error("PUT protection-logs ERROR:", error);
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
    console.error("DELETE protection-logs ERROR:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
