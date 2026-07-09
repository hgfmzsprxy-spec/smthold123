import { HomePage } from "../components/Site";
import { fetchMyVouchesStats } from "../../lib/myvouches";

export const revalidate = 300;

export default async function Page() {
  let reviewCount = 0;
  let averageRating = null;

  try {
    const stats = await fetchMyVouchesStats();
    reviewCount = stats.reviewCount;
    averageRating = stats.averageRating;
  } catch {
    reviewCount = 0;
    averageRating = null;
  }

  return <HomePage reviewCount={reviewCount} averageRating={averageRating} />;
}
