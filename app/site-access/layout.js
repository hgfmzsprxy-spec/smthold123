import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = {
  ...createSiteMetadata({ path: "/site-access" }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function SiteAccessLayout({ children }) {
  return children;
}
