import AdminPage from "../components/AdminPage";
import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Admin",
  path: "/admin",
});

export default function Page() {
  return <AdminPage />;
}
