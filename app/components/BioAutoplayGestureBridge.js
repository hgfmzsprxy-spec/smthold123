"use client";

import { useEffect } from "react";
import { BIO_BACKGROUND_VIDEO_SRC } from "../../lib/bio-data";
import {
  dispatchBioAudioPrimeEvent,
  primeBioBackgroundAudioSync,
} from "../../lib/bio-background-prime";
import { isBioHref, markBioAutoplayGesture, unlockBioPageAudio } from "../../lib/bio-autoplay";

function isOnBioPage() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/bio";
}

function primeAudibleDuringGesture() {
  markBioAutoplayGesture();
  unlockBioPageAudio();
  primeBioBackgroundAudioSync(BIO_BACKGROUND_VIDEO_SRC, 1);
  dispatchBioAudioPrimeEvent();
}

export default function BioAutoplayGestureBridge() {
  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      const href = anchor?.getAttribute("href") || "";

      if (isBioHref(href) || isOnBioPage()) {
        primeAudibleDuringGesture();
        return;
      }

      markBioAutoplayGesture();
    };

    const onKeyDown = () => {
      if (isOnBioPage()) {
        primeAudibleDuringGesture();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
