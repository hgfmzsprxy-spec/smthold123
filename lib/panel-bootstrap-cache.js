const DEFAULT_TTL_MS = 10 * 60 * 1000;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readBootstrapCache(key) {
  if (typeof window === "undefined" || !key) return null;
  try {
    const parsed = safeParse(window.sessionStorage.getItem(key));
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return {
      data: parsed.data,
      savedAt: Number(parsed.savedAt) || 0,
      stale: Date.now() - (Number(parsed.savedAt) || 0) > (Number(parsed.ttlMs) || DEFAULT_TTL_MS),
    };
  } catch {
    return null;
  }
}

export function writeBootstrapCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  if (typeof window === "undefined" || !key || data == null) return false;
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        ttlMs,
        data,
      })
    );
    return true;
  } catch {
    // Quota exceeded — drop heaviest optional blobs and retry once.
    try {
      const slim = slimBootstrapForCache(data);
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          savedAt: Date.now(),
          ttlMs,
          data: slim,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}

export function clearBootstrapCache(key) {
  if (typeof window === "undefined" || !key) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function slimBootstrapForCache(data) {
  if (!data || typeof data !== "object") return data;
  const next = { ...data };

  if (Array.isArray(next.applications)) {
    next.applications = next.applications.map((app) => {
      if (!app || typeof app !== "object") return app;
      const copy = { ...app };
      delete copy.download_file_data_base64;
      delete copy.image_data_base64;
      return copy;
    });
  }

  if (Array.isArray(next.protectionLogs)) {
    next.protectionLogs = next.protectionLogs.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      return {
        ...entry,
        screenshots: Array.isArray(entry.screenshots)
          ? entry.screenshots.map((shot) => ({
              path: shot?.path || "",
              monitor: shot?.monitor ?? null,
              width: shot?.width ?? null,
              height: shot?.height ?? null,
              mime: shot?.mime || "image/jpeg",
              data: "",
              url: String(shot?.url || "").startsWith("data:") ? "" : String(shot?.url || ""),
            }))
          : [],
      };
    });
  }

  return next;
}

export function adminBootstrapCacheKey(userId = "") {
  const id = String(userId || "anon").trim() || "anon";
  return `unbanhwid.admin-panel.bootstrap.${id}`;
}

export function resellBootstrapCacheKey(userId = "") {
  const id = String(userId || "anon").trim() || "anon";
  return `unbanhwid.resell-panel.bootstrap.${id}`;
}
