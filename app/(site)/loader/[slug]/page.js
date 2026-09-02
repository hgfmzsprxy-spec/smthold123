import { LoaderDetailPage } from "../../../components/Site";

export default async function Page({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const productSlug = Array.isArray(resolvedParams?.slug)
    ? resolvedParams.slug[0]
    : resolvedParams?.slug;

  let brandSlug = "";
  if (resolvedSearch && typeof resolvedSearch === "object") {
    for (const key of Object.keys(resolvedSearch)) {
      const normalized = String(key || "").trim().toLowerCase();
      if (/^[a-z0-9][a-z0-9-]{1,}$/.test(normalized)) {
        brandSlug = normalized;
        break;
      }
    }
  }

  return <LoaderDetailPage slug={productSlug} brandSlug={brandSlug} />;
}
