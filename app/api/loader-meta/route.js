import { queryApplicationMetaByAppId } from "../../../lib/loader-application-meta";

export const dynamic = "force-dynamic";

function hasServiceRoleKey() {
  return Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim());
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const appIdsParam = params.get("appIds")?.trim();

  if (appIdsParam) {
    const appIds = [...new Set(appIdsParam.split(",").map((value) => value.trim()).filter(Boolean))];
    if (!appIds.length) {
      return Response.json({ error: "Missing appIds." }, { status: 400 });
    }

    const entries = await Promise.all(
      appIds.map(async (appId) => [appId, await queryApplicationMetaByAppId(appId)]),
    );
    const apps = Object.fromEntries(entries);
    const anyLoaded = Object.values(apps).some(Boolean);

    if (!anyLoaded && !hasServiceRoleKey()) {
      return Response.json(
        {
          error: "Application metadata requires SUPABASE_SERVICE_ROLE_KEY (guest reads are blocked by RLS).",
          apps,
        },
        { status: 503 },
      );
    }

    return Response.json({ apps });
  }

  const appId = params.get("appId")?.trim();
  if (!appId) {
    return Response.json({ error: "Missing appId." }, { status: 400 });
  }

  const app = await queryApplicationMetaByAppId(appId);
  if (!app) {
    if (!hasServiceRoleKey()) {
      return Response.json(
        {
          error: "Application metadata requires SUPABASE_SERVICE_ROLE_KEY (guest reads are blocked by RLS).",
        },
        { status: 503 },
      );
    }

    return Response.json({ error: "Application metadata could not be loaded." }, { status: 404 });
  }

  return Response.json({ app });
}
