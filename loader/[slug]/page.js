import { LoaderDetailPage } from "../../components/Site";

export const metadata = {
  title: "Loader Details | unbanhwid.com",
};

export default async function Page({ params }) {
  const resolvedParams = await params;

  return <LoaderDetailPage slug={resolvedParams?.slug} />;
}
