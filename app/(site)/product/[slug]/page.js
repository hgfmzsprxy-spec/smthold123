import { ProductDetailPage } from "../../../components/Site";
import { createSiteMetadata } from "../../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Product",
  path: "/product",
});

export default async function Page({ params }) {
  const resolvedParams = await params;

  return <ProductDetailPage slug={resolvedParams?.slug} />;
}
