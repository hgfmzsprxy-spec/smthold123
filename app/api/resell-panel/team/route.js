import { assertPermission } from "../../../../lib/panel-permissions";
import {
  addResellerTeamMember,
  normalizeTeamMemberLimit,
  publicTeamMember,
  removeResellerTeamMember,
  updateResellerTeamMember,
} from "../../../../lib/panel-team";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import { normalizeTeamMembers } from "../../../../lib/panel-team-normalize";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor === "staff") {
      return Response.json(
        { error: "Team is only available to the reseller owner.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const members = normalizeTeamMembers(auth.reseller.team_members, "reseller").map(publicTeamMember);
    return Response.json({
      ok: true,
      team_member_limit: normalizeTeamMemberLimit(auth.reseller.team_member_limit),
      team_invite_blocked: Boolean(auth.reseller.team_invite_blocked),
      members,
      actor: auth.actor,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor !== "owner") {
      return Response.json(
        { error: "Only the reseller owner can add team members.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await addResellerTeamMember(
      auth.reseller.id,
      {
        discord_user_id: body.discord_user_id || body.discordUserId,
        discord_username: body.discord_username,
        permissions: body.permissions,
        created_by: auth.user.id,
      },
      auth.admin
    );

    return Response.json({
      ok: true,
      member: publicTeamMember(result.member),
      members: normalizeTeamMembers(result.reseller.team_members, "reseller").map(publicTeamMember),
      team_member_limit: normalizeTeamMemberLimit(result.reseller.team_member_limit),
      team_invite_blocked: Boolean(result.reseller.team_invite_blocked),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor !== "owner") {
      return Response.json(
        { error: "Only the reseller owner can edit team members.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const memberId = String(body.memberId || body.id || "").trim();
    if (!memberId) return Response.json({ error: "memberId is required." }, { status: 400 });

    const result = await updateResellerTeamMember(
      auth.reseller.id,
      memberId,
      {
        permissions: body.permissions,
        status: body.status,
        discord_username: body.discord_username,
      },
      auth.admin
    );

    return Response.json({
      ok: true,
      member: publicTeamMember(result.member),
      members: normalizeTeamMembers(result.reseller.team_members, "reseller").map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    if (auth.actor !== "owner") {
      return Response.json(
        { error: "Only the reseller owner can remove team members.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const memberId = String(body.memberId || body.id || searchParams.get("id") || "").trim();
    if (!memberId) return Response.json({ error: "memberId is required." }, { status: 400 });

    const result = await removeResellerTeamMember(auth.reseller.id, memberId, auth.admin);
    return Response.json({
      ok: true,
      members: normalizeTeamMembers(result.reseller.team_members, "reseller").map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}
