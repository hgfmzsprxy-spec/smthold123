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
} from "../../../../lib/panel-protection-logs";
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
// Stay under Cloudflare/Vercel gateway limits — return partial data instead of 504.
export const maxDuration = 30;

const QUERY_DEADLINE_MS = 10_000;
const LICENSE_BOOTSTRAP_LIMIT = 2_500;
const TRANSACTION_BOOTSTRAP_LIMIT = 200;
const CHANGELOG_APPS_LIMIT = 12;

function withDeadline(promise, ms, fallback) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function safe(promise, fallback, label = "bootstrap") {
  try {
    return await promise;
  } catch (error) {
    console.error(`[admin/bootstrap] ${label}:`, error?.message || error);
    return fallback;
  }
}

async function buildChangelogSummaries(apps, admin) {
  const list = (Array.isArray(apps) ? apps : []).slice(0, CHANGELOG_APPS_LIMIT);
  if (!list.length) return {};

  const pairs = await Promise.all(
    list.map(async (app) => {
      const id = String(app?.id || "").trim();
      if (!id) return null;
      try {
        const store = await withDeadline(
          readChangelogStore(id, admin),
          2_500,
          { entries: [] }
        );
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
    .order("created_at", { ascending: false })
    .limit(LICENSE_BOOTSTRAP_LIMIT);
  if (!slim.error) return Array.isArray(slim.data) ? slim.data : [];

  if (!/column|schema cache/i.test(slim.error.message || "")) throw slim.error;

  const full = await admin
    .from("licenses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LICENSE_BOOTSTRAP_LIMIT);
  if (full.error) throw full.error;
  return Array.isArray(full.data) ? full.data : [];
}

export async function GET(request) {
  const warnings = [];
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    if (auth.degradedAuth) warnings.push("auth: degraded (Supabase Auth slow/unreachable)");

    const admin = getSupabaseAdmin();

    const emptyStore = { resellers: [] };
    async function bounded(label, promise, fallback) {
      const marker = { __timeout: true, fallback };
      const result = await withDeadline(safe(promise, fallback, label), QUERY_DEADLINE_MS, marker);
      if (result && result.__timeout) {
        warnings.push(`${label}: timeout`);
        return fallback;
      }
      return result ?? fallback;
    }

    const [
      applications,
      licenses,
      resellerStore,
      protectionStore,
      notificationStore,
      productsStore,
      depositStore,
      transactions,
    ] = await Promise.all([
      bounded("applications", fetchApplications(admin), []),
      bounded("licenses", fetchLicenses(admin), []),
      bounded("resellers", readResellersStore(admin), emptyStore),
      bounded("protections", readProtectionStore(admin), {
        flags: {},
        updated_at: "",
        updated_by: "",
      }),
      bounded("notifications", readNotificationStore(admin), { entries: [] }),
      bounded("store", readResellerProductsStore(admin), { products: [] }),
      bounded("deposits", readDepositVariantsStore(admin, { skipSeed: true }), { variants: [] }),
      bounded(
        "transactions",
        listTransactions({ limit: TRANSACTION_BOOTSTRAP_LIMIT }, admin),
        []
      ),
    ]);

    const resellers = Array.isArray(resellerStore?.resellers) ? resellerStore.resellers : [];

    // Non-critical — never block bootstrap on per-app changelog fan-out.
    const changelogSummaries = await withDeadline(
      safe(buildChangelogSummaries(applications, admin), {}, "changelogs"),
      4_000,
      {}
    );

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
      storeProducts: Array.isArray(productsStore?.products) ? productsStore.products : [],
      depositVariants: Array.isArray(depositStore?.variants) ? depositStore.variants : [],
      transactions: Array.isArray(transactions) ? transactions : [],
      // Protection logs load on-demand from /api/admin/protection-logs — keep bootstrap light.
      protectionLogs: [],
      protectionLogIgnoredUserIds: [],
      protectionLogSources,
      protectionLogColumns: PROTECTION_LOG_COLUMNS,
      protectionLogDefaultColumns: defaultProtectionLogColumns(),
      localProtectionSourceId: LOCAL_PROTECTION_SOURCE_ID,
      changelogSummaries,
      screenshotsSigned: false,
      warnings: warnings.filter(Boolean),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
