import GuidePage from "../components/GuidePage";

export const metadata = {
  title: "Guide | unbanhwid.com",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const initialView = typeof params?.view === "string" ? params.view : undefined;

  return <GuidePage initialView={initialView} />;
}
