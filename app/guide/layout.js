import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Guide",
  path: "/guide",
});

export default function GuideLayout({ children }) {
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
