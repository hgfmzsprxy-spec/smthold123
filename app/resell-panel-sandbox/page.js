import { ResellPanelPage } from "../components/ResellPanelPage";
import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Reseller Panel Sandbox",
  path: "/resell-panel-sandbox",
});

export default function Page() {
  return <ResellPanelPage sandbox />;
}
