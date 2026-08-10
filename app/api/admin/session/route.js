import { requireAdmin } from "../../../../lib/admin-auth";
import { resolveAdminNotificationAuthor } from "../../../../lib/admin-discord-avatar";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const author = await resolveAdminNotificationAuthor(auth, getSupabaseAdmin());

    return Response.json({
      ok: true,
      allowed: true,
      admin: {
        email: auth.user.email || null,
        discord_user_id: author.discordUserId || auth.discord.discordUserId || null,
        discord_username: author.username || auth.discord.username || null,
        discord_avatar_url: author.avatarUrl || null,
        is_main_admin: Boolean(auth.isMainAdmin),
        actor: auth.actor || "admin",
        permissions: auth.permissions || null,
        team_member: auth.teamMember
          ? {
              id: auth.teamMember.id,
              discord_user_id: auth.teamMember.discord_user_id,
            }
          : null,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
