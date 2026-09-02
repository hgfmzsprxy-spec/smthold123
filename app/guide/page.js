import GuidePage from "../components/GuidePage";
import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Guide",
  path: "/guide",
});

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const initialView = typeof params?.view === "string" ? params.view : undefined;

  return <GuidePage initialView={initialView} />;
}
