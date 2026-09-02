import { randomUUID } from "crypto";
import { ALLOWED_ADMIN_DISCORD_ID } from "./admin-constants";
import {
  defaultAdminStaffPermissions,
  defaultResellerStaffPermissions,
} from "./panel-permissions";
import {
  DEFAULT_TEAM_MEMBER_LIMIT,
  normalizeTeamMember,
  normalizeTeamMemberLimit,
  normalizeTeamMembers,
  publicTeamMember,
} from "./panel-team-normalize";
import { RESELLERS_BUCKET, readResellersStore, updateResellerRecord } from "./resellers";
import { getSupabaseAdmin } from "./supabase-admin";
import { readStorageJson, writeStorageJson } from "./storage-json";

export {
  DEFAULT_TEAM_MEMBER_LIMIT,
  normalizeTeamMember,
  normalizeTeamMemberLimit,
  normalizeTeamMembers,
  publicTeamMember,
} from "./panel-team-normalize";

export const ADMIN_TEAM_OBJECT_PATH = "admin-team.json";

function splitAdminIds(raw) {
  return String(raw || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d{17,20}$/.test(value));
}

function getAllowedAdminDiscordIdsLocal() {
  const ids = new Set([ALLOWED_ADMIN_DISCORD_ID]);
  splitAdminIds(process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS).forEach((id) => ids.add(id));
  splitAdminIds(process.env.ADMIN_DISCORD_IDS).forEach((id) => ids.add(id));
  splitAdminIds(process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID).forEach((id) => ids.add(id));
  splitAdminIds(process.env.ADMIN_DISCORD_ID).forEach((id) => ids.add(id));
  return ids;
}

export async function readAdminTeamStore(admin = getSupabaseAdmin()) {
  const parsed = await readStorageJson(RESELLERS_BUCKET, ADMIN_TEAM_OBJECT_PATH, admin);
  const members = normalizeTeamMembers(parsed?.members, "admin");
  return { members };
}

export async function writeAdminTeamStore(members, admin = getSupabaseAdmin()) {
  const normalized = normalizeTeamMembers(members, "admin");
  await writeStorageJson(RESELLERS_BUCKET, ADMIN_TEAM_OBJECT_PATH, { members: normalized }, admin);
  return { members: normalized };
}

export function findTeamMemberInReseller(reseller, { discordUserId = "", authUserId = "" } = {}) {
  const members = normalizeTeamMembers(reseller?.team_members, "reseller");
  const snowflake = String(discordUserId || "").trim();
  const authId = String(authUserId || "").trim();
  return (
    members.find(
      (entry) =>
        entry.status === "active" &&
        ((snowflake && entry.discord_user_id === snowflake) ||
          (authId && entry.discord_auth_user_id && entry.discord_auth_user_id === authId))
    ) || null
  );
}

export async function findResellerStaffForAuthUser(authUser, discordUserId, admin = getSupabaseAdmin()) {
  const store = await readResellersStore(admin);
  const snowflake = String(discordUserId || "").trim();
  const authId = String(authUser?.id || "").trim();

  for (const reseller of store.resellers) {
    if (reseller.status !== "active") continue;
    const member = findTeamMemberInReseller(reseller, { discordUserId: snowflake, authUserId: authId });
    if (!member) continue;
    return { reseller, member };
  }
  return null;
}

export async function findAdminStaffForDiscord(discordUserId, authUserId = "", admin = getSupabaseAdmin()) {
  const store = await readAdminTeamStore(admin);
  const snowflake = String(discordUserId || "").trim();
  const authId = String(authUserId || "").trim();
  return (
    store.members.find(
      (entry) =>
        entry.status === "active" &&
        ((snowflake && entry.discord_user_id === snowflake) ||
          (authId && entry.discord_auth_user_id && entry.discord_auth_user_id === authId))
    ) || null
  );
}

export async function isDiscordUserResellerOwner(discordUserId, admin = getSupabaseAdmin()) {
  const snowflake = String(discordUserId || "").trim();
  if (!snowflake) return false;
  const store = await readResellersStore(admin);
  return store.resellers.some(
    (entry) => entry.status === "active" && String(entry.discord_user_id || "").trim() === snowflake
  );
}

export function isDiscordUserAdminAllowlisted(discordUserId) {
  const snowflake = String(discordUserId || "").trim();
  if (!snowflake) return false;
  return getAllowedAdminDiscordIdsLocal().has(snowflake);
}

/** Holy rule: cannot add admins or existing reseller owners. */
export async function assertCanInviteDiscordUser(discordUserId, admin = getSupabaseAdmin()) {
  const snowflake = String(discordUserId || "").trim();
  if (!/^\d{17,20}$/.test(snowflake)) {
    return { ok: false, error: "Enter a valid Discord user ID." };
  }
  if (isDiscordUserAdminAllowlisted(snowflake)) {
    return { ok: false, error: "You cannot add administrators to a team." };
  }
  if (await isDiscordUserResellerOwner(snowflake, admin)) {
    return { ok: false, error: "You cannot add existing resellers to a team." };
  }
  const adminStaff = await findAdminStaffForDiscord(snowflake, "", admin);
  if (adminStaff) {
    return { ok: false, error: "You cannot add admin team staff to a reseller team." };
  }
  return { ok: true };
}

