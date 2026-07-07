import { queryApplicationMetaByAppId } from "../../../lib/loader-application-meta";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const appId = new URL(request.url).searchParams.get("appId")?.trim();
  if (!appId) {
    return Response.json({ error: "Missing appId." }, { status: 400 });
  }

  const app = await queryApplicationMetaByAppId(appId);
  if (!app) {
    return Response.json({ error: "Application metadata could not be loaded." }, { status: 404 });
  }

  return Response.json({ app });
}
