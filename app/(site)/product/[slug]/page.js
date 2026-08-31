import { ProductDetailPage } from "../../../components/Site";

export const metadata = {
  title: "Product | phantom-cheat.com",
};

export default async function Page({ params }) {
  const resolvedParams = await params;

  return <ProductDetailPage slug={resolvedParams?.slug} />;
}
