import { ResellProgramPage } from "../../components/ResellProgramPage";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Reseller Program",
  path: "/resell-program",
});

export default function Page() {
  return <ResellProgramPage />;
}
