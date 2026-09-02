import { listVariantsForApplications } from "../../../../lib/application-variants";
import {
  RESELL_APPLICATION_SELECT,
  fetchResellLicensesByIds,
} from "../../../../lib/panel-bootstrap-selects";
import { canAccessApp } from "../../../../lib/panel-permissions";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import { touchResellerSession } from "../../../../lib/reseller-sessions";
import { attachStaffGeneratorsToLicenses } from "../../../../lib/resellers";

export const dynamic = "force-dynamic";

function computeLicenseMetrics(licenses) {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  let banned = 0;

  licenses.forEach((license) => {
    const status = String(license.status || "").trim().toLowerCase();
    if (status === "banned" || status === "revoked") {
      banned += 1;
      return;
    }
    if (status === "expired") {
      expired += 1;
      return;
    }
    // Freezed / paused keys keep remaining time frozen — do not count as active.
    if (status === "freezed" || status === "frozen" || status === "paused") {
      return;
    }
    const expires = license.expires_at ? new Date(license.expires_at).getTime() : null;
    if (expires && expires <= now) {
      expired += 1;
      return;
    }
    if (status === "not activated" || status === "active" || status === "activated" || Boolean(license.activated_at)) {
      active += 1;
    }
  });

  return {
    total: licenses.length,
    active,
    expired,
    banned,
  };
}

async function fetchAllApplications(admin) {
  const { data, error } = await admin
    .from("applications")
    .select(RESELL_APPLICATION_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const touched = await touchResellerSession({
      authUserId: auth.user.id,
      accessToken: token,
      request,
      admin: auth.admin,
    });
    if (touched?.revoked) {
      return Response.json({ error: "Session revoked.", revoked: true }, { status: 401 });
    }

    const accessIds = Array.isArray(auth.reseller.application_access)
      ? auth.reseller.application_access.map((id) => String(id))
      : [];
    const accessIdSet = new Set(accessIds);
    const licenseIds = Array.isArray(auth.reseller.generated_license_ids)
      ? auth.reseller.generated_license_ids
      : [];

    const [allApplications, licenses] = await Promise.all([
      fetchAllApplications(auth.admin),
      fetchResellLicensesByIds(auth.admin, licenseIds),
    ]);

    let variants = [];
    try {
      variants = await listVariantsForApplications(accessIds, auth.admin, { activeOnly: true });
    } catch (error) {
      if (error?.code !== "TABLE_MISSING") throw error;
      variants = [];
    }

    const variantsByApp = {};
    variants.forEach((variant) => {
      const key = variant.applicationId;
      if (!variantsByApp[key]) variantsByApp[key] = [];
      variantsByApp[key].push(variant);
    });

    // Keep admin order (created_at desc from fetchAllApplications). Unassigned apps stay locked/blurred.
    const applicationsWithVariants = allApplications.map((app) => {
      const hasAccess =
        accessIdSet.has(String(app.id)) && canAccessApp(auth.permissions, app.id, accessIds);
      return {
        ...app,
        has_access: hasAccess,
        locked: !hasAccess,
        variants: hasAccess ? variantsByApp[app.id] || [] : [],
      };
    });

    const accessibleApps = applicationsWithVariants.filter((app) => app.has_access);
    const scopedLicenses = attachStaffGeneratorsToLicenses(
      licenses.filter((license) => {
        const applicationId = String(license.application_id || "").trim();
        if (applicationId && canAccessApp(auth.permissions, applicationId, accessIds)) return true;
        return accessibleApps.some((app) => app.app_id && app.app_id === license.app_id);
      }),
      auth.reseller.staff_license_generators
    );

    return Response.json({
      allowed: true,
      reseller: auth.publicReseller,
      applications: applicationsWithVariants,
      variants,
      licenses: scopedLicenses,
      metrics: computeLicenseMetrics(scopedLicenses),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
