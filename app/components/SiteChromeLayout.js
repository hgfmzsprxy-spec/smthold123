"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SiteChrome, resolveSiteNavActive } from "./Site";

export default function SiteChromeLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return <SiteChrome active={resolveSiteNavActive(pathname)}>{children}</SiteChrome>;
}
