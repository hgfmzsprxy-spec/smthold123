export const BIO_AUDIO_PRIME_EVENT = "bio-background-audio-prime";

let ambientVideo = null;

export function getBioBackgroundVideo() {
  if (typeof document === "undefined") return null;

  if (!ambientVideo) {
    ambientVideo = document.createElement("video");
    ambientVideo.loop = true;
    ambientVideo.playsInline = true;
    ambientVideo.preload = "auto";
    ambientVideo.setAttribute("playsinline", "");
    ambientVideo.setAttribute("webkit-playsinline", "");
  }

  return ambientVideo;
}

export function primeBioBackgroundAudioSync(src, volume = 1) {
  const video = getBioBackgroundVideo();
  if (!video) return false;

  if (!video.isConnected) {
    video.style.cssText =
      "position:fixed;width:0;height:0;opacity:0;pointer-events:none;z-index:-1;border:0";
    document.body.appendChild(video);
  }

  if (video.getAttribute("src") !== src && video.src !== new URL(src, window.location.origin).href) {
    video.src = src;
  }

  const nextVolume = Math.min(1, Math.max(0, Number(volume) || 0));
  video.volume = nextVolume;
  video.muted = nextVolume === 0;

  try {
    const playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {
        video.muted = true;
        void video.play().catch(() => {});
      });
    }
    return !video.muted;
  } catch {
    video.muted = true;
    void video.play().catch(() => {});
    return false;
  }
}

export function mountBioBackgroundVideo(container, className = "") {
  const video = getBioBackgroundVideo();
  if (!video || !container) return null;

  if (className) {
    video.className = className;
  }

  video.removeAttribute("style");

  if (video.parentElement !== container) {
    container.appendChild(video);
  }

  return video;
}

export function isBioBackgroundAudioPrimed() {
  return Boolean(ambientVideo && !ambientVideo.paused && !ambientVideo.muted && ambientVideo.volume > 0);
}

export function dispatchBioAudioPrimeEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BIO_AUDIO_PRIME_EVENT));
}
