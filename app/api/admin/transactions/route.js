import { requireAdmin } from "../../../../lib/admin-auth";
import { listTransactions } from "../../../../lib/transactions";
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
    const transactions = await listTransactions(
      { resellerId: resellerId || null, limit },
      admin
    );

    return Response.json({ ok: true, transactions });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
