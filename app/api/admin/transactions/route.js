import { requireAdmin } from "../../../../lib/admin-auth";
import { readResellersStore } from "../../../../lib/resellers";
import {
  enrichTransactionsWithStaffProfiles,
  listTransactions,
} from "../../../../lib/transactions";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 500);
    const resellerId = String(searchParams.get("resellerId") || searchParams.get("reseller_id") || "").trim();
    const admin = getSupabaseAdmin();
    const [transactions, resellersStore] = await Promise.all([
      listTransactions({ resellerId: resellerId || null, limit }, admin),
      readResellersStore(admin),
    ]);

    return Response.json({
      ok: true,
      transactions: enrichTransactionsWithStaffProfiles(
        transactions,
        Array.isArray(resellersStore?.resellers) ? resellersStore.resellers : []
      ),
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
