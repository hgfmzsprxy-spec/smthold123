import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  extractDiscordProfile,
  isExpiredLicenseRecord,
  normalizeLicenseStatus,
} from "../../../lib/loader-redeem";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

function readBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function resolveAuthUser(token) {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey || !token) return null;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function POST(request) {
  try {
    const token = readBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await resolveAuthUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const licenseKey = String(body?.license_key || body?.licenseKey || "").trim();
    const appId = String(body?.app_id || body?.appId || "").trim();

    if (!licenseKey || !appId) {
      return NextResponse.json({ error: "license_key and app_id are required." }, { status: 400 });
    }

    const profile = extractDiscordProfile(user);
    if (!profile?.authUserId || !profile?.discordUserId) {
      return NextResponse.json(
        { error: "Could not read Discord profile from the OAuth session." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    const { data: license, error: lookupError } = await admin
      .from("licenses")
      .select(
        "id, license_key, app_id, status, activated_at, expires_at, hwid, discord_auth_user_id, discord_user_id, discord_username, discord_avatar_url",
      )
      .eq("license_key", licenseKey)
      .eq("app_id", appId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message || "License lookup failed." }, { status: 500 });
    }
    if (!license) {
      return NextResponse.json({ error: "License not found!" }, { status: 404 });
    }
    if (String(license.app_id || "").trim() !== appId) {
      return NextResponse.json({ error: "This license belongs to a different product." }, { status: 403 });
    }

    const status = normalizeLicenseStatus(license.status);
    if (status === "banned" || status === "revoked" || status === "disabled") {
      return NextResponse.json({ error: "This license is not available." }, { status: 403 });
    }
    if (isExpiredLicenseRecord(license)) {
      return NextResponse.json({ error: "This license has expired." }, { status: 403 });
    }

    const linkedAuthId = String(license.discord_auth_user_id || "").trim();
    const linkedDiscordId = String(license.discord_user_id || "").trim();

    if (linkedAuthId && linkedAuthId !== profile.authUserId) {
      return NextResponse.json(
        { error: "This license is already connected to another Discord account." },
        { status: 409 },
      );
    }
    if (!linkedAuthId && linkedDiscordId && linkedDiscordId !== profile.discordUserId) {
      return NextResponse.json(
        { error: "This license is already connected to another Discord account." },
        { status: 409 },
      );
    }

    if (linkedAuthId === profile.authUserId) {
      return NextResponse.json({
        ok: true,
        already_linked: true,
        data: {
          license_key: license.license_key,
          app_id: license.app_id,
          discord_username: license.discord_username || profile.username,
          discord_avatar_url: license.discord_avatar_url || profile.avatarUrl || null,
          discord_auth_user_id: license.discord_auth_user_id,
        },
      });
    }

    const patch = {
      discord_auth_user_id: profile.authUserId,
      discord_user_id: profile.discordUserId,
      discord_username: profile.username,
      discord_avatar_url: profile.avatarUrl || null,
      ...(profile.email ? { discord_email: profile.email } : {}),
    };

    const { data, error } = await admin
      .from("licenses")
      .update(patch)
      .eq("id", license.id)
      .select("license_key, app_id, discord_username, discord_avatar_url, discord_auth_user_id")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Could not assign Discord to this license." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
