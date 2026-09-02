"use client";

import { useEffect, useRef, useState } from "react";

function getBassLevel(frequencyData) {
  if (!frequencyData.length) return 0;

  const bassBins = frequencyData.slice(1, 14);
  const average = bassBins.reduce((total, value) => total + value, 0) / bassBins.length;
  return Math.min(1, Math.pow(average / 255, 0.72) * 1.8);
}

function getSimulatedBass(phase) {
  const kick = Math.max(0, Math.sin(phase * 3.8));
  const groove = Math.max(0, Math.sin(phase * 1.55) * 0.42 + Math.sin(phase * 2.35) * 0.28);
  const accent = Math.max(0, Math.sin(phase * 7.2)) * 0.22;
  return Math.min(1, 0.16 + kick * 0.52 + groove * 0.24 + accent * 0.18);
}

function getOrCreateAudioGraph(audio) {
  if (!audio) return null;

  if (audio.__bassGraph) {
    return audio.__bassGraph;
  }

  try {
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.78;
    gainNode.gain.value = 0;
    sourceNode.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audio.__bassGraph = {
      audioContext,
      analyser,
      frequencyData: new Uint8Array(analyser.frequencyBinCount),
    };

    return audio.__bassGraph;
  } catch {
    return null;
  }
}

export default function useBassLevel(audioRef, { ready = false, active = true } = {}) {
  const [level, setLevel] = useState(0.12);
  const levelRef = useRef(0.12);

  useEffect(() => {
    let frame = 0;
    let phase = Math.random() * Math.PI * 2;

    function tick() {
      let target = 0.12;

      if (active) {
        const audio = audioRef.current;
        const graph = ready ? getOrCreateAudioGraph(audio) : null;
        let usedRealAudio = false;

        if (graph && audio && !audio.paused && audio.readyState >= 2) {
          if (graph.audioContext.state === "suspended") {
            graph.audioContext.resume().catch(() => {});
          }

          graph.analyser.getByteFrequencyData(graph.frequencyData);
          const bass = getBassLevel(graph.frequencyData);

          if (bass > 0.14) {
            target = bass;
            usedRealAudio = true;
          }
        }

        if (!usedRealAudio) {
          phase += 0.024;
          target = getSimulatedBass(phase);
        }
      }

      levelRef.current += (target - levelRef.current) * 0.34;
      setLevel(levelRef.current);
      frame = window.requestAnimationFrame(tick);
    }

    const resumeOnGesture = () => {
      const audio = audioRef.current;
      const graph = getOrCreateAudioGraph(audio);
      graph?.audioContext.resume().catch(() => {});
      audio?.play().catch(() => {});
    };

    window.addEventListener("pointerdown", resumeOnGesture);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", resumeOnGesture);
    };
  }, [active, audioRef, ready]);

  return level;
}
