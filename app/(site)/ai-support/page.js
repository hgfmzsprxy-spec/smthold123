import AiSupportPageClient from "../../components/AiSupportPageClient";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "AI Support",
  path: "/ai-support",
});

export default function Page() {
  return <AiSupportPageClient />;
}
