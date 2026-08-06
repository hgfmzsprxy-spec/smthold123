"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { runAccessChecks, setAccessCookie } from "../../lib/site-access";

const DEVTOOLS_SIZE_THRESHOLD = 160;
const DEVTOOLS_POLL_MS = 400;
const DEVTOOLS_CONFIRM_COUNT = 2;
const ZOOM_GRACE_MS = 3500;
const LAYOUT_GRACE_MS = 2500;
const PREVIOUS_URL_KEY = "site-protection-previous-url";
const ENTRY_REFERRER_KEY = "site-protection-entry-referrer";

function getViewportGaps() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: Math.max(0, window.outerWidth - window.innerWidth),
    height: Math.max(0, window.outerHeight - window.innerHeight),
  };
}

function isVisualZoomActive() {
  if (typeof window === "undefined" || !window.visualViewport) return false;
  return Math.abs((window.visualViewport.scale || 1) - 1) > 0.02;
}

function hasLargeViewportGap(gaps) {
  if (gaps.width >= DEVTOOLS_SIZE_THRESHOLD && gaps.width > gaps.height + 60) {
    return true;
  }

  if (gaps.height >= DEVTOOLS_SIZE_THRESHOLD + 60 && gaps.height > gaps.width + 60) {
    return true;
  }

  return false;
}

function looksLikeBrowserZoom(baselineGaps) {
  if (isVisualZoomActive()) return true;

  const gaps = getViewportGaps();
  if (hasLargeViewportGap(gaps)) return false;

  const widthDelta = gaps.width - baselineGaps.width;
  const heightDelta = gaps.height - baselineGaps.height;

  if (widthDelta > 0 && heightDelta > 0) return true;
  if (widthDelta > 0 && widthDelta < DEVTOOLS_SIZE_THRESHOLD) return true;
  if (heightDelta > 0 && heightDelta < DEVTOOLS_SIZE_THRESHOLD) return true;

  return false;
}

function isDevToolsDockOpen(baselineGaps) {
  const gaps = getViewportGaps();
  const widthDelta = gaps.width - baselineGaps.width;
  const heightDelta = gaps.height - baselineGaps.height;

  if (widthDelta >= DEVTOOLS_SIZE_THRESHOLD && widthDelta > heightDelta + 60) {
    return true;
  }

  if (heightDelta >= DEVTOOLS_SIZE_THRESHOLD + 60 && heightDelta > widthDelta + 60) {
    return true;
  }

  return hasLargeViewportGap(gaps);
}

function isProtectionEnabled() {
  return process.env.NEXT_PUBLIC_DISABLE_SITE_PROTECTION !== "true";
}

function isMobileOrUnreliableDevToolsEnvironment() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrom(e|ium)|CriOS|Edg|OPR|FxiOS/i.test(ua);
  const isCoarseTouch =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 1024px)").matches;

  return isIOS || isAndroid || isSafari || isCoarseTouch;
}

function canReliablyDetectDevTools() {
  return !isMobileOrUnreliableDevToolsEnvironment();
}

const SCRAPER_HOST_PATTERN =
  /saveweb2zip|webtozip|website-ripper|httrack|sitesucker|teleport|webcopy|archive\.org/i;

