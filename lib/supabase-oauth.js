import { supabase } from "./supabase";

/** Dedupes Strict Mode remounts + detectSessionInUrl races for the same OAuth code. */
const oauthExchangeByCode = new Map();

/**
 * Key used in localStorage/sessionStorage to remember the EXACT redirect_uri
 * used when launching the Discord OAuth flow. Discord MUST receive the same
 * redirect_uri during the code→token exchange as was used in the authorize
 * URL, otherwise it rejects with invalid_grant ("code generated for another
 * redirect_uri") — this is the root cause of "Unable to exchange external
 * code" when Supabase defaults to a different redirect URI internally.
 */
const LAST_OAUTH_REDIRECT_TO_KEY = "unbanhwid.oauth.lastRedirectTo";
const LAST_OAUTH_PROVIDER_KEY = "unbanhwid.oauth.lastProvider";

export function rememberOAuthLaunch(provider, redirectTo) {
  try {
    if (provider) localStorage.setItem(LAST_OAUTH_PROVIDER_KEY, String(provider));
    if (redirectTo) localStorage.setItem(LAST_OAUTH_REDIRECT_TO_KEY, String(redirectTo));
  } catch {
    /* storage disabled — best-effort only */
  }
}

export function getRememberedOAuthRedirectTo(fallback = "") {
  try {
    const stored = localStorage.getItem(LAST_OAUTH_REDIRECT_TO_KEY);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Complete a PKCE OAuth redirect (`?code=`).
 * Tries the standard supabase exchange first. If that fails with the common
 * "Unable to exchange external code" error — caused by a Supabase vs.
 * authorize-url redirect_uri mismatch against Discord — we fall back to a
 * private endpoint `/api/auth/discord-exchange` that performs the exchange
 * with the EXACT redirectTo that was used when the user clicked Sign-in.
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

    // ============================================================
    // FALLBACK — custom Discord exchange endpoint
    // Bypasses the Supabase internal code swap because it silently
    // overrides the redirect_uri → Discord 400 invalid_grant.
    // ============================================================
    try {
      const provider = (() => {
        try {
          return localStorage.getItem(LAST_OAUTH_PROVIDER_KEY) || "discord";
        } catch {
          return "discord";
        }
      })();

      if (provider === "discord") {
        const origin =
          (typeof window !== "undefined" && window.location?.origin) || "";
        const redirectTo = getRememberedOAuthRedirectTo(`${origin}/admin`);

        const fallbackResp = await fetch("/api/auth/discord-exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code: key, redirectTo, provider }),
        });
        const fallbackData = await fallbackResp.json().catch(() => ({}));
        if (fallbackResp.ok && fallbackData?.session) {
          // Inject the freshly issued session into the browser-side client.
          try {
            await supabase.auth.setSession({
              access_token: fallbackData.session.access_token,
              refresh_token: fallbackData.session.refresh_token,
            });
          } catch {
            /* ignore — even if setSession emits we still have valid tokens */
          }

          const { data: settled } = await supabase.auth.getSession();
          if (settled?.session) {
            return {
              session: settled.session,
              user: settled.session.user || fallbackData.user || null,
              error: null,
            };
          }
          if (fallbackData.session?.user) {
            return {
              session: fallbackData.session,
              user: fallbackData.user || fallbackData.session.user,
              error: null,
            };
          }
        } else {
          // Prefer a more actionable message when the env secret is missing
          // (this is the #1 setup failure after the redirect mismatch itself).
          const msg = String(fallbackData?.error || "").toLowerCase();
          if (msg.includes("discord_client_secret") || msg.includes("environment variables")) {
            return {
              session: null,
              user: null,
              error: new Error(
                "DISCORD_CLIENT_SECRET nie jest ustawione w .env.local. Skopiuj je z Discord Developer Portal → OAuth2 → Client Secret i zrestartuj npm run dev."
              ),
            };
          }
          if (fallbackData?.error) {
            exchangeError = new Error(
              `Discord exchange fallback failed: ${fallbackData.error}`
            );
          }
        }
      }
    } catch (fallbackErr) {
      if (!exchangeError) exchangeError = fallbackErr;
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
