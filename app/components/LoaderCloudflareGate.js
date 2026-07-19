"use client";

import { useEffect, useState } from "react";
import { runAccessChecks } from "../../lib/site-access";
import {
  hasLoaderAccessCookie,
  LOADER_ACCESS_MIN_MS,
  setLoaderAccessCookie,
} from "../../lib/loader-access";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";

export default function LoaderCloudflareGate({ children }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("verifying");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (hasLoaderAccessCookie()) {
      setReady(true);
      setStatus("success");
      setBooting(false);
      return undefined;
    }

    setBooting(false);

    let cancelled = false;
    const startedAt = Date.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    async function verify() {
      await new Promise((resolve) => {
        window.setTimeout(resolve, LOADER_ACCESS_MIN_MS);
      });

      if (cancelled) return;

      if (!runAccessChecks()) {
        setStatus("verifying");
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < LOADER_ACCESS_MIN_MS) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, LOADER_ACCESS_MIN_MS - elapsed);
        });
      }

      if (cancelled) return;

      setStatus("success");
      setLoaderAccessCookie();

      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, 450);
    }

    verify();

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      document.body.style.overflow = "";
    }
  }, [ready]);

  const showGate = !ready && !booting;

  return (
    <>
      <div className={showGate ? "loader-cf-page-blur" : undefined} aria-hidden={showGate}>
        {children}
      </div>

      {showGate ? (
        <div className="loader-cf-overlay" role="dialog" aria-modal="true" aria-labelledby="loader-cf-title">
          <div className="loader-cf-card">
            <div className="loader-cf-card-header">
              <h2 id="loader-cf-title">Are you human?</h2>
            </div>
            <div className="loader-cf-card-body">
              <p>Please check the box below to verify that you are not a robot.</p>
              <CloudflareTurnstileWidget status={status} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
