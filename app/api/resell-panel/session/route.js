import { createClient } from "@supabase/supabase-js";
import { findResellerForAuthUser, getResellerDisplayName } from "../../../../lib/resellers";
import { isSessionRevoked, resolveResellerSessionId } from "../../../../lib/reseller-sessions";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

async function requireDiscordUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) {
    return { error: Response.json({ error: "Server misconfigured" }, { status: 500 }) };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: data.user, accessToken: token };
}

export async function GET(request) {
  try {
    const auth = await requireDiscordUser(request);
    if (auth.error) return auth.error;

    if (!String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) {
      return Response.json(
        { error: "Reseller access requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const admin = getSupabaseAdmin();
    const sessionId = resolveResellerSessionId(auth.accessToken, request);
    const deviceKey = String(request.headers.get("x-resell-device-session") || "").trim();
    if (sessionId && (await isSessionRevoked(auth.user.id, sessionId, admin, [deviceKey]))) {
      return Response.json({ error: "Session revoked.", revoked: true, allowed: false }, { status: 401 });
    }

    const reseller = await findResellerForAuthUser(auth.user, admin);
    if (!reseller) {
      return Response.json(
        { error: "This Discord account is not registered as a reseller.", allowed: false },
        { status: 403 }
      );
    }

    return Response.json({
      allowed: true,
      reseller: {
        id: reseller.id,
        email: reseller.email,
        username: getResellerDisplayName(reseller),
        discord_username: reseller.discord_username,
        discord_user_id: reseller.discord_user_id,
        discord_auth_user_id: reseller.discord_auth_user_id || auth.user.id,
        discord_avatar_url: reseller.discord_avatar_url,
        balance: reseller.balance,
        total_spent: reseller.total_spent,
        application_access: reseller.application_access,
        total_licenses: reseller.total_licenses,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
