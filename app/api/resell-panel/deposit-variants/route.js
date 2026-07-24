import { requireReseller } from "../../../../lib/resell-panel-auth";
import { readDepositVariantsStore } from "../../../../lib/reseller-deposit-variants";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireReseller(request);
    if (auth.error) return auth.error;

    const store = await readDepositVariantsStore(auth.admin);
    return Response.json({ variants: store.variants });
  } catch (error) {
    const status = error?.code === "TABLE_MISSING" ? 503 : 500;
    return Response.json({ error: error?.message || String(error) }, { status });
  }
}
