import { ReviewsPage } from "../components/Site";
import { fetchMyVouchesReviews } from "../../lib/myvouches";

export const metadata = {
  title: "Reviews | unbanhwid.com",
};

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
