"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import {
  BIO_AUDIO_PRIME_EVENT,
  getBioBackgroundVideo,
  isBioBackgroundAudioPrimed,
  mountBioBackgroundVideo,
  primeBioBackgroundAudioSync,
} from "../../lib/bio-background-prime";
import { hasActiveUserActivation, markBioAutoplayGesture } from "../../lib/bio-autoplay";
import styles from "./BioPage.module.css";

const BioBackgroundVideo = forwardRef(function BioBackgroundVideo(
  {
    src,
    volume = 100,
    muted = false,
    userSilenced = false,
    className = "",
    onAudible,
  },
  ref,
) {
  const hostRef = useRef(null);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const userSilencedRef = useRef(userSilenced);

  volumeRef.current = volume;
  mutedRef.current = muted;
  userSilencedRef.current = userSilenced;

  const getVideo = useCallback(() => getBioBackgroundVideo(), []);

  const ensureVideoVisible = useCallback(() => {
    const video = getVideo();
    if (!video) return false;

    const nextVolume = Math.min(100, Math.max(0, Number(volumeRef.current) || 0));
    video.volume = nextVolume / 100;

    if (!video.paused) return true;

    video.muted = true;

    try {
      const playResult = video.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }, [getVideo]);

  const forceAudibleSync = useCallback(() => {
    if (userSilencedRef.current) return false;

    const nextVolume = Math.min(100, Math.max(0, Number(volumeRef.current) || 0));
    const ok = primeBioBackgroundAudioSync(src, nextVolume / 100);

    if (ok) {
      onAudible?.();
    }

    return ok;
  }, [onAudible, src]);

  const syncPlayback = useCallback(() => {
    const video = getVideo();
    if (!video) return;

    const nextVolume = Math.min(100, Math.max(0, Number(volumeRef.current) || 0));
    const shouldMute = userSilencedRef.current || mutedRef.current || nextVolume === 0;

    video.volume = nextVolume / 100;

    if (shouldMute) {
      video.muted = true;
      ensureVideoVisible();
      return;
    }

    forceAudibleSync();
  }, [ensureVideoVisible, forceAudibleSync, getVideo]);

  useImperativeHandle(
    ref,
    () => ({
      forceAudible: () => forceAudibleSync(),
      syncPlayback,
    }),
    [forceAudibleSync, syncPlayback],
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    mountBioBackgroundVideo(host, `${styles.backgroundVideo} ${className}`.trim());

    const video = getVideo();
    if (!video) return;

    if (isBioBackgroundAudioPrimed()) {
      onAudible?.();
      return;
    }

    video.muted = true;
    video.setAttribute("muted", "");

    if (hasActiveUserActivation()) {
      markBioAutoplayGesture();
      forceAudibleSync();
      return;
    }

    ensureVideoVisible();
  }, [className, ensureVideoVisible, forceAudibleSync, getVideo, onAudible]);

  useEffect(() => {
    const onReady = () => {
      ensureVideoVisible();

      if (!userSilencedRef.current && !mutedRef.current) {
        if (hasActiveUserActivation() || isBioBackgroundAudioPrimed()) {
          forceAudibleSync();
        }
      }
    };

    const video = getVideo();
    if (!video) return undefined;

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    const resume = () => {
      ensureVideoVisible();
    };

    const onPrime = () => {
      if (!userSilencedRef.current && !mutedRef.current) {
        forceAudibleSync();
      }
    };

    window.addEventListener("pageshow", resume);
    window.addEventListener(BIO_AUDIO_PRIME_EVENT, onPrime);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener(BIO_AUDIO_PRIME_EVENT, onPrime);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ensureVideoVisible, forceAudibleSync, getVideo, src]);

  useEffect(() => {
    syncPlayback();
  }, [muted, syncPlayback, userSilenced, volume]);

  useEffect(() => {
    const unlock = () => {
      if (userSilencedRef.current || mutedRef.current) return;
      markBioAutoplayGesture();
      forceAudibleSync();
    };

    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("click", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("touchstart", unlock, { capture: true, passive: true });

    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("click", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
    };
  }, [forceAudibleSync]);

  return <div ref={hostRef} className={styles.backgroundVideoHost} aria-hidden="true" />;
});

export default BioBackgroundVideo;
