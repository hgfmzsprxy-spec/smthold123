export const dynamic = "force-dynamic";

function normalizeMediaUrl(rawUrl) {
  if (!rawUrl) return null;
  const value = String(rawUrl);
  return value.startsWith("//") ? `https:${value}` : value;
}

function pickHighestQualityFile(files) {
  if (!files || typeof files !== "object") return null;

  const candidates = Object.entries(files)
    .filter(([key, file]) => {
      if (key === "original") return false;
      if (!file || typeof file !== "object") return false;
      if (!file.url) return false;
      if (file.status != null && Number(file.status) !== 2) return false;
      return true;
    })
    .map(([key, file]) => ({
      key,
      url: normalizeMediaUrl(file.url),
      height: Number(file.height) || 0,
      width: Number(file.width) || 0,
      bitrate: Number(file.bitrate) || 0,
      size: Number(file.size) || 0,
    }))
    .filter((file) => Boolean(file.url));

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (b.height !== a.height) return b.height - a.height;
    if (b.width !== a.width) return b.width - a.width;
    if (b.bitrate !== a.bitrate) return b.bitrate - a.bitrate;
    return b.size - a.size;
  });

  return candidates[0];
}

export async function GET(_request, context) {
  const resolvedParams = await context.params;
  const id = String(resolvedParams?.id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!id) {
    return Response.json({ error: "Missing Streamable id." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.streamable.com/videos/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ error: "Streamable video could not be loaded." }, { status: 502 });
    }

    const data = await response.json();
    const best = pickHighestQualityFile(data?.files);

    return Response.json({
      status: data?.status ?? null,
      percent: data?.percent ?? null,
      url: best?.url || null,
      quality: best
        ? {
            key: best.key,
            width: best.width,
            height: best.height,
            bitrate: best.bitrate,
          }
        : null,
      title: data?.title || null,
    });
  } catch {
    return Response.json({ error: "Streamable video could not be loaded." }, { status: 502 });
  }
}