export async function addResellerTeamMember(resellerId, payload, admin = getSupabaseAdmin()) {
  const store = await readResellersStore(admin);
  const reseller = store.resellers.find((entry) => entry.id === resellerId);
  if (!reseller) throw new Error("Reseller not found.");

  if (reseller.team_invite_blocked) {
    throw new Error("Team invites are blocked for this reseller by an administrator.");
  }

  const discordUserId = String(payload.discord_user_id || "").trim();
  const gate = await assertCanInviteDiscordUser(discordUserId, admin);
  if (!gate.ok) throw new Error(gate.error);

  const members = normalizeTeamMembers(reseller.team_members, "reseller");
  if (members.some((entry) => entry.discord_user_id === discordUserId)) {
    throw new Error("This Discord user is already on the team.");
  }

  const limit = normalizeTeamMemberLimit(reseller.team_member_limit);
  if (members.filter((entry) => entry.status === "active").length >= limit) {
    throw new Error(`Team member limit reached (${limit}). Ask an administrator to raise the limit.`);
  }

  const member = normalizeTeamMember(
    {
      id: randomUUID(),
      discord_user_id: discordUserId,
      discord_username: payload.discord_username || null,
      discord_avatar_url: payload.discord_avatar_url || null,
      permissions: payload.permissions || defaultResellerStaffPermissions(),
      status: "active",
      created_by: payload.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "reseller"
  );

  const updated = await updateResellerRecord(
    resellerId,
    { team_members: [...members, member] },
    admin
  );
  return { reseller: updated, member };
}

export async function updateResellerTeamMember(resellerId, memberId, patch, admin = getSupabaseAdmin()) {
  const store = await readResellersStore(admin);
  const reseller = store.resellers.find((entry) => entry.id === resellerId);
  if (!reseller) throw new Error("Reseller not found.");

  const members = normalizeTeamMembers(reseller.team_members, "reseller");
  const index = members.findIndex((entry) => entry.id === memberId);
  if (index < 0) throw new Error("Team member not found.");

  const current = members[index];
  const nextMember = normalizeTeamMember(
    {
      ...current,
      ...patch,
      id: current.id,
      discord_user_id: current.discord_user_id,
      permissions: patch.permissions != null ? patch.permissions : current.permissions,
      updated_at: new Date().toISOString(),
    },
    "reseller"
  );
  const nextMembers = [...members];
  nextMembers[index] = nextMember;
  const updated = await updateResellerRecord(resellerId, { team_members: nextMembers }, admin);
  return { reseller: updated, member: nextMember };
}

export async function removeResellerTeamMember(resellerId, memberId, admin = getSupabaseAdmin()) {
  const store = await readResellersStore(admin);
  const reseller = store.resellers.find((entry) => entry.id === resellerId);
  if (!reseller) throw new Error("Reseller not found.");
  const members = normalizeTeamMembers(reseller.team_members, "reseller");
  const nextMembers = members.filter((entry) => entry.id !== memberId);
  if (nextMembers.length === members.length) throw new Error("Team member not found.");
  const updated = await updateResellerRecord(resellerId, { team_members: nextMembers }, admin);
  return { reseller: updated };
}

export async function addAdminTeamMember(payload, admin = getSupabaseAdmin()) {
  const discordUserId = String(payload.discord_user_id || "").trim();
  if (!/^\d{17,20}$/.test(discordUserId)) throw new Error("Enter a valid Discord user ID.");
  if (isDiscordUserAdminAllowlisted(discordUserId)) {
    throw new Error("This Discord account already has full admin allowlist access.");
  }
  if (await isDiscordUserResellerOwner(discordUserId, admin)) {
    throw new Error("Existing resellers cannot be added as admin staff.");
  }

  const store = await readAdminTeamStore(admin);
  if (store.members.some((entry) => entry.discord_user_id === discordUserId)) {
    throw new Error("This Discord user is already on the admin team.");
  }

  const member = normalizeTeamMember(
    {
      id: randomUUID(),
      discord_user_id: discordUserId,
      discord_username: payload.discord_username || null,
      discord_avatar_url: payload.discord_avatar_url || null,
      permissions: payload.permissions || defaultAdminStaffPermissions(),
      status: "active",
      created_by: payload.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "admin"
  );

  const next = await writeAdminTeamStore([...store.members, member], admin);
  return { member, members: next.members };
}

export async function updateAdminTeamMember(memberId, patch, admin = getSupabaseAdmin()) {
  const store = await readAdminTeamStore(admin);
  const index = store.members.findIndex((entry) => entry.id === memberId);
  if (index < 0) throw new Error("Admin team member not found.");
  const current = store.members[index];
  const nextMember = normalizeTeamMember(
    {
      ...current,
      ...patch,
      id: current.id,
      discord_user_id: current.discord_user_id,
      permissions: patch.permissions != null ? patch.permissions : current.permissions,
      updated_at: new Date().toISOString(),
    },
    "admin"
  );
  const members = [...store.members];
  members[index] = nextMember;
  await writeAdminTeamStore(members, admin);
  return { member: nextMember, members };
}

export async function removeAdminTeamMember(memberId, admin = getSupabaseAdmin()) {
  const store = await readAdminTeamStore(admin);
  const members = store.members.filter((entry) => entry.id !== memberId);
  if (members.length === store.members.length) throw new Error("Admin team member not found.");
  await writeAdminTeamStore(members, admin);
  return { members };
}

export async function bindTeamMemberAuthUser(
  { kind, ownerResellerId, memberId, authUserId, profile },
  admin = getSupabaseAdmin()
) {
  if (!authUserId || !memberId) return null;
  const profilePatch = {
    discord_auth_user_id: authUserId,
    discord_username: profile?.username || undefined,
    discord_avatar_url: profile?.avatarUrl || undefined,
    email: profile?.email || undefined,
  };

  if (kind === "admin") {
    return updateAdminTeamMember(memberId, profilePatch, admin);
  }
  if (!ownerResellerId) return null;
  return updateResellerTeamMember(ownerResellerId, memberId, profilePatch, admin);
}
