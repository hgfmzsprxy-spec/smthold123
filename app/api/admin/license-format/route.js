import { requireAdmin } from "../../../../lib/admin-auth";
import {
  readAdminLicenseFormat,
  writeAdminLicenseFormat,
} from "../../../../lib/admin-license-format";
import { normalizeLicenseFormat, validateLicenseFormatPattern } from "../../../../lib/license-key-format";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const licenseFormat = await readAdminLicenseFormat(auth.adminClient || undefined);
    return Response.json({
      ok: true,
      license_format: licenseFormat,
      can_edit: auth.actor !== "staff",
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (auth.actor === "staff") {
      return Response.json(
        {
          error: "Only head administrators can change the shared license format.",
          code: "ERR_PERMISSION_DENIED",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pattern = String(body.pattern || "").trim();
    const validationError = validateLicenseFormatPattern(pattern);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const next = normalizeLicenseFormat({
      pattern,
      special_chars: Boolean(body.special_chars ?? body.specialChars),
      digits: body.digits !== undefined ? Boolean(body.digits) : true,
    });
    if (!next) {
      return Response.json({ error: "Enter a license format pattern." }, { status: 400 });
    }

    const licenseFormat = await writeAdminLicenseFormat(next, auth.adminClient || undefined);
    return Response.json({ ok: true, license_format: licenseFormat, can_edit: true });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
