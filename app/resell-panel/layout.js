import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Reseller Panel",
  path: "/resell-panel",
});

export default function ResellPanelLayout({ children }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
