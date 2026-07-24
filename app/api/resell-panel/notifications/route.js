import { requireReseller } from "../../../../lib/resell-panel-auth";
import { readNotificationStore } from "../../../../lib/panel-notifications";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const store = await readNotificationStore(auth.admin);
    return Response.json({ ok: true, entries: store.entries });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
