import { randomUUID } from "crypto";
import { normalizePermissions } from "./panel-permissions";

export const DEFAULT_TEAM_MEMBER_LIMIT = 3;

export function normalizeTeamMemberLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_TEAM_MEMBER_LIMIT;
  return Math.max(0, Math.min(50, Math.floor(num)));
}

export function normalizeTeamMember(entry, kind = "reseller") {
  if (!entry || typeof entry !== "object") return null;
  const discordUserId = String(entry.discord_user_id || entry.discordUserId || "").trim();
  if (!/^\d{17,20}$/.test(discordUserId)) return null;

  const id = String(entry.id || "").trim() || randomUUID();
  const status = String(entry.status || "active").trim().toLowerCase() === "disabled" ? "disabled" : "active";
  const permissions = normalizePermissions(
    entry.permissions,
    kind === "admin" ? "admin" : "reseller"
  );

  return {
    id,
    discord_user_id: discordUserId,
    discord_username: String(entry.discord_username || entry.discordUsername || "").trim() || null,
    discord_avatar_url: String(entry.discord_avatar_url || entry.discordAvatarUrl || "").trim() || null,
    discord_auth_user_id: String(entry.discord_auth_user_id || entry.discordAuthUserId || "").trim() || null,
    email: String(entry.email || "").trim() || null,
    status,
    permissions,
    created_at: String(entry.created_at || "").trim() || new Date().toISOString(),
    updated_at: String(entry.updated_at || entry.created_at || "").trim() || new Date().toISOString(),
    created_by: String(entry.created_by || "").trim() || null,
  };
}

export function normalizeTeamMembers(list, kind = "reseller") {
  const byDiscord = new Map();
  (Array.isArray(list) ? list : []).forEach((entry) => {
    const member = normalizeTeamMember(entry, kind);
    if (!member) return;
    byDiscord.set(member.discord_user_id, member);
  });
  return [...byDiscord.values()].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

export function publicTeamMember(member) {
  if (!member) return null;
  return {
    id: member.id,
    discord_user_id: member.discord_user_id,
    discord_username: member.discord_username,
    discord_avatar_url: member.discord_avatar_url,
    discord_auth_user_id: member.discord_auth_user_id || null,
    email: member.email || null,
    status: member.status,
    permissions: member.permissions,
    created_at: member.created_at,
    updated_at: member.updated_at,
  };
}
