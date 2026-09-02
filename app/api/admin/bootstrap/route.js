import { NextResponse } from "next/server";
import { isMainAdminDiscordId, requireAdmin } from "../../../../lib/admin-auth";
import { readChangelogStore } from "../../../../lib/application-changelogs";
import {
  ADMIN_APPLICATION_SELECT,
  ADMIN_LICENSE_SELECT,
  stripApplicationBlobs,
} from "../../../../lib/panel-bootstrap-selects";
import {
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
  defaultProtectionLogColumns,
  readProtectionLogStore,
} from "../../../../lib/panel-protection-logs";
import { readAdminNotificationWebhookSettings } from "../../../../lib/admin-notification-webhook";
import { readNotificationStore } from "../../../../lib/panel-notifications";
import { PROTECTION_OPTIONS, readProtectionStore } from "../../../../lib/panel-protections";
import { readDepositVariantsStore } from "../../../../lib/reseller-deposit-variants";
import { readResellerProductsStore } from "../../../../lib/reseller-products";
import {
  computeResellerMetrics,
  getResellerDisplayName,
  readResellersStore,
} from "../../../../lib/resellers";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";
import { listTransactions } from "../../../../lib/transactions";

export const dynamic = "force-dynamic";

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    console.error("[admin/bootstrap]", error?.message || error);
    return fallback;
  }
}

async function buildChangelogSummaries(apps, admin) {
  const list = Array.isArray(apps) ? apps : [];
  if (!list.length) return {};

  const pairs = await Promise.all(
    list.map(async (app) => {
      const id = String(app?.id || "").trim();
      if (!id) return null;
      try {
        const store = await readChangelogStore(id, admin);
        const entries = Array.isArray(store?.entries) ? store.entries : [];
        return [
          id,
          {
            total: entries.length,
            latestTitle: entries[0]?.title || "-",
          },
        ];
      } catch {
        return [id, { total: 0, latestTitle: "-" }];
      }
    })
  );

  return Object.fromEntries(pairs.filter(Boolean));
}

async function fetchApplications(admin) {
  const slim = await admin
    .from("applications")
    .select(ADMIN_APPLICATION_SELECT)
    .order("created_at", { ascending: false });
  if (!slim.error) return Array.isArray(slim.data) ? slim.data : [];

  if (!/column|schema cache/i.test(slim.error.message || "")) throw slim.error;

  const full = await admin.from("applications").select("*").order("created_at", { ascending: false });
  if (full.error) throw full.error;
  return stripApplicationBlobs(full.data);
}

async function fetchLicenses(admin) {
  const slim = await admin
    .from("licenses")
    .select(ADMIN_LICENSE_SELECT)
    .order("created_at", { ascending: false });
  if (!slim.error) return Array.isArray(slim.data) ? slim.data : [];

  if (!/column|schema cache/i.test(slim.error.message || "")) throw slim.error;

  const full = await admin.from("licenses").select("*").order("created_at", { ascending: false });
  if (full.error) throw full.error;
  return Array.isArray(full.data) ? full.data : [];
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();

    const [
      applications,
      licenses,
      resellerStore,
      protectionStore,
      notificationStore,
      productsStore,
      depositStore,
      transactions,
      notificationWebhook,
    ] = await Promise.all([
      fetchApplications(admin),
      fetchLicenses(admin),
      safe(readResellersStore(admin), { resellers: [] }),
      safe(readProtectionStore(admin), { flags: {}, updated_at: "", updated_by: "" }),
      safe(readNotificationStore(admin), { entries: [] }),
      safe(readResellerProductsStore(admin), { products: [] }),
      safe(readDepositVariantsStore(admin, { skipSeed: true }), { variants: [] }),
      safe(listTransactions({ limit: 500 }, admin), []),
      safe(readAdminNotificationWebhookSettings(admin), {
        discord_notification_webhook: null,
        discord_notification_branding: null,
        updated_at: null,
      }),
    ]);

    const resellers = Array.isArray(resellerStore?.resellers) ? resellerStore.resellers : [];

    const changelogSummaries = await safe(buildChangelogSummaries(applications, admin), {});

    const protectionLogSources = [
      { id: LOCAL_PROTECTION_SOURCE_ID, label: LOCAL_PROTECTION_SOURCE_LABEL, type: "local" },
      ...resellers.map((reseller) => ({
        id: reseller.id,
        label: getResellerDisplayName(reseller) || reseller.email || reseller.id,
        type: "reseller",
        email: reseller.email || "",
      })),
    ];

    return NextResponse.json({
      ok: true,
      applications,
      licenses,
      resellers,
      resellerMetrics: computeResellerMetrics(resellers),
      protections: {
        options: PROTECTION_OPTIONS,
        flags: protectionStore?.flags || {},
        updated_at: protectionStore?.updated_at || "",
        updated_by: protectionStore?.updated_by || "",
        can_edit: isMainAdminDiscordId(auth.discord?.discordUserId),
      },
      notifications: Array.isArray(notificationStore?.entries) ? notificationStore.entries : [],
      discord_notification_webhook: notificationWebhook?.discord_notification_webhook || null,
      discord_notification_branding: notificationWebhook?.discord_notification_branding || null,
      discord_notification_webhook_updated_at: notificationWebhook?.updated_at || null,
      storeProducts: Array.isArray(productsStore?.products) ? productsStore.products : [],
      depositVariants: Array.isArray(depositStore?.variants) ? depositStore.variants : [],
      transactions: Array.isArray(transactions) ? transactions : [],
      protectionLogs: [],
      protectionLogIgnoredUserIds: [],
      protectionLogSources,
      protectionLogColumns: PROTECTION_LOG_COLUMNS,
      protectionLogDefaultColumns: defaultProtectionLogColumns(),
      localProtectionSourceId: LOCAL_PROTECTION_SOURCE_ID,
      changelogSummaries,
      screenshotsSigned: false,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
