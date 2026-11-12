import { ConnectLoaderClient } from "../../components/ConnectLoaderClient";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Connect Discord",
  path: "/connect-loader",
});

export default async function Page({ searchParams }) {
  const resolved = await searchParams;
  const key = String(resolved?.key || resolved?.license || "").trim();
  const app = String(resolved?.app || resolved?.app_id || "").trim();
  return <ConnectLoaderClient licenseKey={key} appId={app} />;
}
