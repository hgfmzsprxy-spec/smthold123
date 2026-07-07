"use client";

import Script from "next/script";
import { KOMERZA_STORE_ID } from "../../lib/komerza.js";

export default function KomerzaScript() {
  if (!KOMERZA_STORE_ID) return null;

  return (
    <Script
      src="https://cdn.komerza.com/komerza.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.komerza) {
          window.komerza.init(KOMERZA_STORE_ID);
        }
      }}
    />
  );
}
