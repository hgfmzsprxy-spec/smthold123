import LoaderLayoutClient from "./LoaderLayoutClient";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Loader",
  path: "/loader",
});

export default function LoaderLayout({ children }) {
  return <LoaderLayoutClient>{children}</LoaderLayoutClient>;
}
