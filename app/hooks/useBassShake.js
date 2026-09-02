"use client";

import { useEffect } from "react";

function getAverage(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function fetchBioAudioStreamUrl(videoId) {
  const endpoints = [
    `https://pipedapi.kavin.rocks/streams/${videoId}`,
    `https://pipedapi.adminforge.de/streams/${videoId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = await response.json();
      const streams = Array.isArray(payload?.audioStreams) ? payload.audioStreams : [];
      const stream = streams.sort((left, right) => (right.bitrate || 0) - (left.bitrate || 0))[0];

      if (stream?.url) {
        return stream.url;
      }
    } catch {
      // Try the next mirror.
    }
  }

  return null;
}

export default function useBassShake({ targetRef, audioRef, enabled, intensity = 1 }) {
  useEffect(() => {
    const target = targetRef.current;
    const audio = audioRef.current;

    if (!target || !enabled) {
      if (target) target.style.removeProperty("transform");
      return undefined;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    let frame = 0;
    let audioContext;
    let analyser;
    let sourceNode;
    let simulatedPhase = 0;
    let lastPulse = 0;
    let frequencyData = new Uint8Array(0);

    function applyShake(strength) {
      const amount = Math.min(10, strength * intensity);
      const x = (Math.random() - 0.5) * amount;
      const y = (Math.random() - 0.5) * amount;
      target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function resetShake() {
      target.style.removeProperty("transform");
    }

    let analyserReady = false;

    function setupAnalyser() {
      if (!audio || analyserReady) return Boolean(analyser);

      try {
        audioContext = new AudioContext();
        sourceNode = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyserReady = true;
        return true;
      } catch {
        return false;
      }
    }

    function tick(timestamp) {
      if (!enabled) {
        resetShake();
        frame = window.requestAnimationFrame(tick);
        return;
      }

      const hasAnalyser = setupAnalyser();

      if (hasAnalyser && analyser && audio && !audio.paused) {
        if (audioContext?.state === "suspended") {
          audioContext.resume().catch(() => {});
        }

        analyser.getByteFrequencyData(frequencyData);
        const bass = getAverage(Array.from(frequencyData.slice(0, 10)));
        const normalized = bass / 255;

        if (normalized > 0.58 && timestamp - lastPulse > 70) {
          applyShake(normalized * 7);
          lastPulse = timestamp;
        } else if (timestamp - lastPulse > 90) {
          resetShake();
        }
      } else if (enabled) {
        simulatedPhase += 0.018;
        const pulse = Math.max(0, Math.sin(simulatedPhase * 4) * 0.65 + Math.sin(simulatedPhase * 1.7) * 0.35);

        if (pulse > 0.82 && timestamp - lastPulse > 110) {
          applyShake(pulse * 4.5);
          lastPulse = timestamp;
        } else if (timestamp - lastPulse > 120) {
          resetShake();
        }
      } else {
        resetShake();
      }

      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      resetShake();
      sourceNode?.disconnect();
      analyser?.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    };
  }, [audioRef, enabled, intensity, targetRef]);
}
