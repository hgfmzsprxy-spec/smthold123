import { requireAdmin } from "../../../../../lib/admin-auth";
import { assertPermission } from "../../../../../lib/panel-permissions";
import {
  addAdminTeamMember,
  publicTeamMember,
  readAdminTeamStore,
  removeAdminTeamMember,
  updateAdminTeamMember,
} from "../../../../../lib/panel-team";

export const dynamic = "force-dynamic";

function requireTeamManage(auth) {
  if (auth.actor === "admin" && auth.isMainAdmin) return null;
  // Full allowlist admins can manage; staff need view.team + implicit manage via actor admin
  if (auth.actor === "admin") return null;
  return assertPermission(auth.permissions, "view.team");
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const denied = requireTeamManage(auth);
    if (denied) return denied;

    const store = await readAdminTeamStore(auth.adminClient);
    return Response.json({
      ok: true,
      members: store.members.map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    if (auth.actor === "staff") {
      return Response.json(
        { error: "Only full administrators can add admin staff.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await addAdminTeamMember(
      {
        discord_user_id: body.discord_user_id || body.discordUserId,
        discord_username: body.discord_username,
        permissions: body.permissions,
        created_by: auth.user.id,
      },
      auth.adminClient
    );

    return Response.json({
      ok: true,
      member: publicTeamMember(result.member),
      members: result.members.map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    if (auth.actor === "staff") {
      return Response.json(
        { error: "Only full administrators can edit admin staff.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const memberId = String(body.memberId || body.id || "").trim();
    if (!memberId) return Response.json({ error: "memberId is required." }, { status: 400 });

    const result = await updateAdminTeamMember(
      memberId,
      {
        permissions: body.permissions,
        status: body.status,
        discord_username: body.discord_username,
      },
      auth.adminClient
    );

    return Response.json({
      ok: true,
      member: publicTeamMember(result.member),
      members: result.members.map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    if (auth.actor === "staff") {
      return Response.json(
        { error: "Only full administrators can remove admin staff.", code: "ERR_PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const memberId = String(body.memberId || body.id || searchParams.get("id") || "").trim();
    if (!memberId) return Response.json({ error: "memberId is required." }, { status: 400 });

    const result = await removeAdminTeamMember(memberId, auth.adminClient);
    return Response.json({
      ok: true,
      members: result.members.map(publicTeamMember),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
}
