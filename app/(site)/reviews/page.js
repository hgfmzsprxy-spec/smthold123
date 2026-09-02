import { ReviewsPage } from "../../components/Site";
import { fetchMyVouchesReviews } from "../../../lib/myvouches";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Reviews",
  path: "/reviews",
});

export const revalidate = 300;

export default async function Page() {
  let reviews = [];

  try {
    reviews = await fetchMyVouchesReviews();
  } catch {
    reviews = [];
  }

  return <ReviewsPage reviews={reviews} />;
}
