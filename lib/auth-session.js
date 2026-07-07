const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getAuthStorageKey() {
  if (!supabaseUrl) return null;

  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return null;
  }
}

function parseStoredUser(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const user = parsed?.user ?? parsed;
    if (!user || user.__isUserNotAvailableProxy) return null;
    return user;
  } catch {
    return null;
  }
}

export function readStoredAuthUser() {
  if (typeof window === "undefined") return null;

  const storageKey = getAuthStorageKey();
  if (!storageKey) return null;

  const userFromUserStorage = parseStoredUser(window.localStorage.getItem(`${storageKey}-user`));
  if (userFromUserStorage) return userFromUserStorage;

  try {
    const sessionRaw = window.localStorage.getItem(storageKey);
    if (!sessionRaw) return null;

    const session = JSON.parse(sessionRaw);
    if (!session?.access_token) return null;

    return parseStoredUser(JSON.stringify({ user: session.user }));
  } catch {
    return null;
  }
}
