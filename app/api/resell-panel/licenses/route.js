import { computeResellerUnitPrice, getVariantById } from "../../../../lib/application-variants";
import {
  CUSTOM_LICENSE_FORMAT_SLUG,
  generateDefaultLicenseKey,
  generateLicenseKeyFromFormat,
  normalizeLicenseFormat,
  resellerOwnsStoreProductId,
} from "../../../../lib/license-key-format";
import {
  buildBanLicensePatch,
  buildUnbanLicensePatch,
  isBannedLicense,
} from "../../../../lib/license-freeze";
import { extractDiscordProfile } from "../../../../lib/loader-redeem";
import { assertPermission, canAccessApp } from "../../../../lib/panel-permissions";
import { getResellerProductBySlug } from "../../../../lib/reseller-products";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import {
  attachStaffGeneratorsToLicenses,
  normalizeResellerDiscount,
  normalizeResellerRole,
  normalizeStaffLicenseGenerators,
  pruneStaffLicenseGenerators,
  updateResellerRecord,
} from "../../../../lib/resellers";
import {
  appendTransaction,
  buildResellerTransactionActor,
  TRANSACTION_TYPES,
} from "../../../../lib/transactions";

export const dynamic = "force-dynamic";

function resellerOwnsLicense(reseller, license) {
  const licenseId = String(license?.id || "").trim();
  if (!licenseId || !reseller) return false;
  const ownedIds = Array.isArray(reseller.generated_license_ids)
    ? reseller.generated_license_ids.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (ownedIds.includes(licenseId)) return true;
  return (
    license.reseller_id != null && String(license.reseller_id).trim() === String(reseller.id).trim()
  );
}

async function resolveResellerLicenseKey(reseller, admin) {
  const format = normalizeLicenseFormat(reseller?.license_format);
  if (!format) return generateDefaultLicenseKey();

  try {
    const product = await getResellerProductBySlug(CUSTOM_LICENSE_FORMAT_SLUG, admin);
    if (product?.id && resellerOwnsStoreProductId(reseller, product.id)) {
      return generateLicenseKeyFromFormat(format);
    }
  } catch {
    // fall through to default key format
  }

  return generateDefaultLicenseKey();
}

