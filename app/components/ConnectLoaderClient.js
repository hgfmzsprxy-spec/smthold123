"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  claimDiscordForLicense,
  extractDiscordProfile,
  cleanupDiscordAuthReturnUrl,
} from "../../lib/loader-redeem";
import { resolveOAuthReturnSession } from "../../lib/supabase-oauth";
import { ContourBackground } from "./ContourBackground";
import styles from "./ConnectLoaderClient.module.css";

const CONNECT_COPY =
  "Please connect your Discord account to register and assign your License key.";

const STORAGE_KEY = "phantom_connect_loader_v1";

function persistConnectParams(key, app) {
  if (typeof window === "undefined") return;
  const k = String(key || "").trim();
  const a = String(app || "").trim();
  if (!k || !a) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ key: k, app: a, at: Date.now() }));
  } catch {
    // ignore
  }
}

function readStoredConnectParams() {
  if (typeof window === "undefined") return { key: "", app: "" };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { key: "", app: "" };
    return {
      key: String(parsed.key || "").trim(),
      app: String(parsed.app || "").trim(),
    };
  } catch {
    return { key: "", app: "" };
  }
}

function readConnectParams(licenseKey, appId) {
  let key = String(licenseKey || "").trim();
  let app = String(appId || "").trim();

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (!key) key = String(params.get("key") || params.get("license") || "").trim();
    if (!app) app = String(params.get("app") || params.get("app_id") || "").trim();

    if (!key || !app) {
      const stored = readStoredConnectParams();
      if (!key) key = stored.key;
      if (!app) app = stored.app;
    }
  }

  if (key && app) persistConnectParams(key, app);
  return { key, app };
}

