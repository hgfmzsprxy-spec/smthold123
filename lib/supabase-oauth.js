import { supabase } from "./supabase";

/** Dedupes Strict Mode remounts + detectSessionInUrl races for the same OAuth code. */
const oauthExchangeByCode = new Map();

/**
 * Complete a PKCE OAuth redirect (`?code=`).
 * Falls back to an existing session when the verifier was already consumed
 * (detectSessionInUrl, Strict Mode double-mount, or a parallel exchange).
 */
export async function resolveOAuthReturnSession(code) {
  const key = String(code || "").trim();
  if (!key) {
    return { session: null, user: null, error: new Error("Missing OAuth code.") };
  }

  const existing = oauthExchangeByCode.get(key);
  if (existing) return existing;

  const promise = (async () => {
    let exchangeError = null;

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(key);
      if (!error && data?.session) {
        return {
          session: data.session,
          user: data.user || data.session.user || null,
          error: null,
        };
      }
      exchangeError = error || null;
    } catch (error) {
      exchangeError = error;
    }

    // Verifier often already used by detectSessionInUrl or a previous mount.
    const { data: current } = await supabase.auth.getSession();
    if (current?.session) {
      return {
        session: current.session,
        user: current.session.user || null,
        error: null,
      };
    }

    await new Promise((resolve) => window.setTimeout(resolve, 450));

    const { data: again } = await supabase.auth.getSession();
    if (again?.session) {
      return {
        session: again.session,
        user: again.session.user || null,
        error: null,
      };
    }

    return {
      session: null,
      user: null,
      error: exchangeError || new Error("OAuth exchange failed."),
    };
  })();

  oauthExchangeByCode.set(key, promise);

  try {
    return await promise;
  } finally {
    window.setTimeout(() => {
      oauthExchangeByCode.delete(key);
    }, 15000);
  }
}
