import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { assertPermission } from "../../../../lib/panel-permissions";
import {
  buildFreezeLicensePatch,
  buildUnfreezeLicensePatch,
  isApplicationFrozen,
  isFreezableLicense,
  isFrozenLicense,
} from "../../../../lib/license-freeze";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchAllLicensesForApplication(admin, app) {
  const byId = new Map();

  const { data: byApplicationId, error: byApplicationError } = await admin
    .from("licenses")
    .select("*")
    .eq("application_id", app.id);
  if (byApplicationError) throw byApplicationError;
  (byApplicationId || []).forEach((row) => {
    if (row?.id) byId.set(String(row.id), row);
  });

  if (app.app_id) {
    const { data: byAppId, error: byAppIdError } = await admin
      .from("licenses")
      .select("*")
      .eq("app_id", app.app_id);
    if (byAppIdError) throw byAppIdError;
    (byAppId || []).forEach((row) => {
      if (row?.id) byId.set(String(row.id), row);
    });
  }

  return [...byId.values()];
}

async function applyLicensePatches(admin, patches) {
  const updated = [];
  for (const batch of chunkArray(patches, 25)) {
    const results = await Promise.all(
      batch.map(async ({ id, patch }) => {
        const { data, error } = await admin
          .from("licenses")
          .update(patch)
          .eq("id", id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        return data;
      })
    );
    updated.push(...results.filter(Boolean));
  }
  return updated;
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "apps.freeze");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || body?.application_id || body?.id || "").trim();
    const requestedAction = String(body?.action || "toggle").trim().toLowerCase();
    const restoreStatus = String(body?.restoreStatus || body?.restore_status || "Active").trim() || "Active";

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }
    if (!["freeze", "unfreeze", "toggle"].includes(requestedAction)) {
      return NextResponse.json({ error: "action must be freeze, unfreeze, or toggle." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: app, error: appError } = await admin
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) {
      return NextResponse.json({ error: appError.message || String(appError) }, { status: 500 });
    }
    if (!app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const currentlyFrozen = isApplicationFrozen(app);
    const shouldFreeze =
      requestedAction === "freeze" || (requestedAction === "toggle" && !currentlyFrozen);

    if (shouldFreeze && currentlyFrozen) {
      return NextResponse.json({
        ok: true,
        action: "freeze",
        already: true,
        application: app,
        licenses: [],
        licenseCount: 0,
      });
    }
    if (!shouldFreeze && !currentlyFrozen) {
      return NextResponse.json({
        ok: true,
        action: "unfreeze",
        already: true,
        application: app,
        licenses: [],
        licenseCount: 0,
      });
    }

    const licenses = await fetchAllLicensesForApplication(admin, app);
    const now = Date.now();

    let licensePatches = [];
    let applicationPatch;

    if (shouldFreeze) {
      applicationPatch = {
        status: "Maintenance",
        download_updated_at: new Date(now).toISOString(),
      };
      licensePatches = licenses
        .filter((license) => isFreezableLicense(license))
        .map((license) => ({
          id: license.id,
          patch: buildFreezeLicensePatch(license, now),
        }));
    } else {
      applicationPatch = {
        status: restoreStatus,
        download_updated_at: new Date(now).toISOString(),
      };
      licensePatches = licenses
        .filter((license) => isFrozenLicense(license))
        .map((license) => ({
          id: license.id,
          patch: buildUnfreezeLicensePatch(license, now),
        }));
    }

    const { data: updatedApp, error: updateAppError } = await admin
      .from("applications")
      .update(applicationPatch)
      .eq("id", app.id)
      .select("*")
      .maybeSingle();

    if (updateAppError) {
      return NextResponse.json({ error: updateAppError.message || String(updateAppError) }, { status: 500 });
    }

    const updatedLicenses = await applyLicensePatches(admin, licensePatches);

    return NextResponse.json({
      ok: true,
      action: shouldFreeze ? "freeze" : "unfreeze",
      application: updatedApp || { ...app, ...applicationPatch },
      licenses: updatedLicenses,
      licenseCount: updatedLicenses.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
