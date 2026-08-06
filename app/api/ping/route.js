export const dynamic = "force-dynamic";

/** Lightweight latency probe for admin/reseller response monitors. */
export async function GET() {
  return Response.json(
    { ok: true, t: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
