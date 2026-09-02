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
    playbackEnabled = true,
    className = "",
    onAudible,
  },
  ref,
) {
  const hostRef = useRef(null);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const userSilencedRef = useRef(userSilenced);
  const playbackEnabledRef = useRef(playbackEnabled);

  volumeRef.current = volume;
  mutedRef.current = muted;
  userSilencedRef.current = userSilenced;
  playbackEnabledRef.current = playbackEnabled;

  const getVideo = useCallback(() => getBioBackgroundVideo(), []);

  const pausePreview = useCallback(() => {
    const video = getVideo();
    if (!video) return;

    video.muted = true;
    video.setAttribute("muted", "");

    const holdFirstFrame = () => {
      video.pause();

      try {
        if (video.currentTime > 0.05) {
          video.currentTime = 0;
        }
      } catch {
        // Some browsers block seeking before metadata is ready.
      }
    };

    if (video.readyState >= 2) {
      holdFirstFrame();
      return;
    }

    const onFrameReady = () => {
      holdFirstFrame();
    };

    video.addEventListener("loadeddata", onFrameReady, { once: true });

    try {
      const playResult = video.play();
      if (playResult && typeof playResult.then === "function") {
        playResult.then(holdFirstFrame).catch(holdFirstFrame);
        return;
      }
    } catch {
      // Fall through to pause when autoplay is blocked.
    }

    holdFirstFrame();
  }, [getVideo]);

  const ensureVideoVisible = useCallback(() => {
    if (!playbackEnabledRef.current) {
      pausePreview();
      return false;
    }

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
  }, [getVideo, pausePreview]);

  const forceAudibleSync = useCallback(() => {
    if (!playbackEnabledRef.current || userSilencedRef.current) return false;

    const nextVolume = Math.min(100, Math.max(0, Number(volumeRef.current) || 0));
    const ok = primeBioBackgroundAudioSync(src, nextVolume / 100);

    if (ok) {
      onAudible?.();
    }

    return ok;
  }, [onAudible, src]);

  const syncPlayback = useCallback(() => {
    if (!playbackEnabledRef.current) {
      pausePreview();
      return;
    }

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
  }, [ensureVideoVisible, forceAudibleSync, getVideo, pausePreview]);

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

    const video = mountBioBackgroundVideo(host, `${styles.backgroundVideo} ${className}`.trim());
    if (!video) return;

    video.preload = "auto";

    if (video.getAttribute("src") !== src && video.src !== new URL(src, window.location.origin).href) {
      video.src = src;
    }

    if (!playbackEnabledRef.current) {
      pausePreview();
      return;
    }

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
  }, [className, ensureVideoVisible, forceAudibleSync, onAudible, pausePreview, src]);

  useEffect(() => {
    const video = getVideo();
    if (!video) return undefined;

    if (!playbackEnabled) {
      pausePreview();
      return undefined;
    }

    const onReady = () => {
      ensureVideoVisible();

      if (!userSilencedRef.current && !mutedRef.current) {
        if (hasActiveUserActivation() || isBioBackgroundAudioPrimed()) {
          forceAudibleSync();
        }
      }
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    const resume = () => {
      if (playbackEnabledRef.current) {
        ensureVideoVisible();
      }
    };

    const onPrime = () => {
      if (!playbackEnabledRef.current) return;
      if (!userSilencedRef.current && !mutedRef.current) {
        forceAudibleSync();
      }
    };

    ensureVideoVisible();
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
  }, [ensureVideoVisible, forceAudibleSync, getVideo, pausePreview, playbackEnabled, src]);

  useEffect(() => {
    syncPlayback();
  }, [muted, playbackEnabled, syncPlayback, userSilenced, volume]);

  useEffect(() => {
    if (!playbackEnabled) return undefined;

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
  }, [forceAudibleSync, playbackEnabled]);

  return <div ref={hostRef} className={styles.backgroundVideoHost} aria-hidden="true" />;
});

export default BioBackgroundVideo;
