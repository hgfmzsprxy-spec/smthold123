import { requireReseller } from "../../../../lib/resell-panel-auth";
import { readResellerProductsStore } from "../../../../lib/reseller-products";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const admin = getSupabaseAdmin();
    const store = await readResellerProductsStore(admin);
    return Response.json({ products: store.products });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
