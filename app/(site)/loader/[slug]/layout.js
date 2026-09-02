import { createSiteMetadata } from "../../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Loader Details",
  path: "/loader",
});

export default function LoaderDetailLayout({ children }) {
  return children;
}
