import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDiscordProfile } from "./loader-redeem";
import { ALLOWED_ADMIN_DISCORD_ID } from "./admin-constants";

export { ALLOWED_ADMIN_DISCORD_ID };

function splitAdminIds(raw) {
  return String(raw || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{17,20}$/.test(value));
}

/** Allowed Discord IDs: hardcoded default + optional env list. */
export function getAllowedAdminDiscordIds() {
  const ids = new Set([ALLOWED_ADMIN_DISCORD_ID]);
  splitAdminIds(process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS).forEach((id) => ids.add(id));
  splitAdminIds(process.env.ADMIN_DISCORD_IDS).forEach((id) => ids.add(id));
  splitAdminIds(process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID).forEach((id) => ids.add(id));
  splitAdminIds(process.env.ADMIN_DISCORD_ID).forEach((id) => ids.add(id));
  return ids;
}

export function getAdminDiscordProfile(user) {
  return extractDiscordProfile(user);
}

function readJwtPayload(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function enrichUserFromAccessToken(user, accessToken) {
  const payload = readJwtPayload(accessToken);
  if (!payload || typeof payload !== "object") return user;
  return {
    ...user,
    user_metadata: {
      ...(payload.user_metadata || {}),
      ...(user?.user_metadata || {}),
    },
    app_metadata: {
      ...(payload.app_metadata || {}),
      ...(user?.app_metadata || {}),
    },
  };
}

export function isAllowedAdminUser(user, accessToken = "") {
  const enriched = accessToken ? enrichUserFromAccessToken(user, accessToken) : user;
  const profile = extractDiscordProfile(enriched);
  if (!profile.discordUserId) return false;
  return getAllowedAdminDiscordIds().has(profile.discordUserId);
}

/** Primary owner Discord ID (hardcoded fallback). Only this account can edit Protections. */
export function isMainAdminDiscordId(discordUserId) {
  return String(discordUserId || "").trim() === ALLOWED_ADMIN_DISCORD_ID;
}

export async function requireMainAdmin(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth;
  if (!isMainAdminDiscordId(auth.discord?.discordUserId)) {
    return {
      error: NextResponse.json(
        { error: "Only the main administrator can change protection settings.", allowed: false },
        { status: 403 }
      ),
      user: auth.user,
      discord: auth.discord,
    };
  }
  return auth;
}

export async function requireAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) {
    return { error: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = enrichUserFromAccessToken(data.user, token);
  if (!isAllowedAdminUser(user, token)) {
    return {
      error: NextResponse.json(
        { error: "This Discord account is not allowed to access the admin panel.", allowed: false },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    discord: getAdminDiscordProfile(user),
  };
}
