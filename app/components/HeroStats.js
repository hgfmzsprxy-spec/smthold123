"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const heroStatsBase = [
  { value: "1542", label: "Purchases", icon: SolidCartIcon },
  { key: "reviews", label: "Reviews", icon: SolidReviewIcon },
  { key: "rating", label: "Our Rating", icon: SolidStarIcon, iconSize: 40 },
  { value: "72", label: "Online Users", icon: SolidUsersIcon },
];

function SolidCartIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.62 3.15a1.05 1.05 0 0 0 0 2.1h1.31l1.69 8.49a3.4 3.4 0 0 0 3.33 2.73h6.58a3.4 3.4 0 0 0 3.22-2.31l1.03-3.05a2.74 2.74 0 0 0-2.6-3.61H7.28l-.47-2.35a2.5 2.5 0 0 0-2.45-2H3.62Z"
      />
      <path fill="#fff" d="M9.15 10.05h8.96l-.66 1.98a1.2 1.2 0 0 1-1.14.82H9.85a1.2 1.2 0 0 1-1.18-.96l-.37-1.84h.85Z" opacity=".2" />
      <path
        fill="currentColor"
        d="M9.18 21a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm7.95 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
      />
    </svg>
  );
}

function SolidReviewIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.7 20.2 5.6v5.84c0 4.84-3.28 8.63-8.2 9.86-4.92-1.23-8.2-5.02-8.2-9.86V5.6L12 2.7Z"
      />
      <path
        fill="#fff"
        d="m10.92 14.72 5.02-5.02a1.08 1.08 0 0 0-1.53-1.53l-3.72 3.72-1.28-1.28a1.08 1.08 0 0 0-1.53 1.53l2.04 2.04c.3.3.7.48 1 .54Z"
        opacity=".88"
      />
    </svg>
  );
}

function SolidStarIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.35 14.76 8.1l6.34.92-4.58 4.47 1.08 6.31L12 16.78l-5.6 2.94 1.08-6.31L2.9 9.02l6.34-.92L12 2.35Z"
      />
      <path
        fill="#fff"
        d="m9.35 14.95 4.65-2.44-1.01-5.9L12 8.62l-.99-2.01-1.01 5.9 4.65 2.44-3.65.53-.65 3.47-.65-3.47-3.65-.53Z"
        opacity=".18"
      />
    </svg>
  );
}

function SolidUsersIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 12.15a4.05 4.05 0 1 0 0-8.1 4.05 4.05 0 0 0 0 8.1Z" />
      <path
        fill="currentColor"
        d="M4.32 20.08c.58-3.62 3.64-6.38 7.68-6.38s7.1 2.76 7.68 6.38c.1.62-.38 1.17-1.01 1.17H5.33c-.63 0-1.11-.55-1.01-1.17Z"
      />
      <path
        fill="currentColor"
        d="M18.05 12.2a2.92 2.92 0 1 0-1.74-5.26 5.58 5.58 0 0 1-.42 4.7c.62.36 1.36.56 2.16.56Zm-12.1 0c.8 0 1.54-.2 2.16-.56a5.58 5.58 0 0 1-.42-4.7 2.92 2.92 0 1 0-1.74 5.26Z"
        opacity=".48"
      />
      <circle cx="18.8" cy="5.25" r="2.15" fill="#29ff91" />
      <circle cx="18.8" cy="5.25" r=".85" fill="#07130d" opacity=".35" />
    </svg>
  );
}

function getRevealDelayMs(node) {
  const cssDelay = getComputedStyle(node).getPropertyValue("--reveal-delay").trim();
  if (cssDelay.endsWith("ms")) {
    return Number.parseFloat(cssDelay);
  }

  if (cssDelay.endsWith("s")) {
    return Number.parseFloat(cssDelay) * 1000;
  }

  const group = node.closest("[data-reveal-group]");
  return Number(group?.getAttribute("data-reveal-base") || 0);
}

function HeroStatItem({ stat, value }) {
  const itemRef = useRef(null);
  const decimals = stat.key === "rating" ? 2 : 0;
  const target = useMemo(() => {
    const parsed = Number.parseFloat(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [value]);
  const [display, setDisplay] = useState(() => (decimals > 0 ? "0.00" : "0"));
  const Icon = stat.icon;

  useEffect(() => {
    const node = itemRef.current;
    if (!node) return undefined;

    let frame = 0;
    let revealTimer = 0;
    let started = false;

    function runCountUp() {
      if (started) return;
      started = true;

      const prefersReducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setDisplay(decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)));
        return;
      }

      const durationMs = 2000;
      let startTime = 0;

      setDisplay(decimals > 0 ? "0.00" : "0");

      function tick(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = target * eased;

        setDisplay(decimals > 0 ? currentValue.toFixed(decimals) : String(Math.round(currentValue)));

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplay(decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)));
        }
      }

      frame = requestAnimationFrame(tick);
    }

    function scheduleCountUp() {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(runCountUp, getRevealDelayMs(node));
    }

    if (node.classList.contains("is-visible")) {
      scheduleCountUp();
    } else {
      const mutation = new MutationObserver(() => {
        if (!node.classList.contains("is-visible")) return;
        mutation.disconnect();
        scheduleCountUp();
      });

      mutation.observe(node, { attributes: true, attributeFilter: ["class"] });

      const fallback = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          fallback.disconnect();
          mutation.disconnect();
          scheduleCountUp();
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      fallback.observe(node);

      return () => {
        mutation.disconnect();
        fallback.disconnect();
        window.clearTimeout(revealTimer);
        cancelAnimationFrame(frame);
      };
    }

    return () => {
      window.clearTimeout(revealTimer);
      cancelAnimationFrame(frame);
    };
  }, [decimals, target]);

  return (
    <div className="hero-stat-item" ref={itemRef}>
      <div className="hero-stat-icon">
        <Icon size={stat.iconSize || 34} />
      </div>
      <div>
        <strong className="hero-stat-value">{display}</strong>
        <span>{stat.label}</span>
      </div>
    </div>
  );
}

export default function HeroStats({ reviewCount = 0, averageRating = null, className = "" }) {
  const heroStats = useMemo(
    () =>
      heroStatsBase.map((stat) => {
        if (stat.key === "reviews") {
          return { ...stat, value: reviewCount > 0 ? String(reviewCount) : "0" };
        }

        if (stat.key === "rating") {
          return { ...stat, value: averageRating || "0.00" };
        }

        return stat;
      }),
    [reviewCount, averageRating]
  );

  return (
    <section className={`hero-stats-section ${className}`.trim()} aria-label="phantom-cheats.com stats">
      <div className={className ? undefined : "container"}>
        <div className="hero-stats-panel" data-reveal-group data-reveal-base="70">
          {heroStats.map((stat) => (
            <HeroStatItem key={stat.label} stat={stat} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
