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
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      <ConnectLoaderClient licenseKey={key} appId={app} />
    </>
  );
}
