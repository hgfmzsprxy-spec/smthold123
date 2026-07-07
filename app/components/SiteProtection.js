"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEVTOOLS_SIZE_THRESHOLD = 140;
const DEVTOOLS_POLL_MS = 750;

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

  if (key === "F12") return true;
  if (ctrlOrMeta && shift && (key === "I" || key === "J" || key === "C" || key === "K")) return true;
  if (ctrlOrMeta && (key === "U" || key === "S" || key === "P")) return true;
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

export default function SiteProtection() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return undefined;
    if (pathname?.startsWith("/admin")) return undefined;

    document.body.classList.add("site-protected");

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
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    }

    function handleKeyDown(event) {
      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleDevToolsDetected() {
      redirectOnDevTools();
    }

    let devToolsTriggered = false;

    function pollDevTools() {
      if (devToolsTriggered) return;
      if (!isDevToolsOpen()) return;

      devToolsTriggered = true;
      handleDevToolsDetected();
    }

    const pollId = window.setInterval(pollDevTools, DEVTOOLS_POLL_MS);
    window.addEventListener("resize", pollDevTools);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown, true);

    pollDevTools();

    return () => {
      document.body.classList.remove("site-protected");
      window.clearInterval(pollId);
      window.removeEventListener("resize", pollDevTools);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [pathname]);

  return null;
}
