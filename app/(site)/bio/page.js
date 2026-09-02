import BioPage from "../../components/BioPage";
import { computeAverageRating, fetchMyVouchesReviews } from "../../../lib/myvouches";
import { createSiteMetadata } from "../../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Bio",
  path: "/bio",
});

export const revalidate = 300;

export default async function Page() {
  let latestReviews = [];
  let reviewCount = 0;
  let averageRating = null;

  try {
    latestReviews = await fetchMyVouchesReviews();
    reviewCount = latestReviews.length;
    averageRating = computeAverageRating(latestReviews);
  } catch {
    latestReviews = [];
  }

  return (
    <BioPage
      reviewCount={reviewCount}
      averageRating={averageRating}
      latestReviews={latestReviews}
    />
  );
}
