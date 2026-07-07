export const VERIFY_COOKIE = "__uhwid_v";
export const ACCESS_MIN_MS = 1800;

export function setAccessCookie() {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VERIFY_COOKIE}=1; path=/; max-age=2592000; SameSite=Lax${secure}`;
}

export function runAccessChecks() {
  if (typeof window === "undefined") return false;

  if (navigator.webdriver) return false;
  if (!navigator.languages?.length) return false;
  if (/HeadlessChrome/i.test(navigator.userAgent)) return false;
  if (window.callPhantom || window._phantom || window.__nightmare) return false;
  if (document.documentElement.getAttribute("webdriver")) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

      if (debugInfo) {
        const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "");

        if (/swiftshader|llvmpipe/i.test(renderer)) {
          return false;
        }
      }
    }
  } catch {
    // Ignore WebGL probing errors and continue with other checks.
  }

  return true;
}
