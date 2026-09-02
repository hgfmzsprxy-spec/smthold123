"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  MapPinOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

function formatShowcaseTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function ProductShowcaseVideo({ src = "", streamableId = "", chapters = [], id, className = "", poster }) {
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const seekRef = useRef(null);
  const [resolvedSrc, setResolvedSrc] = useState(src || "");
  const [mediaStatus, setMediaStatus] = useState(src ? "ready" : streamableId ? "loading" : "error");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hoverChapter, setHoverChapter] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [centerAction, setCenterAction] = useState(null);
  const lastVolumeRef = useRef(0.8);
  const volumeCloseTimerRef = useRef(null);
  const centerActionTimerRef = useRef(null);
  const videoClickTimerRef = useRef(null);

  const chapterFallbackDuration = chapters.length
    ? Math.max(...chapters.map((chapter) => Number(chapter.time) || 0)) + 20
    : 0;
  const effectiveDuration = Number.isFinite(duration) && duration > 0 ? duration : chapterFallbackDuration;
  const progress = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;
  const displayVolume = muted ? 0 : volume;
  const canPlay = mediaStatus === "ready" && Boolean(resolvedSrc);

  function syncDuration(video) {
    const next = Number(video?.duration);
    if (Number.isFinite(next) && next > 0) {
      setDuration(next);
    }
  }

  useEffect(() => {
    if (!streamableId) {
      setResolvedSrc(src || "");
      setMediaStatus(src ? "ready" : "error");
      return undefined;
    }

    let cancelled = false;

    async function resolveStreamable() {
      try {
        const response = await fetch(`/api/streamable/${encodeURIComponent(streamableId)}`, {
          cache: "no-store",
        });
        const body = await response.json();
        if (cancelled) return;

        if (body?.url) {
          setResolvedSrc(body.url);
          setMediaStatus("ready");
          return;
        }

        setMediaStatus(body?.status === 0 || body?.status === 1 ? "processing" : "error");
      } catch {
        if (!cancelled) setMediaStatus("error");
      }
    }

    setMediaStatus("loading");
    void resolveStreamable();
    const timerId = window.setInterval(() => {
      void resolveStreamable();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [src, streamableId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, volume));
    video.muted = muted || volume <= 0;
  }, [muted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return undefined;

    const onMeta = () => syncDuration(video);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("loadeddata", onMeta);
    syncDuration(video);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("loadeddata", onMeta);
    };
  }, [resolvedSrc]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      setMarkersVisible(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (volumeCloseTimerRef.current) window.clearTimeout(volumeCloseTimerRef.current);
      if (centerActionTimerRef.current) window.clearTimeout(centerActionTimerRef.current);
      if (videoClickTimerRef.current) window.clearTimeout(videoClickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      const active = document.fullscreenElement || document.webkitFullscreenElement || null;
      setIsFullscreen(Boolean(playerRef.current && active === playerRef.current));
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  function openVolumePicker() {
    if (volumeCloseTimerRef.current) {
      window.clearTimeout(volumeCloseTimerRef.current);
      volumeCloseTimerRef.current = null;
    }
    setVolumeOpen(true);
  }

  function scheduleCloseVolumePicker() {
    if (volumeCloseTimerRef.current) window.clearTimeout(volumeCloseTimerRef.current);
    volumeCloseTimerRef.current = window.setTimeout(() => {
      setVolumeOpen(false);
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest?.(".product-showcase-volume")) {
        active.blur();
      }
      volumeCloseTimerRef.current = null;
    }, 80);
  }

  function seekTo(time) {
    const video = videoRef.current;
    if (!video) return;
    const max = effectiveDuration || time;
    const next = Math.max(0, Math.min(max, time));
    video.currentTime = next;
    setCurrentTime(next);
  }

  function flashCenterAction(kind) {
    if (centerActionTimerRef.current) {
      window.clearTimeout(centerActionTimerRef.current);
      centerActionTimerRef.current = null;
    }
    setCenterAction({ kind, id: Date.now() });
    centerActionTimerRef.current = window.setTimeout(() => {
      setCenterAction(null);
      centerActionTimerRef.current = null;
    }, 560);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !canPlay) return;
    if (video.paused) {
      flashCenterAction("play");
      void video.play();
    } else {
      flashCenterAction("pause");
      video.pause();
    }
  }

  function handleVideoClick() {
    if (!canPlay) return;
    if (videoClickTimerRef.current) {
      window.clearTimeout(videoClickTimerRef.current);
      videoClickTimerRef.current = null;
      return;
    }

    videoClickTimerRef.current = window.setTimeout(() => {
      videoClickTimerRef.current = null;
      togglePlay();
    }, 220);
  }

  function handleVideoDoubleClick() {
    if (videoClickTimerRef.current) {
      window.clearTimeout(videoClickTimerRef.current);
      videoClickTimerRef.current = null;
    }
    void toggleFullscreen({ flash: true });
  }

  function setVolumeLevel(nextVolume) {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    setVolume(clamped);
    if (clamped > 0) {
      lastVolumeRef.current = clamped;
      setMuted(false);
    } else {
      setMuted(true);
    }
  }

  function toggleMute() {
    if (muted || volume <= 0) {
      const restored = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8;
      setVolume(restored);
      setMuted(false);
      return;
    }
    lastVolumeRef.current = volume > 0 ? volume : lastVolumeRef.current;
    setMuted(true);
  }

  async function toggleFullscreen({ flash = true } = {}) {
    const player = playerRef.current;
    if (!player) return;

    try {
      const active = document.fullscreenElement || document.webkitFullscreenElement || null;
      const isActive = Boolean(player && active === player);

      if (isActive) {
        if (flash) flashCenterAction("minimize");
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }

      if (flash) flashCenterAction("maximize");
      if (player.requestFullscreen) await player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
    } catch {
      // Ignore fullscreen denial / unsupported environments.
    }
  }

  function handleSeekClick(event) {
    if (!seekRef.current || effectiveDuration <= 0) return;
    if (event.target.closest(".product-showcase-marker")) return;
    const rect = seekRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekTo(ratio * effectiveDuration);
  }

  const statusMessage =
    mediaStatus === "loading"
      ? "Loading showcase…"
      : mediaStatus === "processing"
        ? "Showcase is still processing. Check back shortly."
        : mediaStatus === "error"
          ? "Showcase video is unavailable right now."
          : "";

  return (
    <div
      ref={playerRef}
      className={`loader-guide-video product-showcase-player${className ? ` ${className}` : ""}${isFullscreen ? " is-fullscreen" : ""}${canPlay ? "" : " is-pending"}`}
      id={id || undefined}
    >
      {canPlay ? (
        <video
          ref={videoRef}
          className="loader-guide-video-player"
          src={resolvedSrc}
          poster={poster || undefined}
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(event) => {
            syncDuration(event.currentTarget);
            setCurrentTime(event.currentTarget.currentTime || 0);
            event.currentTarget.volume = volume;
            event.currentTarget.muted = muted;
          }}
          onDurationChange={(event) => syncDuration(event.currentTarget)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onClick={handleVideoClick}
          onDoubleClick={handleVideoDoubleClick}
        />
      ) : (
        <div className="product-showcase-pending" role="status">
          <span>{statusMessage}</span>
        </div>
      )}
      {centerAction ? (
        <div className="product-showcase-center-action" key={centerAction.id} aria-hidden="true">
          <div className={`product-showcase-center-action-bubble is-${centerAction.kind}`}>
            {centerAction.kind === "play" ? (
              <Play size={34} strokeWidth={2.4} fill="currentColor" />
            ) : centerAction.kind === "pause" ? (
              <Pause size={34} strokeWidth={2.4} fill="currentColor" />
            ) : centerAction.kind === "minimize" ? (
              <Minimize2 size={30} strokeWidth={2.4} />
            ) : (
              <Maximize2 size={30} strokeWidth={2.4} />
            )}
          </div>
        </div>
      ) : null}
      {canPlay ? (
        <div className="product-showcase-controls">
          <button className="product-showcase-play" type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <span className="product-showcase-pause-icon" aria-hidden="true" /> : <Play size={16} strokeWidth={2.6} fill="currentColor" />}
          </button>
          <div
            className="product-showcase-seek"
            ref={seekRef}
            onClick={handleSeekClick}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(effectiveDuration)}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") seekTo(currentTime + 5);
              if (event.key === "ArrowLeft") seekTo(currentTime - 5);
            }}
          >
            <div className="product-showcase-seek-track" />
            <div className="product-showcase-seek-fill" style={{ width: `${progress}%` }} />
            <div className="product-showcase-time">
              {formatShowcaseTime(currentTime)} / {formatShowcaseTime(effectiveDuration)}
            </div>
            {effectiveDuration > 0
              ? chapters.map((chapter, index) => {
                  const nextTime = index < chapters.length - 1 ? chapters[index + 1].time : effectiveDuration + 1;
                  const left = Math.min(98.5, Math.max(1.2, (chapter.time / effectiveDuration) * 100));
                  const isActive = currentTime >= chapter.time && currentTime < nextTime;
                  const isHovered = hoverChapter === chapter.time;
                  return (
                    <button
                      key={`${chapter.time}-${chapter.label}`}
                      type="button"
                      className={`product-showcase-marker${isActive ? " is-active" : ""}${isHovered ? " is-hovered" : ""}${index % 2 === 1 ? " is-offset" : ""}${markersVisible ? "" : " is-concealed"}`}
                      style={{
                        left: `${left}%`,
                        transitionDelay: markersVisible
                          ? `${index * 28}ms`
                          : `${(chapters.length - 1 - index) * 24}ms`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!markersVisible) return;
                        seekTo(chapter.time);
                        const video = videoRef.current;
                        if (video?.paused) void video.play();
                      }}
                      onMouseEnter={() => {
                        if (markersVisible) setHoverChapter(chapter.time);
                      }}
                      onMouseLeave={() => setHoverChapter(null)}
                      tabIndex={markersVisible ? 0 : -1}
                      aria-hidden={!markersVisible}
                      aria-label={`${formatShowcaseTime(chapter.time)} ${chapter.label}`}
                    >
                      <span className="product-showcase-marker-dot" aria-hidden="true" />
                      <span className="product-showcase-marker-stem" aria-hidden="true" />
                      <span className="product-showcase-marker-label">
                        <em>{formatShowcaseTime(chapter.time)}</em>
                        {chapter.label}
                      </span>
                    </button>
                  );
                })
              : null}
          </div>
          {chapters.length ? (
            <button
              className={`product-showcase-markers-toggle${markersVisible ? "" : " is-hidden"}`}
              type="button"
              onClick={() => setMarkersVisible((value) => !value)}
              aria-pressed={markersVisible}
              aria-label={markersVisible ? "Hide markers" : "Show markers"}
              title={markersVisible ? "Hide markers" : "Show markers"}
            >
              {markersVisible ? <MapPin size={16} strokeWidth={2.3} /> : <MapPinOff size={16} strokeWidth={2.3} />}
            </button>
          ) : null}
          <div
            className={`product-showcase-volume${volumeOpen ? " is-open" : ""}`}
            onMouseEnter={openVolumePicker}
            onMouseLeave={scheduleCloseVolumePicker}
          >
            <button
              className="product-showcase-volume-toggle"
              type="button"
              onClick={toggleMute}
              aria-label={displayVolume <= 0 ? "Unmute" : "Mute"}
            >
              {displayVolume <= 0 ? <VolumeX size={16} strokeWidth={2.3} /> : <Volume2 size={16} strokeWidth={2.3} />}
            </button>
            <label className="product-showcase-volume-slider">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={displayVolume}
                onChange={(event) => setVolumeLevel(Number(event.target.value))}
                onFocus={openVolumePicker}
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(displayVolume * 100)}
                tabIndex={volumeOpen ? 0 : -1}
              />
            </label>
          </div>
          <button
            className="product-showcase-fullscreen"
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} strokeWidth={2.3} /> : <Maximize2 size={16} strokeWidth={2.3} />}
          </button>
        </div>
      ) : null}
    </div>
  );
}
