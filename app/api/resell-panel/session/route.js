import { requireReseller } from "../../../../lib/resell-panel-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    return Response.json({
      allowed: true,
      reseller: {
        ...auth.publicReseller,
        actor: auth.actor,
        permissions: auth.permissions,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
