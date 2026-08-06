import { NextResponse } from "next/server";
import {
  appendProtectionLog,
  buildProtectionLogFromLicense,
  isProtectionLogUserIgnored,
  lookupLicenseForProtectionLog,
  readIgnoredProtectionLogUserIds,
} from "../../../lib/panel-protection-logs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const licenseKey = String(body?.license_key || body?.licenseKey || "").trim();
    const appId = String(body?.app_id || body?.appId || "").trim();
    const hardwareId = String(body?.hardware_id || body?.hwid || body?.hardwareId || "").trim();

    if (!licenseKey) {
      return NextResponse.json({ error: "license_key is required." }, { status: 400 });
    }
    if (!appId) {
      return NextResponse.json({ error: "app_id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const license = await lookupLicenseForProtectionLog(licenseKey, appId, admin);
    if (!license) {
      return NextResponse.json({ error: "License not found." }, { status: 404 });
    }

    const discordUserId = String(
      body?.discord_user_id || body?.discordUserId || license.discord_user_id || ""
    ).trim();
    const ignoredUserIds = await readIgnoredProtectionLogUserIds(admin).catch(() => []);
    if (isProtectionLogUserIgnored(discordUserId, ignoredUserIds)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "ignored_user",
      });
    }

    const entry = await buildProtectionLogFromLicense({
      license,
      appId,
      success: body?.success !== false,
      message: body?.message || "",
      hardwareId,
      discordUsername: body?.discord_username || body?.discordUsername || "",
      discordAvatarUrl: body?.discord_avatar_url || body?.discordAvatarUrl || "",
      discordUserId,
      discordEmail: body?.discord_email || body?.discordEmail || "",
      admin,
    });

    const written = await appendProtectionLog(entry, admin);
    return NextResponse.json({ ok: true, entry: written.entry });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
