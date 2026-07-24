import { createClient } from "@supabase/supabase-js";
import { findResellerForAuthUser, getResellerDisplayName } from "./resellers";
import { isSessionRevoked, resolveResellerSessionId } from "./reseller-sessions";
import { getSupabaseAdmin } from "./supabase-admin";

export async function requireReseller(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) {
    return {
      error: Response.json(
        { error: "Reseller access requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      ),
    };
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

  const admin = getSupabaseAdmin();
  const sessionId = resolveResellerSessionId(token, request);
  const deviceKey = String(request.headers.get("x-resell-device-session") || "").trim();
  if (sessionId && (await isSessionRevoked(data.user.id, sessionId, admin, [deviceKey]))) {
    return { error: Response.json({ error: "Session revoked.", revoked: true }, { status: 401 }) };
  }

  const reseller = await findResellerForAuthUser(data.user, admin);
  if (!reseller) {
    return {
      error: Response.json(
        { error: "This Discord account is not registered as a reseller.", allowed: false },
        { status: 403 }
      ),
    };
  }

  return {
    user: data.user,
    reseller,
    admin,
    accessToken: token,
    sessionId,
    publicReseller: {
      id: reseller.id,
      email: reseller.email,
      username: getResellerDisplayName(reseller),
      discord_username: reseller.discord_username,
      discord_user_id: reseller.discord_user_id,
      discord_auth_user_id: reseller.discord_auth_user_id || data.user.id,
      discord_avatar_url: reseller.discord_avatar_url,
      role: reseller.role || "reseller",
      discount_percent: Number.isFinite(Number(reseller.discount_percent))
        ? Number(reseller.discount_percent)
        : 0,
      balance: reseller.balance,
      total_spent: reseller.total_spent,
      application_access: reseller.application_access,
      total_licenses: reseller.total_licenses,
      generated_license_ids: reseller.generated_license_ids,
      purchased_store_product_ids: Array.isArray(reseller.purchased_store_product_ids)
        ? reseller.purchased_store_product_ids
        : [],
      purchased_store_products: Array.isArray(reseller.purchased_store_products)
        ? reseller.purchased_store_products
        : [],
      updated_at: reseller.updated_at || null,
    },
  };
}