export async function POST(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const deniedGenerate = assertPermission(auth.permissions, "licenses.generate");
    if (deniedGenerate) return deniedGenerate;

    const body = await request.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || body?.application_id || "").trim();
    const variantId = String(body?.variantId || body?.variant_id || "").trim();
    let quantity = Math.max(1, Math.min(50, Number(body?.quantity || 1)));

    if (!applicationId) {
      return Response.json({ error: "applicationId is required." }, { status: 400 });
    }
    if (!variantId) {
      return Response.json({ error: "Select a license variant." }, { status: 400 });
    }

    const accessIds = Array.isArray(auth.reseller.application_access) ? auth.reseller.application_access : [];
    if (!accessIds.includes(applicationId)) {
      return Response.json({ error: "You do not have permission for this application." }, { status: 403 });
    }
    if (!canAccessApp(auth.permissions, applicationId, accessIds)) {
      return Response.json(
        { error: "You do not have permission for this application.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const maxQty = auth.permissions?.["limits.generate_max_qty"];
    if (maxQty != null && Number.isFinite(Number(maxQty))) {
      quantity = Math.min(quantity, Math.max(1, Number(maxQty)));
    }

    const variant = await getVariantById(variantId, auth.admin);
    if (!variant || !variant.active) {
      return Response.json({ error: "Variant not found." }, { status: 404 });
    }
    if (variant.applicationId !== applicationId) {
      return Response.json({ error: "Variant does not belong to this application." }, { status: 400 });
    }

    const durationUnit = String(variant.durationUnit || "days").toLowerCase();
    const durationValue = durationUnit === "unlimited" ? null : Number(variant.durationValue || 0);
    if (durationUnit !== "unlimited" && (!Number.isFinite(durationValue) || durationValue <= 0)) {
      return Response.json({ error: "Selected variant has an invalid duration." }, { status: 400 });
    }

    const role = normalizeResellerRole(auth.reseller.role);
    const discountPercent = normalizeResellerDiscount(role, auth.reseller.discount_percent);
    const unitPrice = computeResellerUnitPrice(variant.price, discountPercent);
    const totalCost = Math.round(unitPrice * quantity * 100) / 100;
    const currentBalance = Number(auth.reseller.balance) || 0;

    if (totalCost > currentBalance) {
      return Response.json(
        {
          error: `Insufficient balance. Need ${totalCost.toFixed(2)} USD, you have ${currentBalance.toFixed(2)} USD.`,
          balance: currentBalance,
          unitPrice,
          totalCost,
        },
        { status: 402 }
      );
    }

    const { data: app, error: appError } = await auth.admin
      .from("applications")
      .select("id, app_id, name, version, webhook, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) throw appError;
    if (!app) {
      return Response.json({ error: "Application not found." }, { status: 404 });
    }

    const keys = [];
    for (let index = 0; index < quantity; index += 1) {
      keys.push(await resolveResellerLicenseKey(auth.reseller, auth.admin));
    }
    const rowsFull = keys.map((key) => ({
      license_key: key,
      status: "Not Activated",
      application_id: app.id,
      app_id: app.app_id || null,
      app_name: app.name || null,
      app_version: app.version || "1.0.0",
      app_webhook: app.webhook || null,
      duration_value: durationValue,
      duration_unit: durationUnit,
      activated_at: null,
      expires_at: null,
      hwid: null,
      reseller_id: auth.reseller.id,
      variant_id: variant.id,
      variant_label: variant.label,
    }));

    const rowsWithoutExtra = rowsFull.map(({ variant_id: _v, variant_label: _l, ...row }) => row);
    const rowsWithoutResellerCol = rowsWithoutExtra.map(({ reseller_id: _ignored, ...row }) => row);

    const rowsMinimal = keys.map((key) => ({
      license_key: key,
      status: "Not Activated",
      application_id: app.id,
      app_id: app.app_id || null,
      duration_value: durationValue,
      duration_unit: durationUnit,
    }));

    let created = null;
    let insertError = null;

    for (const rows of [rowsFull, rowsWithoutExtra, rowsWithoutResellerCol, rowsMinimal]) {
      ({ data: created, error: insertError } = await auth.admin.from("licenses").insert(rows).select("*"));
      if (!insertError) break;
    }

    if (insertError) {
      return Response.json({ error: insertError.message || String(insertError) }, { status: 500 });
    }

    const createdRows = (Array.isArray(created) ? created : [created]).filter(Boolean);
    const createdIds = createdRows.map((row) => String(row.id)).filter(Boolean);
    const nextLicenseIds = [...createdIds, ...(auth.reseller.generated_license_ids || [])];
    const nextBalance = Math.round((currentBalance - totalCost) * 100) / 100;
    const nextSpent = Math.round(((Number(auth.reseller.total_spent) || 0) + totalCost) * 100) / 100;

    const staffGeneratorsPatch = {};
    const staffDiscord =
      auth.actor === "staff" && auth.user ? extractDiscordProfile(auth.user) : null;
    const staffProfile =
      auth.actor === "staff" && auth.teamMember
        ? {
            team_member_id: auth.teamMember.id || null,
            discord_user_id:
              auth.teamMember.discord_user_id ||
              staffDiscord?.discordUserId ||
              auth.publicReseller?.discord_user_id ||
              null,
            discord_username:
              auth.teamMember.discord_username ||
              staffDiscord?.username ||
              auth.publicReseller?.discord_username ||
              null,
            discord_avatar_url:
              auth.teamMember.discord_avatar_url ||
              staffDiscord?.avatarUrl ||
              auth.publicReseller?.discord_avatar_url ||
              null,
          }
        : null;

    if (staffProfile && createdIds.length) {
      const generatedAt = new Date().toISOString();
      const nextGenerators = {
        ...normalizeStaffLicenseGenerators(auth.reseller.staff_license_generators),
      };
      const generator = {
        ...staffProfile,
        generated_at: generatedAt,
      };
      createdIds.forEach((id) => {
        nextGenerators[id] = generator;
      });
      staffGeneratorsPatch.staff_license_generators = pruneStaffLicenseGenerators(
        nextGenerators,
        nextLicenseIds
      );
    }

    const updatedReseller = await updateResellerRecord(
      auth.reseller.id,
      {
        generated_license_ids: nextLicenseIds,
        total_licenses: nextLicenseIds.length,
        balance: nextBalance,
        total_spent: nextSpent,
        ...staffGeneratorsPatch,
      },
      auth.admin
    );

    let transaction = null;
    try {
      transaction = await appendTransaction(
        {
          type: TRANSACTION_TYPES.LICENSE_PURCHASE,
          ...buildResellerTransactionActor(updatedReseller),
          amount: -totalCost,
          balance_before: currentBalance,
          balance_after: nextBalance,
          description: `Purchased ${quantity}× ${variant.label} for ${app.name}`,
          actor: auth.actor === "staff" ? "reseller_staff" : "reseller",
          meta: {
            application_id: app.id,
            application_name: app.name,
            variant_id: variant.id,
            variant_label: variant.label,
            quantity,
            unit_price: unitPrice,
            total_cost: totalCost,
            license_ids: createdIds,
            license_keys: createdRows.map((row) => row.license_key).filter(Boolean),
            ...(staffProfile
              ? {
                  staff_team_member_id: staffProfile.team_member_id,
                  staff_discord_user_id: staffProfile.discord_user_id,
                  staff_discord_username: staffProfile.discord_username,
                  staff_discord_avatar_url: staffProfile.discord_avatar_url,
                  staff_generated_at: new Date().toISOString(),
                }
              : {}),
          },
        },
        auth.admin
      );
    } catch {
      // non-blocking ledger write
    }

    return Response.json({
      ok: true,
      licenses: attachStaffGeneratorsToLicenses(
        createdRows,
        updatedReseller.staff_license_generators || staffGeneratorsPatch.staff_license_generators
      ),
      transaction,
      pricing: {
        variantId: variant.id,
        variantLabel: variant.label,
        retailPrice: variant.price,
        unitPrice,
        quantity,
        totalCost,
        discountPercent,
        role,
      },
      reseller: {
        id: updatedReseller.id,
        role: updatedReseller.role,
        discount_percent: updatedReseller.discount_percent,
        balance: nextBalance,
        total_spent: nextSpent,
        total_licenses: updatedReseller.total_licenses,
        application_access: updatedReseller.application_access,
        generated_license_ids: updatedReseller.generated_license_ids,
        updated_at: updatedReseller.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const licenseId = String(body?.id || body?.licenseId || "").trim();
    const action = String(body?.action || "").trim().toLowerCase();
    if (!licenseId) {
      return Response.json({ error: "License id is required." }, { status: 400 });
    }
    if (!["ban", "unban", "toggle_ban", "reset_hwid"].includes(action)) {
      return Response.json({ error: "Unsupported license action." }, { status: 400 });
    }

    const neededPerm = action === "reset_hwid" ? "licenses.reset_hwid" : "licenses.ban";
    const denied = assertPermission(auth.permissions, neededPerm);
    if (denied) return denied;

    const { data: license, error: fetchError } = await auth.admin
      .from("licenses")
      .select("*")
      .eq("id", licenseId)
      .maybeSingle();

    if (fetchError) {
      return Response.json({ error: fetchError.message || String(fetchError) }, { status: 500 });
    }
    if (!license) {
      return Response.json({ error: "License not found." }, { status: 404 });
    }
    if (!resellerOwnsLicense(auth.reseller, license)) {
      return Response.json({ error: "You can only manage licenses you generated." }, { status: 403 });
    }

    const accessIds = Array.isArray(auth.reseller.application_access) ? auth.reseller.application_access : [];
    const applicationId = String(license.application_id || "").trim();
    if (applicationId && !canAccessApp(auth.permissions, applicationId, accessIds)) {
      return Response.json(
        { error: "You do not have permission for this application.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    let patch = null;
    if (action === "reset_hwid") {
      patch = { hwid: null };
    } else if (action === "ban") {
      patch = buildBanLicensePatch(license);
    } else if (action === "unban") {
      patch = buildUnbanLicensePatch(license);
    } else {
      patch = isBannedLicense(license) ? buildUnbanLicensePatch(license) : buildBanLicensePatch(license);
    }

    const { data: updated, error: updateError } = await auth.admin
      .from("licenses")
      .update(patch)
      .eq("id", licenseId)
      .select("*")
      .maybeSingle();

    if (updateError) {
      return Response.json({ error: updateError.message || String(updateError) }, { status: 500 });
    }

    return Response.json({
      ok: true,
      action,
      license: updated || { ...license, ...patch },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const deniedDelete = assertPermission(auth.permissions, "licenses.delete");
    if (deniedDelete) return deniedDelete;

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const licenseId = String(body?.id || body?.licenseId || searchParams.get("id") || "").trim();
    if (!licenseId) {
      return Response.json({ error: "License id is required." }, { status: 400 });
    }

    const ownedIds = Array.isArray(auth.reseller.generated_license_ids)
      ? auth.reseller.generated_license_ids.map((value) => String(value || "").trim()).filter(Boolean)
      : [];

    const { data: license, error: fetchError } = await auth.admin
      .from("licenses")
      .select("*")
      .eq("id", licenseId)
      .maybeSingle();

    if (fetchError) {
      return Response.json({ error: fetchError.message || String(fetchError) }, { status: 500 });
    }
    if (!license) {
      return Response.json({ error: "License not found." }, { status: 404 });
    }

    if (!resellerOwnsLicense(auth.reseller, license)) {
      return Response.json({ error: "You can only delete licenses you generated." }, { status: 403 });
    }

    const { error: deleteError } = await auth.admin.from("licenses").delete().eq("id", licenseId);
    if (deleteError) {
      return Response.json({ error: deleteError.message || String(deleteError) }, { status: 500 });
    }

    const nextLicenseIds = ownedIds.filter((id) => id !== licenseId);
    const updatedReseller = await updateResellerRecord(
      auth.reseller.id,
      {
        generated_license_ids: nextLicenseIds,
        total_licenses: nextLicenseIds.length,
        staff_license_generators: pruneStaffLicenseGenerators(
          auth.reseller.staff_license_generators,
          nextLicenseIds
        ),
      },
      auth.admin
    );

    return Response.json({
      ok: true,
      deletedId: licenseId,
      // Explicit: deleting a key never restores balance.
      refunded: false,
      reseller: {
        id: updatedReseller.id,
        role: updatedReseller.role,
        discount_percent: updatedReseller.discount_percent,
        balance: updatedReseller.balance,
        total_spent: updatedReseller.total_spent,
        total_licenses: updatedReseller.total_licenses,
        application_access: updatedReseller.application_access,
        generated_license_ids: updatedReseller.generated_license_ids,
        updated_at: updatedReseller.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
