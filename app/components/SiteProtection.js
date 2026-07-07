"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { runAccessChecks, setAccessCookie } from "../../lib/site-access";

const DEVTOOLS_SIZE_THRESHOLD = 160;
const DEVTOOLS_POLL_MS = 500;
const DEVTOOLS_CONFIRM_COUNT = 3;

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

  return isIOS || isAndroid || isSafari;
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

function isBlockedShortcut(event) {
  if (isFormField(event.target)) return false;

  const key = event.key.toUpperCase();
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

function isDevToolsOpen() {
  if (typeof window === "undefined") return false;

  const widthGap = window.outerWidth - window.innerWidth;
  const heightGap = window.outerHeight - window.innerHeight;

  return widthGap > DEVTOOLS_SIZE_THRESHOLD || heightGap > DEVTOOLS_SIZE_THRESHOLD;
}

function redirectOnDevTools() {
  const referrer = document.referrer;
  const sameOriginReferrer =
    referrer && new URL(referrer, window.location.origin).origin === window.location.origin;

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  if (sameOriginReferrer) {
    window.location.replace(referrer);
    return;
  }

  if (referrer) {
    window.location.replace(referrer);
    return;
  }

  window.location.replace("/");
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

  useEffect(() => {
    if (!isProtectionEnabled()) return undefined;
    if (pathname?.startsWith("/admin") || pathname === "/site-access") return undefined;

    let devToolsTriggered = false;
    let devToolsPositiveCount = 0;

    function pollDevTools() {
      if (devToolsTriggered || !canReliablyDetectDevTools()) return;

      if (!isDevToolsOpen()) {
        devToolsPositiveCount = 0;
        return;
      }

      devToolsPositiveCount += 1;
      if (devToolsPositiveCount < DEVTOOLS_CONFIRM_COUNT) return;

      devToolsTriggered = true;
      redirectOnDevTools();
    }

    document.body.classList.add("site-protected");
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
      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleVisibilityLeak() {
      if (document.hidden) return;
      pollDevTools();
    }

    let pollId;
    const devToolsPollingEnabled = canReliablyDetectDevTools();
    if (devToolsPollingEnabled) {
      pollId = window.setInterval(pollDevTools, DEVTOOLS_POLL_MS);
      window.addEventListener("resize", pollDevTools);
      document.addEventListener("visibilitychange", handleVisibilityLeak);
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
        window.removeEventListener("resize", pollDevTools);
        document.removeEventListener("visibilitychange", handleVisibilityLeak);
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
