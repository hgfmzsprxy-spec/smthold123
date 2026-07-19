export const LOADER_VERIFY_COOKIE = "__uhwid_loader_v";
export const LOADER_ACCESS_MIN_MS = 2200;

export function hasLoaderAccessCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${LOADER_VERIFY_COOKIE}=1`));
}

export function setLoaderAccessCookie() {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOADER_VERIFY_COOKIE}=1; path=/; max-age=86400; SameSite=Lax${secure}`;
}
