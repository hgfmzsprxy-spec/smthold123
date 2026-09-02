import { LoaderPage } from "../../components/Site";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  let brandSlug = "";
  if (params && typeof params === "object") {
    for (const key of Object.keys(params)) {
      const normalized = String(key || "").trim().toLowerCase();
      if (/^[a-z0-9][a-z0-9-]{1,}$/.test(normalized)) {
        brandSlug = normalized;
        break;
      }
    }
  }
  return <LoaderPage brandSlug={brandSlug} />;
}
