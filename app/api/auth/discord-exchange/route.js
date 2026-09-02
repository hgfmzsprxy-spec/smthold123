import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDiscordProfile } from "../../../../lib/loader-redeem";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_ME_URL = "https://discord.com/api/v10/users/@me";

const CLIENT_ID = String(process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "").trim();
const CLIENT_SECRET = String(process.env.DISCORD_CLIENT_SECRET || "").trim();
const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SERVICE_ROLE = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function makeAvatarUrl(id, discriminator, avatar, size = 128) {
  if (avatar) {
    const ext = avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=${size}`;
  }
  const d = Number(discriminator || 0) || 0;
  const fallbackIdx = d % 5;
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIdx}.png`;
}

export async function POST(request) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET environment variables. " +
          "Add them to .env.local (see Discord Developer Portal → OAuth2 → Client Secret).",
      },
      { status: 500 }
    );
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json(
      { error: "Missing Supabase URL or service role key." },
      { status: 500 }
    );
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = String(payload?.code || "").trim();
  const redirectTo = String(payload?.redirectTo || "").trim();

  if (!code) {
    return NextResponse.json({ error: "Missing OAuth code." }, { status: 400 });
  }
  if (!redirectTo) {
    return NextResponse.json(
      { error: "Missing redirectTo. The OAuth return page must pass the redirect URI used to start the flow." },
      { status: 400 }
    );
  }

  // 1. Exchange the Discord authorization code for access/refresh tokens.
  //    Critical: we use the EXACT SAME redirect_uri that was used when
  //    building the authorize URL. This fixes the classic "Provided code
  //    was generated for another redirect_uri" invalid_grant Discord error
  //    and the Supabase "Unable to exchange external code" failure.
  const tokenBody = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectTo,
  });

  let tokenResp;
  try {
    tokenResp = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "unbanhwid-admin-oauth-fallback/1.0",
      },
      body: tokenBody.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to reach Discord token endpoint: ${error?.message || String(error)}` },
      { status: 502 }
    );
  }

  const tokenData = await tokenResp.json().catch(() => ({}));
  if (!tokenResp.ok || !tokenData?.access_token) {
    const errMsg =
      tokenData?.error_description ||
      tokenData?.error ||
      `Discord token HTTP ${tokenResp.status}`;
    return NextResponse.json(
      { error: `Discord token exchange failed: ${errMsg}`, raw: tokenData },
      { status: 400 }
    );
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token || null;

  // 2. Fetch the Discord user profile (id, username, global_name, avatar, email, …).
  let meResp;
  try {
    meResp = await fetch(DISCORD_ME_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "unbanhwid-admin-oauth-fallback/1.0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to reach Discord /users/@me: ${error?.message || String(error)}` },
      { status: 502 }
    );
  }
  const me = await meResp.json().catch(() => ({}));
  if (!meResp.ok || !me?.id) {
    const errMsg = me?.error_description || me?.message || `Discord /users/@me HTTP ${meResp.status}`;
    return NextResponse.json(
      { error: `Failed to load Discord user: ${errMsg}`, raw: me },
      { status: 400 }
    );
  }

  // 3. Build a normalized profile compatible with extractDiscordProfile() used by admin panel.
  const discordId = String(me.id);
  const username = String(me.username || `discord_${discordId}`);
  const globalName = me.global_name ? String(me.global_name) : username;
  const discriminator = String(me.discriminator || "0");
  const avatarUrl = makeAvatarUrl(discordId, discriminator, me.avatar, 128);
  const email = me.email ? String(me.email) : `${discordId}@discord.local`;

  // 4. Upsert the Supabase Auth user by Discord identity. This ensures:
  //    - user_metadata.sub === discordId (what the existing admin checks expect)
  //    - avatar, username, etc. are up to date after every login
  //    - email_confirm is true so the user is immediately usable
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: "Cannot initialise Supabase admin client." }, { status: 500 });
  }

  const displayName = globalName || username;
  const userMetadata = {
    sub: discordId,
    provider: "discord",
    providers: ["discord"],
    discord_user_id: discordId,
    discord_userid: discordId,
    id: discordId,
    full_name: displayName,
    name: displayName,
    preferred_username: username,
    username,
    global_name: globalName,
    discriminator,
    avatar_url: avatarUrl,
    avatar: me.avatar || null,
  };

  // Prefer binding by existing user with matching identity / id.
  let targetAuthUserId = null;
  try {
    const { data: list } = await adminClient.auth.admin.listUsers({
      perPage: 500,
      page: 1,
    });
    for (const u of list?.users || []) {
      const meta = u.user_metadata || {};
      const ids = [
        String(meta.sub || ""),
        String(meta.discord_user_id || ""),
        String(meta.discord_userid || ""),
        String(meta.id || ""),
      ];
      if (ids.includes(discordId)) {
        targetAuthUserId = u.id;
        break;
      }
    }
  } catch {
    /* ignore — fall back to createUser below */
  }

  let user = null;
  if (targetAuthUserId) {
    const { data, error } = await adminClient.auth.admin.updateUserById(targetAuthUserId, {
      email,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) {
      return NextResponse.json(
        { error: `Failed to update existing user: ${error.message}` },
        { status: 500 }
      );
    }
    user = data?.user || null;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) {
      return NextResponse.json(
        { error: `Failed to create new user: ${error.message}` },
        { status: 500 }
      );
    }
    user = data?.user || null;
  }
  if (!user) {
    return NextResponse.json({ error: "Failed to resolve Supabase auth user." }, { status: 500 });
  }

  // 5. Issue a short-lived Supabase session for this user. The browser client
  //    will pass it straight to supabase.auth.setSession(...).
  const { data: sessionData, error: sessionError } =
    await adminClient.auth.admin.createSession({ userId: user.id });
  if (sessionError || !sessionData) {
    return NextResponse.json(
      { error: `Failed to create session: ${sessionError?.message || "unknown"}` },
      { status: 500 }
    );
  }

  // 6. Build a client-visible response that mirrors what exchangeCodeForSession would return.
  const profile = extractDiscordProfile({ user_metadata: userMetadata }) || {};

  return NextResponse.json({
    ok: true,
    session: {
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_in: sessionData.expires_in,
      expires_at: Math.floor(Date.now() / 1000) + Number(sessionData.expires_in || 3600),
      token_type: "bearer",
      user,
    },
    user,
    discord: {
      id: discordId,
      username,
      global_name: globalName,
      displayName,
      avatar_url: avatarUrl,
      email: me.email || null,
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: tokenData.scope || "",
      profile,
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with { code, redirectTo } JSON body." },
    { status: 405 }
  );
}
