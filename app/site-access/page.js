import { Suspense } from "react";
import SiteAccessGate from "./SiteAccessGate";

export default function SiteAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="site-access-screen">
          <div className="site-access-spinner" aria-hidden="true" />
          <p className="site-access-label">Loading</p>
        </div>
      }
    >
      <SiteAccessGate />
    </Suspense>
  );
}
