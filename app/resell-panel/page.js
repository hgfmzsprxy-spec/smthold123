import { ResellPanelPage } from "../components/ResellPanelPage";
import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Reseller Panel",
  path: "/resell-panel",
});

export default function Page() {
  return <ResellPanelPage />;
}
