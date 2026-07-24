import {
  findApplicationByLoaderAppId,
  readChangelogStore,
  toLoaderChangelogEntry,
} from "../../../lib/application-changelogs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

function hasServiceRoleKey() {
  return Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim());
}

export async function GET(request) {
  try {
    const appId = new URL(request.url).searchParams.get("appId")?.trim() || "";
    if (!appId) {
      return Response.json({ error: "Missing appId." }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return Response.json(
        {
          error: "Changelogs require SUPABASE_SERVICE_ROLE_KEY (guest reads are blocked by RLS).",
          entries: [],
        },
        { status: 503 }
      );
    }

    const admin = getSupabaseAdmin();
    const app = await findApplicationByLoaderAppId(appId, admin);
    if (!app?.id) {
      return Response.json({ entries: [], application: null });
    }

    const store = await readChangelogStore(app.id, admin);
    const entries = store.entries.map(toLoaderChangelogEntry).filter(Boolean);

    return Response.json({
      application: {
        id: app.id,
        app_id: app.app_id,
        name: app.name,
        version: app.version,
      },
      entries,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error), entries: [] }, { status: 500 });
  }
}
