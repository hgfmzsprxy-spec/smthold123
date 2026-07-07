"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEVTOOLS_SIZE_THRESHOLD = 140;
const DEVTOOLS_POLL_MS = 750;

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

  if (key === "F12" || key === "F7") return true;
  if (ctrlOrMeta && shift && (key === "I" || key === "J" || key === "C" || key === "K" || key === "S" || key === "U")) {
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
    if (process.env.NODE_ENV !== "production") return undefined;
    if (pathname?.startsWith("/admin") || pathname === "/site-access") return undefined;

    document.body.classList.add("site-protected");
    blockScraperReferrer();
    breakOutOfIframe();

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

    let devToolsTriggered = false;

    function pollDevTools() {
      if (devToolsTriggered) return;
      if (!isDevToolsOpen()) return;

      devToolsTriggered = true;
      redirectOnDevTools();
    }

    const pollId = window.setInterval(pollDevTools, DEVTOOLS_POLL_MS);
    window.addEventListener("resize", pollDevTools);
    document.addEventListener("visibilitychange", handleVisibilityLeak);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("keydown", handleKeyDown, true);

    pollDevTools();

    return () => {
      document.body.classList.remove("site-protected");
      window.clearInterval(pollId);
      window.removeEventListener("resize", pollDevTools);
      document.removeEventListener("visibilitychange", handleVisibilityLeak);
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
