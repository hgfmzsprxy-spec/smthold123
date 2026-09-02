import { extractDiscordProfile } from "./loader-redeem";

function isDiscordCdnAvatar(url) {
  return /^https:\/\/cdn\.discordapp\.com\/(avatars|embed\/avatars)\//i.test(String(url || "").trim());
}

/** Resolve a durable Discord avatar URL for the signed-in admin/staff actor. */
export async function resolveAdminNotificationAuthor(auth, adminClient, clientAvatar = "") {
  const clientUrl = String(clientAvatar || "").trim();
  let username = String(
    auth?.teamMember?.discord_username || auth?.discord?.username || auth?.user?.email || ""
  ).trim();
  let discordUserId = String(
    auth?.teamMember?.discord_user_id || auth?.discord?.discordUserId || ""
  ).trim();
  let avatarUrl = String(
    auth?.teamMember?.discord_avatar_url || auth?.discord?.avatarUrl || ""
  ).trim();

  if (isDiscordCdnAvatar(clientUrl)) {
    avatarUrl = clientUrl;
  }

  // Auth getUser() / JWT often omit Discord avatar — load full auth user via service role.
  if ((!avatarUrl || !discordUserId) && auth?.user?.id && adminClient?.auth?.admin?.getUserById) {
    try {
      const { data, error } = await adminClient.auth.admin.getUserById(auth.user.id);
      if (!error && data?.user) {
        const profile = extractDiscordProfile(data.user);
        if (!discordUserId && profile.discordUserId) discordUserId = profile.discordUserId;
        if (!username || username === auth?.user?.email) {
          username = String(profile.username || username).trim();
        }
        if (!avatarUrl && profile.avatarUrl) avatarUrl = String(profile.avatarUrl).trim();
      }
    } catch {
      // ignore lookup failures
    }
  }

  if (!avatarUrl && discordUserId) {
    try {
      const index = Number((BigInt(discordUserId) >> 22n) % 6n);
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    } catch {
      avatarUrl = "";
    }
  }

  return {
    username,
    discordUserId: discordUserId || null,
    avatarUrl: avatarUrl || null,
  };
}
