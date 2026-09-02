import { requireAdmin } from "../../../../../../lib/admin-auth";
import { assertPermission } from "../../../../../../lib/panel-permissions";
import {
  normalizeTeamMemberLimit,
  normalizeTeamMembers,
  publicTeamMember,
  removeResellerTeamMember,
  updateResellerTeamMember,
} from "../../../../../../lib/panel-team";
import { getResellerDisplayName, readResellersStore, updateResellerRecord } from "../../../../../../lib/resellers";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const denied = assertPermission(auth.permissions, "resellers.team_view");
    if (denied) return denied;

    const params = await context.params;
    const resellerId = String(params?.id || "").trim();
    const store = await readResellersStore(auth.adminClient || undefined);
    const reseller = store.resellers.find((entry) => entry.id === resellerId);
    if (!reseller) return Response.json({ error: "Reseller not found." }, { status: 404 });

    const members = normalizeTeamMembers(reseller.team_members, "reseller");
    return Response.json({
      ok: true,
      reseller: {
        id: reseller.id,
        username: getResellerDisplayName(reseller),
        email: reseller.email,
        discord_user_id: reseller.discord_user_id,
        application_count: Array.isArray(reseller.application_access)
          ? reseller.application_access.length
          : 0,
        team_member_limit: normalizeTeamMemberLimit(reseller.team_member_limit),
        team_invite_blocked: Boolean(reseller.team_invite_blocked),
        team_members: members.map(publicTeamMember),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const params = await context.params;
    const resellerId = String(params?.id || "").trim();
    const body = await request.json().catch(() => ({}));

    if (body.team_member_limit != null || body.team_invite_blocked != null) {
      const denied = assertPermission(auth.permissions, "resellers.team_limits");
      if (denied) return denied;
      const patch = {};
      if (body.team_member_limit != null) {
        patch.team_member_limit = normalizeTeamMemberLimit(body.team_member_limit);
      }
      if (body.team_invite_blocked != null) {
        patch.team_invite_blocked = Boolean(body.team_invite_blocked);
      }
      const updated = await updateResellerRecord(resellerId, patch, auth.adminClient);
      return Response.json({
        ok: true,
        reseller: {
          id: updated.id,
          team_member_limit: normalizeTeamMemberLimit(updated.team_member_limit),
          team_invite_blocked: Boolean(updated.team_invite_blocked),
          team_members: normalizeTeamMembers(updated.team_members, "reseller").map(publicTeamMember),
        },
      });
    }

    if (body.memberId && body.permissions) {
      const denied = assertPermission(auth.permissions, "resellers.team_edit");
      if (denied) return denied;
      const result = await updateResellerTeamMember(
        resellerId,
        String(body.memberId),
        { permissions: body.permissions, status: body.status },
        auth.adminClient
      );
      return Response.json({
        ok: true,
        member: publicTeamMember(result.member),
        team_members: normalizeTeamMembers(result.reseller.team_members, "reseller").map(publicTeamMember),
      });
    }

    return Response.json({ error: "Nothing to update." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const denied = assertPermission(auth.permissions, "resellers.team_edit");
    if (denied) return denied;

    const params = await context.params;
    const resellerId = String(params?.id || "").trim();
    const body = await request.json().catch(() => ({}));
    const memberId = String(body.memberId || body.id || "").trim();
    if (!memberId) return Response.json({ error: "memberId is required." }, { status: 400 });

    const result = await removeResellerTeamMember(resellerId, memberId, auth.adminClient);
    return Response.json({
      ok: true,
      team_members: normalizeTeamMembers(result.reseller.team_members, "reseller").map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}
