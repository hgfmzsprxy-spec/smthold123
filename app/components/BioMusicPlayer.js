"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { bioPlaylist, getBioTrackThumbnail } from "../../lib/bio-data";
import styles from "./BioPage.module.css";

const YT_SCRIPT_ID = "bio-youtube-iframe-api";
const PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function loadYoutubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(YT_SCRIPT_ID);
    if (existing) {
      const wait = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(wait);
          resolve(window.YT);
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(wait);
        reject(new Error("YouTube API timeout."));
      }, 10000);
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.id = YT_SCRIPT_ID;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube API failed to load."));
    document.body.appendChild(script);
  });
}

export default function BioMusicPlayer() {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const trackIndexRef = useRef(0);
  const progressTimerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackTitle, setTrackTitle] = useState(bioPlaylist[0].title);
  const [trackArtist, setTrackArtist] = useState("YouTube");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(72);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const currentTrack = bioPlaylist[trackIndex] || bioPlaylist[0];
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const syncTrackMeta = useCallback((player) => {
    if (!player?.getVideoData) return;
    const data = player.getVideoData();
    if (data?.title) setTrackTitle(data.title);
    if (data?.author) setTrackArtist(data.author);
  }, []);

  const refreshProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player?.getCurrentTime || !player?.getDuration) return;

    const nextTime = player.getCurrentTime() || 0;
    const nextDuration = player.getDuration() || 0;
    setCurrentTime(nextTime);
    setDuration(nextDuration);
  }, []);

  const playTrack = useCallback(
    (index, { autoplay = true } = {}) => {
      const player = playerRef.current;
      const track = bioPlaylist[index];
      if (!player || !track) return;

      trackIndexRef.current = index;
      setTrackIndex(index);
      setTrackTitle(track.title);
      setTrackArtist("YouTube");
      setCurrentTime(0);
      setDuration(0);

      if (player.loadVideoById) {
        player.loadVideoById({
          videoId: track.id,
          startSeconds: 0,
        });
      }

      if (autoplay) {
        window.setTimeout(() => {
          player.playVideo?.();
          if (!isMuted) player.unMute?.();
        }, 120);
      }

      window.setTimeout(() => syncTrackMeta(player), 500);
    },
    [isMuted, syncTrackMeta]
  );

  const playNext = useCallback(() => {
    const nextIndex = (trackIndexRef.current + 1) % bioPlaylist.length;
    playTrack(nextIndex);
  }, [playTrack]);

  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  const playPrevious = useCallback(() => {
    const player = playerRef.current;
    const current = player?.getCurrentTime?.() || 0;
    if (current > 3) {
      player.seekTo(0, true);
      return;
    }
    const nextIndex = (trackIndexRef.current - 1 + bioPlaylist.length) % bioPlaylist.length;
    playTrack(nextIndex);
  }, [playTrack]);

  useEffect(() => {
    let cancelled = false;

    loadYoutubeIframeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current || playerRef.current) return;

        playerRef.current = new YT.Player(hostRef.current, {
          videoId: bioPlaylist[0].id,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            loop: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              const player = event.target;
              player.setVolume(72);
              player.unMute();
              player.playVideo();
              syncTrackMeta(player);
              refreshProgress();
              setReady(true);
              setIsPlaying(true);
              setIsMuted(false);
            },
            onStateChange: (event) => {
              if (event.data === PLAYER_STATE.PLAYING) {
                setIsPlaying(true);
                syncTrackMeta(event.target);
                refreshProgress();
              }
              if (event.data === PLAYER_STATE.PAUSED) {
                setIsPlaying(false);
              }
              if (event.data === PLAYER_STATE.ENDED) {
                playNextRef.current();
              }
            },
          },
        });
      })
      .catch(() => {
        setReady(false);
      });

    return () => {
      cancelled = true;
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [refreshProgress, syncTrackMeta]);

  useEffect(() => {
    if (!ready) return undefined;

    progressTimerRef.current = window.setInterval(refreshProgress, 400);
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [ready, refreshProgress]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
      return;
    }

    player.playVideo();
    if (!isMuted) player.unMute();
    setIsPlaying(true);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 72);
      setIsMuted(false);
      return;
    }

    player.mute();
    setIsMuted(true);
  };

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    const player = playerRef.current;
    if (!player) return;

    player.setVolume(nextVolume);
    if (nextVolume === 0) {
      player.mute();
      setIsMuted(true);
      return;
    }

    player.unMute();
    setIsMuted(false);
  };

  const handleSeek = (event) => {
    const player = playerRef.current;
    if (!player || !duration) return;

    const nextProgress = Number(event.target.value);
    const nextTime = (nextProgress / 100) * duration;
    player.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  return (
    <>
      <div className={styles.videoLayer} aria-hidden="true">
        <div ref={hostRef} className={styles.videoHost} />
      </div>

      <div className={styles.playerDock}>
        {playlistOpen ? (
          <div className={styles.playlistPanel}>
            <div className={styles.playlistPanelHead}>
              <strong>Playlist</strong>
              <span>{bioPlaylist.length} tracks</span>
            </div>
            <ul className={styles.playlistList}>
              {bioPlaylist.map((track, index) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className={`${styles.playlistItem}${index === trackIndex ? ` ${styles.playlistItemActive}` : ""}`}
                    onClick={() => {
                      playTrack(index);
                      setPlaylistOpen(false);
                    }}
                  >
                    <img src={getBioTrackThumbnail(track.id)} alt="" />
                    <span className={styles.playlistItemMeta}>
                      <strong>{index === trackIndex ? trackTitle : track.title}</strong>
                      <small>{index === trackIndex ? trackArtist : "YouTube"}</small>
                    </span>
                    <span className={styles.playlistItemIndex}>{index + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.playerBar}>
          <div className={styles.playerTrack}>
            <img
              className={styles.playerArt}
              src={getBioTrackThumbnail(currentTrack.id)}
              alt=""
            />
            <div className={styles.playerMeta}>
              <span className={styles.playerLabel}>Now playing</span>
              <strong className={styles.playerTitle}>{trackTitle}</strong>
              <span className={styles.playerArtist}>{trackArtist}</span>
            </div>
          </div>

          <div className={styles.playerCenter}>
            <div className={styles.playerTransport}>
              <button type="button" className={styles.playerIconBtn} onClick={playPrevious} aria-label="Previous track">
                <SkipBack size={16} />
              </button>
              <button type="button" className={styles.playerPlayBtn} onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button type="button" className={styles.playerIconBtn} onClick={playNext} aria-label="Next track">
                <SkipForward size={16} />
              </button>
            </div>

            <div className={styles.playerTimeline}>
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={handleSeek}
                className={styles.playerProgress}
                aria-label="Seek"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.playerRight}>
            <button
              type="button"
              className={`${styles.playerIconBtn} ${playlistOpen ? styles.playerIconBtnActive : ""}`}
              onClick={() => setPlaylistOpen((open) => !open)}
              aria-expanded={playlistOpen}
              aria-label="Toggle playlist"
            >
              <ListMusic size={16} />
            </button>

            <div className={styles.playerVolume}>
              <button type="button" className={styles.playerIconBtn} onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.playerVolumeRange}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
