const MYVOUCHES_API_URL = "https://myvouch.es/api/phantom-cheats/vouches";
const MYVOUCHES_ORIGIN = "https://myvouch.es";

function resolveAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  return `${MYVOUCHES_ORIGIN}${avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`}`;
}

function normalizeReview(item, index) {
  const stars = Math.min(5, Math.max(0, Number.parseInt(item.stars, 10) || 5));
  const dateRaw = item.date || "";
  const date = dateRaw.includes(" ") ? dateRaw.split(" ")[0] : dateRaw;

  return {
    id: `${item.platform_id || "user"}-${item.vouch_number || index}-${dateRaw}`,
    username: item.platform_username || "Unknown",
    avatarUrl: resolveAvatarUrl(item.platform_avatar),
    date,
    dateTime: dateRaw,
    rating: stars,
    text: item.content || "",
  };
}

async function fetchMyVouchesPayload() {
  const response = await fetch(MYVOUCHES_API_URL, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MyVouches fetch failed with status ${response.status}`);
  }

  return response.json();
}

export function computeAverageRating(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) {
    return null;
  }

  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return (sum / reviews.length).toFixed(2);
}

export async function fetchMyVouchesStats() {
  const payload = await fetchMyVouchesPayload();
  const items = Array.isArray(payload?.data) ? payload.data : [];

  if (!items.length) {
    return { reviewCount: 0, averageRating: null };
  }

  const sum = items.reduce((total, item) => {
    const stars = Math.min(5, Math.max(0, Number.parseInt(item.stars, 10) || 5));
    return total + stars;
  }, 0);

  return {
    reviewCount: items.length,
    averageRating: (sum / items.length).toFixed(2),
  };
}

export async function fetchMyVouchesReviewCount() {
  const stats = await fetchMyVouchesStats();
  return stats.reviewCount;
}

export async function fetchMyVouchesReviews() {
  const payload = await fetchMyVouchesPayload();
  const items = Array.isArray(payload?.data) ? payload.data : [];

  return items.map((item, index) => normalizeReview(item, index));
}
