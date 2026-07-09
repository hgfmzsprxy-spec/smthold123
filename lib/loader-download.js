const GENERATING_MIN_MS = 1200;
const CARD_FADE_MS = 320;

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function generateBuildSha256FromBlob(blob) {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const buffer = await blob.arrayBuffer();
  const combined = new Uint8Array(random.length + buffer.byteLength);
  combined.set(random);
  combined.set(new Uint8Array(buffer), random.length);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildUniqueDownloadFileName(originalFileName, buildSha256) {
  const shaSuffix = String(buildSha256 || "")
    .trim()
    .slice(-14);
  if (!shaSuffix) return String(originalFileName || "download").trim() || "download";

  const name = String(originalFileName || "download").trim() || "download";
  const lastDot = name.lastIndexOf(".");
  const extension = lastDot > 0 ? name.slice(lastDot) : "";

  return `${shaSuffix}${extension}`;
}

export function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function downloadUniqueBuildPackage({ downloadUrl, fileName }) {
  if (!downloadUrl) {
    throw new Error("No uploaded file is available right now.");
  }

  const startedAt = Date.now();
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("Could not prepare your unique build. Try again.");
  }

  const blob = await response.blob();
  const buildSha256 = await generateBuildSha256FromBlob(blob);
  const uniqueFileName = buildUniqueDownloadFileName(fileName, buildSha256);
  const elapsed = Date.now() - startedAt;

  if (elapsed < GENERATING_MIN_MS) {
    await sleep(GENERATING_MIN_MS - elapsed);
  }

  triggerBlobDownload(blob, uniqueFileName);

  return {
    buildSha256,
    fileName: uniqueFileName,
  };
}

export function getDownloadCardFadeMs() {
  return CARD_FADE_MS;
}
