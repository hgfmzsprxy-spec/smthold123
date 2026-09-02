"use client";

import useBassLevel from "../hooks/useBassLevel";
import styles from "./BioBassEqualizer.module.css";

export default function BioBassEqualizer({ audioRef, ready = false, active = true }) {
  const level = useBassLevel(audioRef, { ready, active });
  const scale = 0.1 + Math.pow(Math.max(0.08, level), 0.82) * 0.9;
  const opacity = 0.38 + scale * 0.62;

  return (
    <div className={styles.equalizer} aria-hidden="true">
      <div className={styles.bar}>
        <span
          className={styles.barFill}
          style={{
            transform: `scaleY(${scale})`,
            opacity,
          }}
        />
      </div>
    </div>
  );
}
