import { requireAdmin } from "../../../../../lib/admin-auth";
import { assertPermission } from "../../../../../lib/panel-permissions";
import { getResellerDisplayName, readResellersStore } from "../../../../../lib/resellers";
import { normalizeTeamMemberLimit, normalizeTeamMembers, publicTeamMember } from "../../../../../lib/panel-team";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const denied = assertPermission(auth.permissions, "resellers.team_view");
    if (denied) return denied;

    const store = await readResellersStore(auth.adminClient || undefined);
    const resellers = store.resellers.map((reseller) => {
      const members = normalizeTeamMembers(reseller.team_members, "reseller");
      return {
        id: reseller.id,
        email: reseller.email,
        username: getResellerDisplayName(reseller),
        discord_user_id: reseller.discord_user_id,
        discord_username: reseller.discord_username,
        discord_avatar_url: reseller.discord_avatar_url,
        status: reseller.status,
        application_count: Array.isArray(reseller.application_access)
          ? reseller.application_access.length
          : 0,
        team_member_count: members.filter((entry) => entry.status === "active").length,
        team_member_limit: normalizeTeamMemberLimit(reseller.team_member_limit),
        team_invite_blocked: Boolean(reseller.team_invite_blocked),
        team_members: members.map(publicTeamMember),
      };
    });

    return Response.json({ ok: true, resellers });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
