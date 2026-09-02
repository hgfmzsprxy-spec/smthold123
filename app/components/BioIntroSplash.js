"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { bioIntroSplash } from "../../lib/bio-data";
import styles from "./BioIntroSplash.module.css";

const SWIPE_THRESHOLD = 0.82;
const THUMB_SIZE = 46;
const TRACK_PADDING = 4;

export default function BioIntroSplash({ onComplete }) {
  const trackRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragOriginRef = useRef(0);
  const thumbOffsetRef = useRef(0);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [exiting, setExiting] = useState(false);

  const measureTrack = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const nextMax = Math.max(0, track.clientWidth - THUMB_SIZE - TRACK_PADDING * 2);
    setMaxOffset(nextMax);
    setThumbOffset((current) => {
      const next = Math.min(current, nextMax);
      thumbOffsetRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    measureTrack();
    window.addEventListener("resize", measureTrack);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", measureTrack);
      document.body.style.overflow = "";
    };
  }, [measureTrack]);

  const finishIntro = useCallback(() => {
    if (completed) return;

    setCompleted(true);
    setExiting(true);
    thumbOffsetRef.current = maxOffset;
    setThumbOffset(maxOffset);
    onComplete();
  }, [completed, maxOffset, onComplete]);

  const updateOffset = useCallback(
    (clientX) => {
      const delta = clientX - dragStartXRef.current;
      const next = Math.min(maxOffset, Math.max(0, dragOriginRef.current + delta));
      thumbOffsetRef.current = next;
      setThumbOffset(next);

      if (maxOffset > 0 && next / maxOffset >= SWIPE_THRESHOLD) {
        finishIntro();
      }
    },
    [finishIntro, maxOffset],
  );

  const onPointerDown = (event) => {
    if (completed) return;

    setDragging(true);
    dragStartXRef.current = event.clientX;
    dragOriginRef.current = thumbOffset;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragging || completed) return;
    updateOffset(event.clientX);
  };

  const onPointerUp = (event) => {
    if (!dragging || completed) return;

    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (maxOffset > 0 && thumbOffsetRef.current / maxOffset >= SWIPE_THRESHOLD) {
      finishIntro();
      return;
    }

    thumbOffsetRef.current = 0;
    setThumbOffset(0);
  };

  return (
    <div className={`${styles.overlay} ${exiting ? styles.overlayExit : ""}`} role="dialog" aria-modal="true" aria-label="Welcome">
      <div className={styles.backdrop} aria-hidden="true" />

      <div className={`${styles.card} ${exiting ? styles.cardExit : ""}`}>
        <div className={styles.logoWrap}>
          <img src={bioIntroSplash.logo} alt={bioIntroSplash.logoAlt} className={styles.logo} />
        </div>

        <h2 className={styles.title}>{bioIntroSplash.title}</h2>
        <p className={styles.subtitle}>{bioIntroSplash.subtitle}</p>

        <p className={styles.swipeHint}>{bioIntroSplash.swipeLabel}</p>

        <div
          ref={trackRef}
          className={`${styles.swipeTrack} ${dragging ? styles.swipeTrackDragging : ""} ${completed ? styles.swipeTrackComplete : ""}`}
        >
          <div className={styles.swipeFill} style={{ width: `${THUMB_SIZE + thumbOffset + TRACK_PADDING}px` }} aria-hidden="true" />
          <button
            type="button"
            className={styles.swipeThumb}
            style={{ transform: `translateX(${thumbOffset}px)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label={bioIntroSplash.swipeLabel}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
