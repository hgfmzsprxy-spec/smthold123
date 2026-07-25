import { isMainAdminDiscordId, requireAdmin } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    return Response.json({
      ok: true,
      allowed: true,
      admin: {
        email: auth.user.email || null,
        discord_user_id: auth.discord.discordUserId || null,
        discord_username: auth.discord.username || null,
        discord_avatar_url: auth.discord.avatarUrl || null,
        is_main_admin: isMainAdminDiscordId(auth.discord.discordUserId),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