function isFormField(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function isBlockedDevToolsShortcut(event) {
  const key = String(event.key || "").toUpperCase();
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;

  if (!key) return event.keyCode === 123;
  if (key === "F12") return true;
  if (ctrlOrMeta && shift && (key === "I" || key === "J" || key === "C")) return true;
  if (event.keyCode === 123) return true;

  return false;
}

function isBlockedShortcut(event) {
  if (isFormField(event.target)) return false;

  const key = String(event.key || "").toUpperCase();
  if (!key) return event.keyCode === 123;

  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  if (key === "F12" || key === "F7" || key === "F8") return true;
  if (ctrlOrMeta && shift && (key === "I" || key === "J" || key === "C" || key === "K" || key === "S" || key === "U" || key === "E")) {
    return true;
  }
  if (ctrlOrMeta && (key === "U" || key === "S" || key === "P" || key === "A")) return true;
  if (alt && (key === "I" || key === "J" || key === "C")) return true;
  if (event.keyCode === 123) return true;

  return false;
}

function isDevToolsOpen(baselineGaps) {
  if (typeof window === "undefined") return false;
  return isDevToolsDockOpen(baselineGaps);
}

function getPreviousPageUrl() {
  const current = window.location.href;
  const candidates = [];

  try {
    const storedPrevious = sessionStorage.getItem(PREVIOUS_URL_KEY);
    if (storedPrevious) candidates.push(storedPrevious);
  } catch {
    // Ignore storage failures.
  }

  if (document.referrer) {
    candidates.push(document.referrer);
  }

  try {
    const entryReferrer = sessionStorage.getItem(ENTRY_REFERRER_KEY);
    if (entryReferrer) candidates.push(entryReferrer);
  } catch {
    // Ignore storage failures.
  }

  for (const raw of candidates) {
    try {
      const url = new URL(raw, window.location.origin);
      if (url.href !== current) {
        return url.href;
      }
    } catch {
      // Ignore invalid URLs.
    }
  }

  return null;
}

function redirectOnDevTools() {
  const previousPage = getPreviousPageUrl();

  if (previousPage) {
    window.location.replace(previousPage);
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.replace("/");
}

function rememberEntryReferrer() {
  if (typeof window === "undefined" || !document.referrer) return;

  try {
    if (!sessionStorage.getItem(ENTRY_REFERRER_KEY)) {
      sessionStorage.setItem(ENTRY_REFERRER_KEY, document.referrer);
    }
  } catch {
    // Ignore storage failures.
  }
}

function blockScraperReferrer() {
  if (typeof document === "undefined") return;

  const referrer = document.referrer || "";
  if (!referrer || !SCRAPER_HOST_PATTERN.test(referrer)) return;

  redirectOnDevTools();
}

function breakOutOfIframe() {
  try {
    if (window.self !== window.top) {
      window.top.location = window.location.href;
    }
  } catch {
    document.body.innerHTML = "";
  }
}

export default function SiteProtection() {
  const pathname = usePathname();
  const currentUrlRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextUrl = `${window.location.origin}${pathname || ""}${window.location.search}`;
    const previousUrl = currentUrlRef.current;

    if (previousUrl && previousUrl !== nextUrl) {
      try {
        sessionStorage.setItem(PREVIOUS_URL_KEY, previousUrl);
      } catch {
        // Ignore storage failures.
      }
    }

    rememberEntryReferrer();
    currentUrlRef.current = nextUrl;
  }, [pathname]);

  useEffect(() => {
    if (!isProtectionEnabled()) return undefined;
    if (pathname === "/site-access") return undefined;

    let devToolsTriggered = false;
    let devToolsPositiveCount = 0;
    let baselineGaps = getViewportGaps();
    let zoomGraceUntil = 0;
    let layoutGraceUntil = 0;

    function markZoomGrace() {
      zoomGraceUntil = Date.now() + ZOOM_GRACE_MS;
      devToolsPositiveCount = 0;
    }

    function markLayoutGrace() {
      layoutGraceUntil = Date.now() + LAYOUT_GRACE_MS;
      devToolsPositiveCount = 0;
    }

    function isGraceActive() {
      const now = Date.now();
      return now < zoomGraceUntil || now < layoutGraceUntil;
    }

    function syncLayoutBaseline() {
      baselineGaps = getViewportGaps();
    }

    function scheduleDevToolsProbe(delayMs = 0) {
      window.setTimeout(() => {
        pollDevTools();
      }, delayMs);
    }

    function pollDevTools() {
      if (devToolsTriggered || !canReliablyDetectDevTools()) return;

      if (document.hidden) {
        devToolsPositiveCount = 0;
        return;
      }

      if (isGraceActive() && !isDevToolsOpen(baselineGaps)) {
        devToolsPositiveCount = 0;
        return;
      }

      if (looksLikeBrowserZoom(baselineGaps)) {
        syncLayoutBaseline();
        devToolsPositiveCount = 0;
        return;
      }

      if (!isDevToolsOpen(baselineGaps)) {
        syncLayoutBaseline();
        devToolsPositiveCount = 0;
        return;
      }

      devToolsPositiveCount += 1;
      if (devToolsPositiveCount < DEVTOOLS_CONFIRM_COUNT) return;

      devToolsTriggered = true;
      redirectOnDevTools();
    }

    function handleResize() {
      if (isDevToolsDockOpen(baselineGaps)) {
        scheduleDevToolsProbe(100);
        scheduleDevToolsProbe(500);
        return;
      }

      markLayoutGrace();

      if (looksLikeBrowserZoom(baselineGaps)) {
        syncLayoutBaseline();
      }
    }

    function handleWindowBlur() {
      scheduleDevToolsProbe(250);
      scheduleDevToolsProbe(700);
    }

    function handleVisualViewportChange() {
      markZoomGrace();
      syncLayoutBaseline();
    }

    function handleOrientationChange() {
      markLayoutGrace();
      syncLayoutBaseline();
    }

    function handleZoomShortcut(event) {
      if (!event.ctrlKey && !event.metaKey) return;

      const key = String(event.key || "");
      if (key === "+" || key === "-" || key === "=" || key === "0" || key === "_" || key === ")") {
        markZoomGrace();
      }
    }

    function handleZoomWheel(event) {
      if (event.ctrlKey) {
        markZoomGrace();
      }
    }

    document.body.classList.add("site-protected");
    rememberEntryReferrer();
    blockScraperReferrer();
    breakOutOfIframe();

    if (runAccessChecks()) {
      setAccessCookie();
    }

    function handleContextMenu(event) {
      if (isFormField(event.target)) return;
      event.preventDefault();
    }

    function handleSelectStart(event) {
      if (isFormField(event.target)) return;
      event.preventDefault();
    }

    function handleCopy(event) {
      if (isFormField(event.target)) return;
      event.preventDefault();
    }

    function handleDragStart(event) {
      event.preventDefault();
    }

    function handleDrop(event) {
      event.preventDefault();
    }

    function handleKeyDown(event) {
      handleZoomShortcut(event);

      if (isBlockedDevToolsShortcut(event)) {
        scheduleDevToolsProbe(500);
        scheduleDevToolsProbe(1200);
      }

      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleVisibilityLeak() {
      if (document.hidden) {
        devToolsPositiveCount = 0;
        return;
      }

      scheduleDevToolsProbe(150);
    }

    let pollId;
    const devToolsPollingEnabled = canReliablyDetectDevTools();
    const visualViewport = window.visualViewport;

    if (devToolsPollingEnabled) {
      pollId = window.setInterval(pollDevTools, DEVTOOLS_POLL_MS);
      window.addEventListener("resize", handleResize);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("orientationchange", handleOrientationChange);
      window.addEventListener("wheel", handleZoomWheel, { passive: true });
      document.addEventListener("visibilitychange", handleVisibilityLeak);
      visualViewport?.addEventListener("resize", handleVisualViewportChange);
      visualViewport?.addEventListener("scroll", handleVisualViewportChange);
      scheduleDevToolsProbe(300);
    }

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.classList.remove("site-protected");
      if (pollId) window.clearInterval(pollId);
      if (devToolsPollingEnabled) {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("blur", handleWindowBlur);
        window.removeEventListener("orientationchange", handleOrientationChange);
        window.removeEventListener("wheel", handleZoomWheel);
        document.removeEventListener("visibilitychange", handleVisibilityLeak);
        visualViewport?.removeEventListener("resize", handleVisualViewportChange);
        visualViewport?.removeEventListener("scroll", handleVisualViewportChange);
      }
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [pathname]);

  return null;
}
