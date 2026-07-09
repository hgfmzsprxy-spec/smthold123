export function arrayBufferToBase64(buffer, onProgress) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const slice = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode.apply(null, slice);
    if (onProgress) onProgress(bytes.length ? (index + slice.length) / bytes.length : 1);
  }

  return btoa(binary);
}

export function base64ToUint8Array(base64) {
  const normalized = String(base64 || "").trim();
  if (!normalized) {
    throw new Error("Missing file data.");
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function triggerBase64FileDownload({ base64, fileName, mimeType = "application/octet-stream" }) {
  const bytes = base64ToUint8Array(base64);
  const blob = new Blob([bytes], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = String(fileName || "download").trim() || "download";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
