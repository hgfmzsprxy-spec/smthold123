import { LoginPage } from "../../components/Site";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Login",
  path: "/login",
});

export default function Page() {
  return <LoginPage />;
}
