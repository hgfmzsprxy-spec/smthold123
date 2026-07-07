"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ACCESS_MIN_MS, runAccessChecks, setAccessCookie } from "../../lib/site-access";

function getSafeNextPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith("/site-access")) {
    return "/";
  }

  return value;
}

export default function SiteAccessGate() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = getSafeNextPath(searchParams.get("next"));
    const startedAt = Date.now();

    async function verifyAccess() {
      await new Promise((resolve) => {
        window.setTimeout(resolve, ACCESS_MIN_MS);
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < ACCESS_MIN_MS) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, ACCESS_MIN_MS - elapsed);
        });
      }

      if (!runAccessChecks()) {
        return;
      }

      setAccessCookie();
      window.location.replace(next);
    }

    verifyAccess();
  }, [searchParams]);

  return (
    <div className="site-access-screen">
      <div className="site-access-spinner" aria-hidden="true" />
      <p className="site-access-label">Loading</p>
    </div>
  );
}
