import {
  normalizeDiscordNotificationBranding,
  normalizeDiscordWebhookUrl,
} from "./discord";
import { RESELLERS_BUCKET } from "./resellers";
import { getSupabaseAdmin } from "./supabase-admin";
import { readStorageJson, writeStorageJson } from "./storage-json";

export const ADMIN_NOTIFICATION_WEBHOOK_OBJECT_PATH = "admin-notification-webhook.json";

export function normalizeAdminNotificationWebhookSettings(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    discord_notification_webhook:
      normalizeDiscordWebhookUrl(
        source.discord_notification_webhook ?? source.discordNotificationWebhook ?? source.webhook ?? ""
      ) || null,
    discord_notification_branding: normalizeDiscordNotificationBranding(
      source.discord_notification_branding ?? source.discordNotificationBranding ?? source.branding
    ),
    updated_at: String(source.updated_at || source.updatedAt || "").trim() || null,
  };
}

export async function readAdminNotificationWebhookSettings(admin = getSupabaseAdmin()) {
  const parsed = await readStorageJson(RESELLERS_BUCKET, ADMIN_NOTIFICATION_WEBHOOK_OBJECT_PATH, admin);
  return normalizeAdminNotificationWebhookSettings(parsed);
}

export async function writeAdminNotificationWebhookSettings(patch, admin = getSupabaseAdmin()) {
  const current = await readAdminNotificationWebhookSettings(admin);
  const next = normalizeAdminNotificationWebhookSettings({
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  });
  await writeStorageJson(RESELLERS_BUCKET, ADMIN_NOTIFICATION_WEBHOOK_OBJECT_PATH, next, admin);
  return next;
}
