import { RulesPage } from "../../components/Site";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Terms",
  path: "/terms",
});

export default function Page() {
  return <RulesPage />;
}
