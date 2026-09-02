export const BIO_AUTOPLAY_GESTURE_KEY = "bio-youtube-user-gesture";
export const BIO_AUTOPLAY_GESTURE_MAX_AGE_MS = 120000;

let lastBioAutoplayGestureAt = 0;
let pageAudioUnlocked = false;

function readStoredGestureAge() {
  try {
    const raw = sessionStorage.getItem(BIO_AUTOPLAY_GESTURE_KEY);
    if (!raw) return null;

    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return null;

    const age = Date.now() - timestamp;
    if (age < 0 || age > BIO_AUTOPLAY_GESTURE_MAX_AGE_MS) return null;

    return age;
  } catch {
    return null;
  }
}

export function markBioAutoplayGesture() {
  const timestamp = Date.now();
  lastBioAutoplayGestureAt = timestamp;

  try {
    sessionStorage.setItem(BIO_AUTOPLAY_GESTURE_KEY, String(timestamp));
  } catch {
    // Ignore storage failures in private mode.
  }
}

export function unlockBioPageAudio() {
  markBioAutoplayGesture();

  if (!hasActiveUserActivation()) {
    return;
  }

  if (pageAudioUnlocked || typeof window === "undefined") return;

  pageAudioUnlocked = true;

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      const context = new AudioContextCtor();
      void context.resume().catch(() => {
        // Ignore audio unlock failures.
      });
    }
  } catch {
    // Ignore audio unlock failures.
  }
}

export function peekBioAutoplayGesture(maxAgeMs = BIO_AUTOPLAY_GESTURE_MAX_AGE_MS) {
  if (hasActiveUserActivation()) return true;
  if (pageAudioUnlocked) return true;

  const now = Date.now();
  if (lastBioAutoplayGestureAt && now - lastBioAutoplayGestureAt <= maxAgeMs) {
    return true;
  }

  const storedAge = readStoredGestureAge();
  if (storedAge !== null && storedAge <= maxAgeMs) {
    return true;
  }

  return false;
}

export function clearBioAutoplayGesture() {
  lastBioAutoplayGestureAt = 0;

  try {
    sessionStorage.removeItem(BIO_AUTOPLAY_GESTURE_KEY);
  } catch {
    // Ignore storage failures in private mode.
  }
}

export function isBioHref(href) {
  if (!href) return false;

  try {
    const url = new URL(href, window.location.origin);
    return url.pathname === "/bio" || url.pathname === "/bio/";
  } catch {
    return href === "/bio" || href.endsWith("/bio");
  }
}

export function hasActiveUserActivation() {
  try {
    return Boolean(navigator.userActivation?.isActive);
  } catch {
    return false;
  }
}

export function canStartBioAudioWithAutoplay() {
  return peekBioAutoplayGesture();
}
