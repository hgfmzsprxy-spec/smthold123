export const NAV_AUTH_CACHE_KEY = "ghostware-nav-auth";
export const NAV_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const navAuthListeners = new Set();

let cachedNavAuthSignature = null;
let cachedNavAuthSnapshot = null;

export function emitNavAuthChange() {
  invalidateNavAuthSnapshot();
  navAuthListeners.forEach((listener) => listener());
}

export function subscribeNavAuthCache(listener) {
  navAuthListeners.add(listener);

  const handleStorage = (event) => {
    if (event.key === NAV_AUTH_CACHE_KEY) {
      emitNavAuthChange();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    navAuthListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function readNavAuthCacheSignature() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(NAV_AUTH_CACHE_KEY) || "";
}

function invalidateNavAuthSnapshot() {
  cachedNavAuthSignature = null;
  cachedNavAuthSnapshot = null;
}

export function getNavAuthSnapshot() {
  const signature = readNavAuthCacheSignature();

  if (signature === cachedNavAuthSignature) {
    return cachedNavAuthSnapshot;
  }

  cachedNavAuthSignature = signature;

  if (!signature) {
    cachedNavAuthSnapshot = null;
    return null;
  }

  try {
    const parsed = JSON.parse(signature);
    if (!parsed?.id) {
      cachedNavAuthSnapshot = null;
      return null;
    }

    cachedNavAuthSnapshot = parsed;
    return cachedNavAuthSnapshot;
  } catch {
    cachedNavAuthSnapshot = null;
    return null;
  }
}

export function parseNavAuthProfile(value) {
  if (!value) return null;

  const attempts = [value];
  try {
    attempts.push(decodeURIComponent(value));
  } catch {
    // ignore decode errors
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (!parsed?.id) continue;
      return {
        avatarUrl: String(parsed.avatarUrl || "").trim(),
        username: String(parsed.username || "").trim(),
        id: parsed.id,
      };
    } catch {
      // try next candidate
    }
  }

  return null;
}

export function buildNavAuthCache(user) {
  if (!user?.id) return null;

  return {
    avatarUrl: String(user.user_metadata?.avatar_url || "").trim(),
    username: String(
      user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
    ).trim(),
    id: user.id,
  };
}

function syncNavAuthDocument(profile) {
  if (typeof document === "undefined") return;

  if (!profile) {
    document.documentElement.removeAttribute("data-nav-auth");
    document.documentElement.removeAttribute("data-nav-auth-name");
    document.documentElement.removeAttribute("data-nav-auth-avatar");
    return;
  }

  document.documentElement.setAttribute("data-nav-auth", "1");

  if (profile.username) {
    document.documentElement.setAttribute("data-nav-auth-name", profile.username);
  } else {
    document.documentElement.removeAttribute("data-nav-auth-name");
  }

  if (profile.avatarUrl) {
    document.documentElement.setAttribute("data-nav-auth-avatar", profile.avatarUrl);
  } else {
    document.documentElement.removeAttribute("data-nav-auth-avatar");
  }
}

function setNavAuthCookie(profile) {
  if (typeof document === "undefined") return;

  if (!profile) {
    document.cookie = `${NAV_AUTH_CACHE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  const value = encodeURIComponent(JSON.stringify(profile));
  document.cookie = `${NAV_AUTH_CACHE_KEY}=${value}; path=/; max-age=${NAV_AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function readNavAuthCache() {
  return getNavAuthSnapshot();
}

export function saveNavAuthCache(user) {
  if (typeof window === "undefined") return;

  const payload = buildNavAuthCache(user);

  if (!payload) {
    window.localStorage.removeItem(NAV_AUTH_CACHE_KEY);
    setNavAuthCookie(null);
    syncNavAuthDocument(null);
    emitNavAuthChange();
    return;
  }

  const nextRaw = JSON.stringify(payload);
  const currentRaw = window.localStorage.getItem(NAV_AUTH_CACHE_KEY) || "";

  if (currentRaw !== nextRaw) {
    window.localStorage.setItem(NAV_AUTH_CACHE_KEY, nextRaw);
    emitNavAuthChange();
  }

  setNavAuthCookie(payload);
  syncNavAuthDocument(payload);
}

export const NAV_AUTH_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(NAV_AUTH_CACHE_KEY)};var raw=localStorage.getItem(k);if(raw){document.documentElement.setAttribute("data-nav-auth","1");try{var p=JSON.parse(raw);if(p&&p.username)document.documentElement.setAttribute("data-nav-auth-name",p.username);if(p&&p.avatarUrl)document.documentElement.setAttribute("data-nav-auth-avatar",p.avatarUrl)}catch(e){}return}for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key&&key.indexOf("-auth-token")!==-1&&localStorage.getItem(key)){document.documentElement.setAttribute("data-nav-auth","1");break}}}catch(e){}})();`;
