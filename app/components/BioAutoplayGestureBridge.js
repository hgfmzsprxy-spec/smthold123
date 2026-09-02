"use client";

import { useEffect } from "react";
import { markBioAutoplayGesture } from "../../lib/bio-autoplay";

export default function BioAutoplayGestureBridge() {
  useEffect(() => {
    const onPointerDown = () => {
      markBioAutoplayGesture();
    };

    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
