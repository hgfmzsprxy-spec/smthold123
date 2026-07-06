import { ProductDetailPage } from "../../components/Site";

export const metadata = {
  title: "Product | GhostWare",
};

export default async function Page({ params }) {
  const resolvedParams = await params;

  return <ProductDetailPage slug={resolvedParams?.slug} />;
}
