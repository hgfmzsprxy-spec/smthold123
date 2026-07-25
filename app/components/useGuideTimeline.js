"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdminPage.module.css";

/** Shared stepper timeline: filled segments between steps + dashed fade to continue footer. */
export default function useGuideTimeline({
  scrollRootRef,
  stepCount,
  onLineProgress,
  setActiveStep,
  continueRef,
}) {
  const timelineRef = useRef(null);
  const stepRefs = useRef([]);
  const [lineProgress, setLineProgress] = useState(0);
  const [trackSegments, setTrackSegments] = useState([]);
  const [fadeTrack, setFadeTrack] = useState(null);

  useEffect(() => {
    const root = scrollRootRef?.current;
    if (!root || stepCount < 2) return undefined;

    function getIndexes() {
      return Array.from({ length: stepCount }, (_, i) =>
        stepRefs.current[i]?.querySelector("[data-step-index]")
      ).filter(Boolean);
    }

    function buildSegments(progress) {
      const timeline = timelineRef.current;
      const indexes = getIndexes();
      if (!timeline || indexes.length < 2) return;

      const timelineRect = timeline.getBoundingClientRect();
      const lineWidth = 2;
      const raw = [];

      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        const top = a.bottom - timelineRect.top;
        const height = Math.max(1, b.top - a.bottom);
        const left = a.left + a.width / 2 - timelineRect.left - lineWidth / 2;
        raw.push({ top: Math.max(0, top), height, left: Math.max(0, left) });
      }

      const total = raw.reduce((sum, seg) => sum + seg.height, 0) || 1;
      let remaining = Math.max(0, Math.min(1, progress)) * total;

      setTrackSegments(
        raw.map((seg) => {
          const fillPx = Math.max(0, Math.min(seg.height, remaining));
          remaining -= fillPx;
          return { ...seg, fillPx };
        })
      );

      const last = indexes[indexes.length - 1];
      const lastRect = last.getBoundingClientRect();
      const left = Math.max(
        0,
        lastRect.left + lastRect.width / 2 - timelineRect.left - lineWidth / 2
      );
      const continueNode =
        continueRef?.current?.querySelector(`.${styles.guideContinueRule}`) ||
        continueRef?.current;
      if (continueNode) {
        const continueRect = continueNode.getBoundingClientRect();
        const fadeTop = lastRect.bottom - timelineRect.top;
        const fadeBottom = continueRect.top - timelineRect.top;
        setFadeTrack({
          top: Math.max(0, fadeTop),
          height: Math.max(1, fadeBottom - fadeTop),
          left,
        });
      } else {
        setFadeTrack(null);
      }
    }

    function updateStepper() {
      const indexes = getIndexes();
      if (indexes.length < 2) return;

      const rootRect = root.getBoundingClientRect();
      const focusY = rootRect.top + rootRect.height * 0.36;

      let gapTotal = 0;
      const gapEnds = [];
      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        gapTotal += Math.max(1, b.top - a.bottom);
        gapEnds.push(gapTotal);
      }
      gapTotal = Math.max(1, gapTotal);

      const maxScroll = root.scrollHeight - root.clientHeight;
      const scrollRatio = maxScroll <= 0 ? 1 : root.scrollTop / maxScroll;
      const atBottom = maxScroll <= 0 || root.scrollTop >= maxScroll - 32;

      let traveled = 0;
      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        const segStart = a.bottom;
        const segEnd = b.top;
        const segLen = Math.max(1, segEnd - segStart);
        if (focusY <= segStart) break;
        if (focusY >= segEnd) traveled += segLen;
        else {
          traveled += focusY - segStart;
          break;
        }
      }

      let progress = traveled / gapTotal;
      progress = Math.max(progress, scrollRatio);
      if (atBottom) progress = 1;
      progress = Math.max(0, Math.min(1, progress));

      setLineProgress(progress);
      onLineProgress?.(progress);

      let nextStep = 1;
      for (let i = 0; i < gapEnds.length; i += 1) {
        if (progress >= gapEnds[i] / gapTotal - 0.01) nextStep = i + 2;
      }
      if (atBottom || progress >= 0.99) nextStep = indexes.length;
      setActiveStep((current) => (current === nextStep ? current : nextStep));
      buildSegments(progress);
    }

    updateStepper();
    root.addEventListener("scroll", updateStepper, { passive: true });
    window.addEventListener("resize", updateStepper);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateStepper) : null;
    if (timelineRef.current) resizeObserver?.observe(timelineRef.current);
    return () => {
      root.removeEventListener("scroll", updateStepper);
      window.removeEventListener("resize", updateStepper);
      resizeObserver?.disconnect();
    };
  }, [scrollRootRef, stepCount, onLineProgress, setActiveStep, continueRef]);

  function scrollToStep(step) {
    const target = stepRefs.current[step - 1];
    const root = scrollRootRef?.current;
    if (!target || !root) return;
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - 28;
    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }

  function setStepRef(index, node) {
    stepRefs.current[index] = node;
  }

  return { timelineRef, setStepRef, lineProgress, trackSegments, fadeTrack, scrollToStep };
}
