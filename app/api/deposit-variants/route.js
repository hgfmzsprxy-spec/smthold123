import { readDepositVariantsStore } from "../../../lib/reseller-deposit-variants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await readDepositVariantsStore(undefined, { skipSeed: true });
    return Response.json(
      { ok: true, variants: Array.isArray(store.variants) ? store.variants : [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    return Response.json(
      { ok: false, variants: [], error: error?.message || "Failed to load deposit packages." },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
