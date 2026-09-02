import {
  buildNotificationDiscordPayload,
  isValidDiscordWebhookUrl,
  normalizeDiscordNotificationBranding,
  normalizeDiscordWebhookUrl,
  postDiscordWebhook,
} from "../../../../lib/discord";
import { assertPermission } from "../../../../lib/panel-permissions";
import { requireReseller } from "../../../../lib/resell-panel-auth";
import { updateResellerRecord } from "../../../../lib/resellers";

export const dynamic = "force-dynamic";

const TEST_PREVIEW_NOTICE = "This is only a preview.";

async function requireWebhookEditor(request) {
  const auth = await requireReseller(request);
  if (auth.error) return { error: auth.error };

  const denied = assertPermission(auth.permissions, "notifications.edit_discord");
  if (denied) return { error: denied };

  return { auth };
}

export async function POST(request) {
  try {
    const gate = await requireWebhookEditor(request);
    if (gate.error) return gate.error;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const webhook = normalizeDiscordWebhookUrl(
      body?.webhook ?? body?.discord_notification_webhook ?? body?.url
    );
    if (!isValidDiscordWebhookUrl(webhook)) {
      return Response.json(
        {
          error:
            "Enter a valid Discord webhook URL (https://discord.com/api/webhooks/…) before sending a test.",
        },
        { status: 400 }
      );
    }

    const branding = normalizeDiscordNotificationBranding(
      body?.branding ?? body?.discord_notification_branding ?? body
    );
    const entry = body?.entry && typeof body.entry === "object" ? body.entry : {};
    const payload = buildNotificationDiscordPayload(entry, branding);
    payload.content = TEST_PREVIEW_NOTICE;

    await postDiscordWebhook(webhook, payload);

    return Response.json({ ok: true, preview: true });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const gate = await requireWebhookEditor(request);
    if (gate.error) return gate.error;
    const { auth } = gate;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const webhook = normalizeDiscordWebhookUrl(
      body?.webhook ?? body?.discord_notification_webhook ?? body?.url
    );

    if (webhook && !isValidDiscordWebhookUrl(webhook)) {
      return Response.json(
        {
          error:
            "Enter a valid Discord webhook URL (https://discord.com/api/webhooks/…).",
        },
        { status: 400 }
      );
    }

    const branding = normalizeDiscordNotificationBranding(
      body?.branding ?? body?.discord_notification_branding ?? body
    );

    if (branding.avatar_url === null && String(body?.avatar_url || body?.avatarUrl || "").trim()) {
      return Response.json(
        { error: "Profile avatar must be a valid http(s) URL." },
        { status: 400 }
      );
    }

    const updated = await updateResellerRecord(
      auth.reseller.id,
      {
        discord_notification_webhook: webhook || null,
        discord_notification_branding: branding,
      },
      auth.admin
    );

    return Response.json({
      ok: true,
      discord_notification_webhook: updated.discord_notification_webhook || null,
      discord_notification_branding: updated.discord_notification_branding || branding,
      reseller: {
        id: updated.id,
        discord_notification_webhook: updated.discord_notification_webhook || null,
        discord_notification_branding: updated.discord_notification_branding || branding,
        updated_at: updated.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
