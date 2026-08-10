import { readResellersStore } from "../../../lib/resellers";
import { LOADER_APP_IDS } from "../../../lib/loader-redeem";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const SLUG_BY_APP_ID = Object.fromEntries(
  Object.entries(LOADER_APP_IDS).map(([slug, appId]) => [String(appId), slug]),
);

async function buildAccessibleProductSlugs(reseller) {
  const accessIds = Array.isArray(reseller?.application_access)
    ? reseller.application_access.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  if (!accessIds.length) return [];

  const slugByAppId = SLUG_BY_APP_ID;
  const directSlugs = accessIds
    .map((id) => slugByAppId[id])
    .filter(Boolean);
  if (directSlugs.length) return [...new Set(directSlugs)];

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("applications")
      .select("id, app_id");
    if (error) return [];
    const appIdByRecordId = {};
    (data || []).forEach((row) => {
      if (row?.id) appIdByRecordId[String(row.id)] = String(row.app_id || "");
    });
    const slugs = accessIds
      .map((recordId) => slugByAppId[appIdByRecordId[recordId]])
      .filter(Boolean);
    return [...new Set(slugs)];
  } catch {
    return [];
  }
}

export async function GET(request) {
  try {
    const slug = String(new URL(request.url).searchParams.get("slug") || "")
      .trim()
      .toLowerCase();
    if (!slug) return Response.json({ error: "Missing slug." }, { status: 400 });

    const store = await readResellersStore();
    const reseller = (store.resellers || []).find((entry) => entry?.loader_brand?.slug === slug);
    if (!reseller || !reseller.loader_brand) {
      return Response.json({ error: "Brand not found." }, { status: 404 });
    }

    const brand = reseller.loader_brand;
    if (brand?.blocked) {
      return Response.json(
        { error: "This loader page has been blocked.", blocked: true },
        { status: 403 },
      );
    }

    const productSlugs = await buildAccessibleProductSlugs(reseller);

    return Response.json({
      ok: true,
      brand: {
        color: brand.color || "#a32e3b",
        brand_name: brand.brand_name || "",
        logo: brand.logo || "",
        discord_link: brand.discord_link || "",
        auto_logo_size: brand.auto_logo_size !== undefined ? Boolean(brand.auto_logo_size) : true,
        remove_loader_faq: Boolean(brand.remove_loader_faq),
        remove_guides: Boolean(brand.remove_guides),
        product_slugs: productSlugs,
        slug: brand.slug,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
