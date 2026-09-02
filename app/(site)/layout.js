import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata();

export default function SiteLayout({ children }) {
  return children;
}
