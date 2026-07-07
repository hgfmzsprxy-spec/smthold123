import { fetchMyVouchesReviews } from "../../../lib/myvouches";

export const revalidate = 300;

export async function GET() {
  try {
    const reviews = await fetchMyVouchesReviews();
    return Response.json({ reviews });
  } catch (error) {
    return Response.json({ reviews: [], error: error.message || "Failed to load reviews." }, { status: 502 });
  }
}
