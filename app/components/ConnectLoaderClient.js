"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  claimDiscordForLicense,
  extractDiscordProfile,
  cleanupDiscordAuthReturnUrl,
} from "../../lib/loader-redeem";
import { resolveOAuthReturnSession } from "../../lib/supabase-oauth";

export function ConnectLoaderClient({ licenseKey, appId }) {
  const [status, setStatus] = useState("boot"); // boot | redirecting | linking | done | error
  const [message, setMessage] = useState("Starting Discord authorization…");
  const [username, setUsername] = useState("");
  const oauthStarted = useRef(false);

  const canLink = useMemo(
    () => Boolean(String(licenseKey || "").trim() && String(appId || "").trim()),
    [licenseKey, appId],
  );

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined" || !canLink) return "";
    const url = new URL("/connect-loader", window.location.origin);
    url.searchParams.set("key", licenseKey);
    url.searchParams.set("app", appId);
    return url.toString();
  }, [appId, canLink, licenseKey]);

  const finishOk = useCallback((name) => {
    setUsername(name || "Discord user");
    setStatus("done");
    setMessage("Discord connected. Return to the spoofer — CONTINUE unlocks automatically.");
  }, []);

  const linkUser = useCallback(
    async (user) => {
      if (!canLink) {
        setStatus("error");
        setMessage("Missing license key or app id in the connect URL.");
        return;
      }
      const profile = extractDiscordProfile(user);
      if (!profile?.authUserId || !profile?.discordUserId) {
        setStatus("error");
        setMessage("Could not read Discord profile from the OAuth session.");
        return;
      }
      setStatus("linking");
      setMessage("Linking Discord to your license…");
      const claim = await claimDiscordForLicense(licenseKey, appId, profile);
      if (!claim.ok) {
        setStatus("error");
        setMessage(claim.error || "Could not link Discord to this license.");
        return;
      }
      finishOk(profile.username || claim.data?.discord_username || "");
    },
    [appId, canLink, finishOk, licenseKey],
  );

  const startDiscordOAuth = useCallback(async () => {
    if (!redirectTo) {
      setStatus("error");
      setMessage("Missing license key or app id.");
      return;
    }
    setStatus("redirecting");
    setMessage("Redirecting to Discord…");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo,
        scopes: "identify",
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message || "Discord login failed.");
    }
  }, [redirectTo]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!canLink) {
        setStatus("error");
        setMessage("Open this page from the spoofer CONNECT button (license + app id required).");
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error_description") || params.get("error");
        if (oauthError) {
          setStatus("error");
          setMessage(String(oauthError));
          cleanupDiscordAuthReturnUrl();
          return;
        }

        // Returning from Discord OAuth with ?code=
        if (code) {
          setStatus("linking");
          setMessage("Finishing Discord login…");
          const resolved = await resolveOAuthReturnSession(code);
          cleanupDiscordAuthReturnUrl();
          if (cancelled) return;
          if (resolved?.error || !resolved?.session) {
            setStatus("error");
            setMessage(String(resolved?.error?.message || resolved?.error || "Discord login failed."));
            return;
          }
          await linkUser(resolved.user || resolved.session.user);
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err?.message || "OAuth return failed.");
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data?.session?.user) {
        await linkUser(data.session.user);
        return;
      }

      // No session yet → kick straight into Discord OAuth (no intermediate form).
      if (!oauthStarted.current) {
        oauthStarted.current = true;
        await startDiscordOAuth();
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [canLink, linkUser, startDiscordOAuth]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
        background: "radial-gradient(1200px 600px at 50% -10%, #2a2140 0%, #0b0c10 55%, #07080b 100%)",
        color: "#ececf2",
        fontFamily: "Segoe UI, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(460px, 100%)",
          borderRadius: 14,
          border: "1px solid rgba(151,131,209,0.35)",
          background: "rgba(14,16,24,0.92)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          padding: "28px 24px 24px",
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: "0.08em", color: "#9783d1", textTransform: "uppercase" }}>
          phantom-cheats
        </div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 24, fontWeight: 700 }}>Discord OAuth</h1>
        <p style={{ margin: "0 0 18px", color: "#a0a2b0", lineHeight: 1.45 }}>{message}</p>

        {(status === "boot" || status === "redirecting" || status === "linking") && (
          <div style={{ color: "#8db4e2", fontSize: 14 }}>Please wait…</div>
        )}

        {status === "done" && (
          <div
            style={{
              borderRadius: 8,
              padding: "12px 14px",
              background: "rgba(151,131,209,0.16)",
              border: "1px solid rgba(151,131,209,0.35)",
            }}
          >
            Connected as <strong>{username}</strong>
          </div>
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={() => {
              oauthStarted.current = false;
              void startDiscordOAuth();
            }}
            style={{
              width: "100%",
              marginTop: 8,
              border: 0,
              borderRadius: 8,
              padding: "12px 16px",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              background: "linear-gradient(90deg, #9783d1, #8db4e2)",
            }}
          >
            Authorize with Discord
          </button>
        )}
      </section>
    </main>
  );
}
