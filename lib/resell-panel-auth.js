import { createClient } from "@supabase/supabase-js";
import { extractDiscordProfile } from "./loader-redeem";
import { clampResellerStaffPermissions, fullPermissions } from "./panel-permissions";
import { bindTeamMemberAuthUser, findResellerStaffForAuthUser } from "./panel-team";
import { findResellerForAuthUser, getResellerDisplayName } from "./resellers";
import { isSessionRevoked, resolveResellerSessionId } from "./reseller-sessions";
import { getSupabaseAdmin } from "./supabase-admin";

function buildPublicReseller(reseller, authUserId) {
  return {
    id: reseller.id,
    email: reseller.email,
    username: getResellerDisplayName(reseller),
    discord_username: reseller.discord_username,
    discord_user_id: reseller.discord_user_id,
    discord_auth_user_id: reseller.discord_auth_user_id || authUserId || null,
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
    loader_brand: reseller.loader_brand || null,
    license_format: reseller.license_format || null,
    discord_notification_webhook: reseller.discord_notification_webhook || null,
    discord_notification_branding: reseller.discord_notification_branding || null,
    team_member_limit: reseller.team_member_limit,
    team_invite_blocked: Boolean(reseller.team_invite_blocked),
    team_members: Array.isArray(reseller.team_members) ? reseller.team_members : [],
    updated_at: reseller.updated_at || null,
  };
}

function buildStaffPublicReseller(reseller, member, authUser, discord) {
  const permissions = clampResellerStaffPermissions(member.permissions);
  const discordUsername =
    member.discord_username || discord.username || getResellerDisplayName(reseller);
  const discordUserId = member.discord_user_id || discord.discordUserId || null;
  const discordAvatarUrl = member.discord_avatar_url || discord.avatarUrl || null;

  return {
    ...buildPublicReseller(reseller, authUser.id),
    actor: "staff",
    role: "team_staff",
    permissions,
    // Dashboard / settings show the staff member, not the owner.
    username: discordUsername,
    email: authUser.email || null,
    discord_username: discordUsername,
    discord_user_id: discordUserId,
    discord_avatar_url: discordAvatarUrl,
    discord_auth_user_id: member.discord_auth_user_id || authUser.id,
    team_member: {
      id: member.id,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      discord_avatar_url: discordAvatarUrl,
    },
    owner_reseller: {
      id: reseller.id,
      username: getResellerDisplayName(reseller),
      discord_username: reseller.discord_username || null,
      discord_user_id: reseller.discord_user_id || null,
    },
  };
}

function staffProfileNeedsSync(member, authUserId, discord) {
  if (!member.discord_auth_user_id || member.discord_auth_user_id !== authUserId) return true;
  if (discord.avatarUrl && discord.avatarUrl !== member.discord_avatar_url) return true;
  if (discord.username && discord.username !== member.discord_username) return true;
  return false;
}

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

  const owner = await findResellerForAuthUser(data.user, admin);
  if (owner) {
    return {
      user: data.user,
      reseller: owner,
      admin,
      accessToken: token,
      sessionId,
      actor: "owner",
      permissions: fullPermissions("reseller"),
      teamMember: null,
      publicReseller: {
        ...buildPublicReseller(owner, data.user.id),
        actor: "owner",
        permissions: fullPermissions("reseller"),
      },
    };
  }

  const discord = extractDiscordProfile(data.user);
  const staffMatch = await findResellerStaffForAuthUser(data.user, discord.discordUserId, admin);
  if (!staffMatch) {
    return {
      error: Response.json(
        { error: "This Discord account is not registered as a reseller.", allowed: false },
        { status: 403 }
      ),
    };
  }

  let { reseller, member } = staffMatch;
  if (staffProfileNeedsSync(member, data.user.id, discord)) {
    const bound = await bindTeamMemberAuthUser(
      {
        kind: "reseller",
        ownerResellerId: reseller.id,
        memberId: member.id,
        authUserId: data.user.id,
        profile: { ...discord, email: data.user.email || null },
      },
      admin
    );
    if (bound?.reseller) reseller = bound.reseller;
    if (bound?.member) member = bound.member;
  }

  const permissions = clampResellerStaffPermissions(member.permissions);

  return {
    user: data.user,
    reseller,
    admin,
    accessToken: token,
    sessionId,
    actor: "staff",
    permissions,
    teamMember: member,
    publicReseller: buildStaffPublicReseller(reseller, member, data.user, discord),
  };
}
