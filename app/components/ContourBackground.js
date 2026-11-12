"use client";

import { useEffect, useRef } from "react";

/**
 * Same moving contour field as the ImGui menu / HWID.html:
 * Perlin noise + marching squares, capped ~18 FPS.
 */
export function ContourBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const ACCENT = [151, 131, 209];
    const ACCENT_END = [141, 180, 226];
    const GRID = 28;
    const LEVEL_STEP = 0.22;
    const NOISE_SCALE = 1 / 280;
    const DRIFT = 0.035;
    const LINE_W = 1.2;
    const ALPHA = 0.1;
    const SCALE = 0.55;
    const FRAME_MS = 1000 / 18;

    const perm = new Uint8Array(512);
    {
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      let s = 20261108 >>> 0;
      const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      for (let i = 255; i > 0; i--) {
        const j = (rnd() * (i + 1)) | 0;
        const t = p[i];
        p[i] = p[j];
        p[j] = t;
      }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + (b - a) * t;
    function grad(h, x, y, z) {
      const k = h & 15;
      const u = k < 8 ? x : y;
      const v = k < 4 ? y : k === 12 || k === 14 ? x : z;
      return ((k & 1) ? -u : u) + ((k & 2) ? -v : v);
    }
    function noise(x, y, z) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      const u = fade(x);
      const v = fade(y);
      const w = fade(z);
      const A = perm[X] + Y;
      const AA = perm[A] + Z;
      const AB = perm[A + 1] + Z;
      const B = perm[X + 1] + Y;
      const BA = perm[B] + Z;
      const BB = perm[B + 1] + Z;
      return lerp(
        lerp(
          lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
          lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
          v,
        ),
        lerp(
          lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
          lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
          v,
        ),
        w,
      );
    }
    function field(x, y, t) {
      const s = NOISE_SCALE;
      return noise((x - t * 6) * s, (y + t * 3) * s, t * DRIFT);
    }

    let vals = new Float32Array(0);
    let nx = 0;
    let ny = 0;
    let cssW = 0;
    let cssH = 0;

    function resize() {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(cssW * SCALE));
      canvas.height = Math.max(1, Math.floor(cssH * SCALE));
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      nx = Math.ceil(cssW / GRID) + 1;
      ny = Math.ceil(cssH / GRID) + 1;
      vals = new Float32Array(nx * ny);
    }

    let lastDraw = 0;
    let raf = 0;
    const t0 = performance.now();

    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.fillStyle = "#0b0c10";
      ctx.fillRect(0, 0, cssW, cssH);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          vals[j * nx + i] = field(i * GRID, j * GRID, t);
        }
      }
      ctx.lineWidth = LINE_W;
      ctx.lineJoin = "round";
      for (let L = -0.9; L < 0.9; L += LEVEL_STEP) {
        const u = (L + 0.9) / 1.8;
        const r = (ACCENT[0] + (ACCENT_END[0] - ACCENT[0]) * u) | 0;
        const g = (ACCENT[1] + (ACCENT_END[1] - ACCENT[1]) * u) | 0;
        const b = (ACCENT[2] + (ACCENT_END[2] - ACCENT[2]) * u) | 0;
        ctx.strokeStyle = `rgba(${r},${g},${b},${ALPHA})`;
        ctx.beginPath();
        for (let j = 0; j + 1 < ny; j++) {
          for (let i = 0; i + 1 < nx; i++) {
            const v00 = vals[j * nx + i];
            const v10 = vals[j * nx + i + 1];
            const v01 = vals[(j + 1) * nx + i];
            const v11 = vals[(j + 1) * nx + i + 1];
            const c = (v00 > L) | ((v10 > L) << 1) | ((v11 > L) << 2) | ((v01 > L) << 3);
            if (c === 0 || c === 15) continue;
            const x = i * GRID;
            const y = j * GRID;
            const edge = (ax, ay, av, bx, by, bv) => {
              const tt = (L - av) / (bv - av);
              return [ax + (bx - ax) * tt, ay + (by - ay) * tt];
            };
            const es = [];
            if ((v00 > L) !== (v10 > L)) es.push(edge(x, y, v00, x + GRID, y, v10));
            if ((v10 > L) !== (v11 > L)) es.push(edge(x + GRID, y, v10, x + GRID, y + GRID, v11));
            if ((v01 > L) !== (v11 > L)) es.push(edge(x, y + GRID, v01, x + GRID, y + GRID, v11));
            if ((v00 > L) !== (v01 > L)) es.push(edge(x, y, v00, x, y + GRID, v01));
            if (es.length >= 2) {
              ctx.moveTo(es[0][0], es[0][1]);
              ctx.lineTo(es[1][0], es[1][1]);
              if (es.length === 4) {
                ctx.moveTo(es[2][0], es[2][1]);
                ctx.lineTo(es[3][0], es[3][1]);
              }
            }
          }
        }
        ctx.stroke();
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      draw(now);
    }

    const onVis = () => {
      if (!document.hidden) lastDraw = 0;
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(900px 480px at 18% -8%, rgba(151,131,209,0.18), transparent 60%), radial-gradient(800px 420px at 92% 108%, rgba(141,180,226,0.12), transparent 55%)",
        }}
      />
    </>
  );
}
