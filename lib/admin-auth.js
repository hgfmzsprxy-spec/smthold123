import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDiscordProfile } from "./loader-redeem";

export const ALLOWED_ADMIN_DISCORD_ID = "1383200339565613137";

export function getAdminDiscordProfile(user) {
  return extractDiscordProfile(user);
}

export function isAllowedAdminUser(user) {
  const profile = extractDiscordProfile(user);
  return Boolean(profile.discordUserId) && profile.discordUserId === ALLOWED_ADMIN_DISCORD_ID;
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

  if (!isAllowedAdminUser(data.user)) {
    return {
      error: NextResponse.json(
        { error: "This Discord account is not allowed to access the admin panel.", allowed: false },
        { status: 403 }
      ),
    };
  }

  return {
    user: data.user,
    discord: getAdminDiscordProfile(data.user),
  };
}
