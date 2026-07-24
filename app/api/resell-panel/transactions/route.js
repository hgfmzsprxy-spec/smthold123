import { requireReseller } from "../../../../lib/resell-panel-auth";
import { listTransactions } from "../../../../lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 500);
    const transactions = await listTransactions(
      { resellerId: auth.reseller.id, limit },
      auth.admin
    );

    return Response.json({ ok: true, transactions });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
