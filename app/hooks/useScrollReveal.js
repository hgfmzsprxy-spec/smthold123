"use client";

import { useEffect } from "react";

export const revealSelector = [
  "[data-reveal]",
  ".fade-up",
  ".game-banner-card",
  ".best-product-card",
  ".why-choose-card",
  ".purchase-item",
  ".hero-stat-item",
  ".package-card",
  ".product-card",
  ".rank-card",
  ".requirement-card",
  ".product-feature-card",
  ".cart-row",
  ".cart-summary-card",
  ".features-legend > div",
  ".review-card-reveal",
  ".reviews-pagination-arrow",
  ".reviews-pagination-page",
  ".reviews-pagination-ellipsis",
].join(",");

export default function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const observed = new WeakSet();
    let frame = 0;
    let lastScrollY = window.scrollY;
    let scrollingUp = false;

    const isCoarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none), (max-width: 767px)").matches;

    if (isCoarsePointer) {
      root.classList.remove("reveal-enabled");
      document.querySelectorAll(revealSelector).forEach((node) => {
        node.classList.add("is-visible");
        node.style.removeProperty("--reveal-delay");
      });
      return undefined;
    }

    root.classList.add("reveal-enabled");

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(revealSelector).forEach((node) => node.classList.add("is-visible"));
      return () => root.classList.remove("reveal-enabled");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (scrollingUp) {
              entry.target.classList.add("reveal-instant");
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);

            if (scrollingUp) {
              requestAnimationFrame(() => entry.target.classList.remove("reveal-instant"));
            }
          }
        });
      },
      {
        threshold: isCoarsePointer ? 0.01 : 0.12,
        rootMargin: isCoarsePointer ? "0px 0px 0px 0px" : "0px 0px -8% 0px",
      }
    );

    function updateScrollDirection() {
      const nextScrollY = window.scrollY;
      scrollingUp = nextScrollY < lastScrollY;
      lastScrollY = nextScrollY;
    }

    function applyGroupDelays() {
      document.querySelectorAll("[data-reveal-group]").forEach((group) => {
        const base = Number(group.getAttribute("data-reveal-base") || 0);
        const step = Number(group.getAttribute("data-reveal-step") || 95);

        group.querySelectorAll(revealSelector).forEach((item, index) => {
          item.style.setProperty("--reveal-delay", `${Math.min(base + index * step, 720)}ms`);
        });
      });
    }

    function collect() {
      applyGroupDelays();

      document.querySelectorAll(revealSelector).forEach((node) => {
        if (!observed.has(node) && !node.classList.contains("is-visible")) {
          observed.add(node);
          observer.observe(node);
        }
      });
    }

    function scheduleCollect() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(collect);
    }

    scheduleCollect();
    window.addEventListener("scroll", updateScrollDirection, { passive: true });

    const mutationObserver = new MutationObserver(scheduleCollect);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(revealSelector).forEach((node) => {
        if (!node.classList.contains("is-visible")) {
          node.classList.add("reveal-instant", "is-visible");
        }
      });
    }, isCoarsePointer ? 900 : 2500);

    return () => {
      window.clearTimeout(failsafe);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollDirection);
      mutationObserver.disconnect();
      observer.disconnect();
      root.classList.remove("reveal-enabled");
    };
  }, []);
}
