import { CartPage } from "../../components/Site";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Cart",
  path: "/cart",
});

export default function Page() {
  return <CartPage />;
}