export function ConnectLoaderClient({ licenseKey, appId }) {
  const [status, setStatus] = useState("boot"); // boot | redirecting | linking | done | error
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);
  const [hint, setHint] = useState("");
  const bootOnce = useRef(false);

  const applyProfile = useCallback((profile) => {
    if (!profile) return;
    if (profile.username) setUsername(String(profile.username));
    if (profile.avatarUrl) setAvatarUrl(String(profile.avatarUrl));
  }, []);

  const finishOk = useCallback((name, avatar) => {
    setUsername(name || "Discord user");
    if (avatar) setAvatarUrl(avatar);
    setHint("");
    setStatus("done");
  }, []);

  const linkUser = useCallback(
    async (user) => {
      const live = readConnectParams(licenseKey, appId);
      if (!live.key || !live.app) {
        setHint("Open CONNECT from the spoofer so we can bind your key.");
        setStatus("error");
        return false;
      }
      const profile = extractDiscordProfile(user);
      if (!profile?.authUserId || !profile?.discordUserId) {
        setHint("Discord profile incomplete. Try CONNECT again.");
        setStatus("error");
        return false;
      }
      applyProfile(profile);
      setStatus("linking");
      setHint("");
      const claim = await claimDiscordForLicense(live.key, live.app, profile);
      if (!claim.ok) {
        setHint(claim.error || "Couldn’t link Discord. Try CONNECT again.");
        setStatus("error");
        return false;
      }
      finishOk(
        profile.username || claim.data?.discord_username || "",
        profile.avatarUrl || claim.data?.discord_avatar_url || "",
      );
      return true;
    },
    [appId, applyProfile, finishOk, licenseKey],
  );

  const startDiscordOAuth = useCallback(async () => {
    const live = readConnectParams(licenseKey, appId);
    if (!live.key || !live.app) {
      setHint("Open CONNECT from the spoofer so we can bind your key.");
      setStatus("error");
      return;
    }

    persistConnectParams(live.key, live.app);
    setStatus("redirecting");
    setHint("");

    // Clean redirect URL (no query) — key/app restored from sessionStorage on return.
    // Query-string redirectTo is often rejected by Supabase allow-list.
    const redirectTo = `${window.location.origin}/connect-loader`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo,
        scopes: "identify email",
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setHint(error.message || "Discord login failed.");
      setStatus("error");
      return;
    }

    const oauthUrl = String(data?.url || "").trim();
    if (!oauthUrl) {
      setHint("Discord login URL missing. Try again.");
      setStatus("error");
      return;
    }

    window.location.assign(oauthUrl);
  }, [appId, licenseKey]);

  useEffect(() => {
    if (bootOnce.current) return;
    bootOnce.current = true;

    let cancelled = false;

    async function boot() {
      const live = readConnectParams(licenseKey, appId);

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error_description") || params.get("error");

        if (oauthError) {
          if (!cancelled) {
            setHint(String(oauthError));
            setStatus("error");
          }
          cleanupDiscordAuthReturnUrl();
          return;
        }

        if (code) {
          if (!cancelled) setStatus("linking");
          const resolved = await resolveOAuthReturnSession(code);
          cleanupDiscordAuthReturnUrl();
          if (cancelled) return;
          if (resolved?.error || !resolved?.session) {
            setHint(String(resolved?.error?.message || resolved?.error || "Discord login failed."));
            setStatus("error");
            return;
          }
          await linkUser(resolved.user || resolved.session.user);
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setHint(err?.message || "OAuth return failed.");
          setStatus("error");
        }
        return;
      }

      if (!live.key || !live.app) {
        if (!cancelled) {
          setHint("Open CONNECT from the spoofer so we can bind your key.");
          setStatus("error");
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data?.session?.user) {
        const ok = await linkUser(data.session.user);
        if (!ok && !cancelled) setStatus("error");
        return;
      }

      // Ready for manual CONNECT — no silent auto-redirect (Strict Mode / blockers break it).
      if (!cancelled) setStatus("error");
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [appId, licenseKey, linkUser]);

  const isDone = status === "done";
  const showConnect = !isDone;

  return (
    <>
      <ContourBackground />
      <main className={styles.root}>
        <section className={styles.card}>
          <div className={styles.header}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.logo} src="/images/phantom.png" alt="phantom-cheats" />
            <div className={styles.headerText}>
              <div className={styles.brand}>phantom-cheats</div>
              <h1 className={styles.title}>Discord OAuth</h1>
            </div>
          </div>
          {!isDone && <p className={styles.message}>{CONNECT_COPY}</p>}

          <div className={styles.profile}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.avatar} src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarEmpty} aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.891.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                  />
                </svg>
              </div>
            )}
            <div className={username ? styles.profileName : styles.profileNameMuted}>
              {username || "Not Connected"}
            </div>
          </div>

          {isDone && (
            <p className={styles.doneNote}>
              You’re connected. You can close this page and return to the program, Thank You!
            </p>
          )}

          {showConnect && (
            <button type="button" className={styles.btn} onClick={() => void startDiscordOAuth()}>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.891.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                />
              </svg>
              CONNECT
            </button>
          )}

          {hint && !isDone ? <p className={styles.hint}>{hint}</p> : null}

          {!isDone && (
            <div className={`${styles.why}${whyOpen ? ` ${styles.whyOpen}` : ""}`}>
              <button
                type="button"
                className={styles.whyToggle}
                aria-expanded={whyOpen}
                onClick={() => setWhyOpen((v) => !v)}
              >
                <span>Why it’s needed?</span>
                <svg className={styles.whyChevron} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 9l6 6 6-6"
                  />
                </svg>
              </button>
              <div className={styles.whyBody}>
                <div className={styles.whyInner}>
                  <ul className={styles.whyList}>
                    <li className={styles.whyItem}>
                      <span className={styles.whyDot} />
                      <p className={styles.whyText}>
                        <strong>Easier customer identification.</strong> Your license is saved under
                        your Discord account in our panel, so support can find you instantly without
                        hunting for keys or screenshots.
                      </p>
                    </li>
                    <li className={styles.whyItem}>
                      <span className={styles.whyDot} />
                      <p className={styles.whyText}>
                        <strong>What we collect.</strong> Only your Discord account — the public
                        profile you already show (username / avatar) and your email address. Nothing
                        else: no messages, no servers, no friends list.
                      </p>
                    </li>
                    <li className={styles.whyItem}>
                      <span className={styles.whyDot} />
                      <p className={styles.whyText}>
                        <strong>Is it safe?</strong> Yes. This is official Discord OAuth, and we care
                        about customer privacy — we use the link only to verify ownership and help
                        you, never to spam or share your data.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
