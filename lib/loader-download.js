import { unzipSync, zipSync } from "fflate";

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

function isZipFileName(fileName) {
  return /\.zip$/i.test(String(fileName || "").trim());
}

// Repack a .zip blob so every .exe entry inside is renamed to <shaSuffix>.exe
// (same SHA-derived name the archive itself gets). Non-.exe entries are kept
// as-is. If multiple .exe files share a folder, extras get _2, _3, ... suffixes
// to avoid collisions. Falls back to the original blob on any failure.
async function repackZipWithRenamedExe(blob, shaSuffix) {
  const buffer = await blob.arrayBuffer();
  const entries = unzipSync(new Uint8Array(buffer));

  const usedPerDir = new Map();
  const out = {};
  let changed = false;

  for (const [path, data] of Object.entries(entries)) {
    const slash = path.lastIndexOf("/");
    const dir = slash >= 0 ? path.slice(0, slash) : "";
    const base = slash >= 0 ? path.slice(slash + 1) : path;

    if (!/\.exe$/i.test(base)) {
      out[path] = data;
      continue;
    }

    const count = usedPerDir.get(dir) || 0;
    usedPerDir.set(dir, count + 1);
    const newName = count === 0 ? `${shaSuffix}.exe` : `${shaSuffix}_${count + 1}.exe`;
    const newPath = dir ? `${dir}/${newName}` : newName;
    out[newPath] = data;
    changed = true;
  }

  if (!changed) return blob;

  const zipped = zipSync(out);
  return new Blob([zipped], { type: "application/zip" });
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
  const shaSuffix = String(buildSha256 || "").trim().slice(-14);
  const uniqueFileName = buildUniqueDownloadFileName(fileName, buildSha256);

  // For .zip archives, rename every .exe inside to the same SHA-derived name.
  let downloadBlob = blob;
  if (isZipFileName(fileName) && shaSuffix) {
    try {
      downloadBlob = await repackZipWithRenamedExe(blob, shaSuffix);
    } catch (error) {
      console.error("[loader-download] zip repack failed, using original archive:", error);
      downloadBlob = blob;
    }
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < GENERATING_MIN_MS) {
    await sleep(GENERATING_MIN_MS - elapsed);
  }

  triggerBlobDownload(downloadBlob, uniqueFileName);

  return {
    buildSha256,
    fileName: uniqueFileName,
  };
}

export function getDownloadCardFadeMs() {
  return CARD_FADE_MS;
}
