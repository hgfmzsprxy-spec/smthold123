export const dynamic = "force-dynamic";

const VERCEL_REGION_NAMES = {
  arn1: "Stockholm",
  bom1: "Mumbai",
  cdg1: "Paris",
  cle1: "Cleveland",
  cpt1: "Cape Town",
  dub1: "Dublin",
  edh1: "Edinburgh",
  fra1: "Frankfurt",
  gru1: "São Paulo",
  hkg1: "Hong Kong",
  hnd1: "Tokyo",
  iad1: "Washington",
  icn1: "Seoul",
  kix1: "Osaka",
  lhr1: "London",
  mia1: "Miami",
  nrt1: "Tokyo",
  pbh1: "Pune",
  sfo1: "San Francisco",
  sin1: "Singapore",
  syd1: "Sydney",
  yul1: "Montreal",
  yyz1: "Toronto",
};

/** Lightweight latency probe for admin/reseller response monitors. */
export async function GET() {
  const supabaseRegion =
    process.env.SUPABASE_REGION || process.env.NEXT_PUBLIC_SUPABASE_REGION || "";
  const vercelCode = process.env.VERCEL_REGION || process.env.SERVER_REGION || "";
  const vercelRegion = vercelCode ? VERCEL_REGION_NAMES[vercelCode] || vercelCode : "";
  const region = supabaseRegion || vercelRegion || "unknown";
  return Response.json(
    { ok: true, t: Date.now(), region },
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
