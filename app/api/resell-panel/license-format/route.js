import { assertPermission } from "../../../../lib/panel-permissions";
import { getResellerProductBySlug } from "../../../../lib/reseller-products";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import { updateResellerRecord } from "../../../../lib/resellers";
import {
  CUSTOM_LICENSE_FORMAT_SLUG,
  normalizeLicenseFormat,
  resellerOwnsStoreProductId,
  validateLicenseFormatPattern,
} from "../../../../lib/license-key-format";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor === "staff") {
      return Response.json(
        { error: "License format is only available to the reseller owner.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const deniedPrefs = assertPermission(auth.permissions, "settings.edit_prefs");
    if (deniedPrefs) return deniedPrefs;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const product = await getResellerProductBySlug(CUSTOM_LICENSE_FORMAT_SLUG, auth.admin);
    if (!product?.id) {
      return Response.json(
        { error: "Custom License(s) Format product is unavailable right now." },
        { status: 503 }
      );
    }

    if (!resellerOwnsStoreProductId(auth.reseller, product.id)) {
      return Response.json(
        {
          error: "You need Custom License(s) Format purchased before a custom key pattern can be saved.",
          code: "ERR_CUSTOM_FORMAT_REQUIRED",
          requiredProductSlug: CUSTOM_LICENSE_FORMAT_SLUG,
        },
        { status: 402 }
      );
    }

    const pattern = String(body.pattern || "").trim();
    const validationError = validateLicenseFormatPattern(pattern);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const licenseFormat = normalizeLicenseFormat({
      pattern,
      special_chars: Boolean(body.special_chars ?? body.specialChars),
      digits: body.digits !== undefined ? Boolean(body.digits) : true,
    });

    if (!licenseFormat) {
      return Response.json({ error: "Enter a license format pattern." }, { status: 400 });
    }

    const updated = await updateResellerRecord(
      auth.reseller.id,
      { license_format: licenseFormat },
      auth.admin
    );

    return Response.json({
      ok: true,
      license_format: updated.license_format || licenseFormat,
      reseller: {
        id: updated.id,
        license_format: updated.license_format || licenseFormat,
        updated_at: updated.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
