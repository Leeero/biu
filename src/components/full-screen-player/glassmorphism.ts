import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

export type Rgb = { r: number; g: number; b: number };

export type GlassEffectsProfile = {
  enableFullEffects: boolean;
  blurPx: number;
  transitionMs: number;
};

export type GlassBackgroundLayer = {
  coverSrc?: string;
  gradientBackground: string;
};

const dominantColorCache = new Map<string, Rgb>();
const MAX_COLOR_CACHE_SIZE = 100;

export function getOptimizedBackgroundImageUrl(src?: string) {
  if (!src || !src.includes("/bfs/") || src.includes("@")) return src;
  return `${src}@672w_378h_1c.avif`;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function getRelativeLuminance({ r, g, b }: Rgb) {
  const srgb = [r, g, b].map(v => v / 255);
  const linear = srgb.map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * clamp01(t));
}

function normalizeGlowColor(rgb: Rgb): Rgb {
  const l = getRelativeLuminance(rgb);
  if (l < 0.22) {
    const t = clamp01((0.22 - l) / 0.22) * 0.55;
    return { r: mix(rgb.r, 255, t), g: mix(rgb.g, 255, t), b: mix(rgb.b, 255, t) };
  }
  if (l > 0.88) {
    const t = clamp01((l - 0.88) / 0.12) * 0.45;
    return { r: mix(rgb.r, 0, t), g: mix(rgb.g, 0, t), b: mix(rgb.b, 0, t) };
  }
  return rgb;
}

function hexToRgb(hex: string): Rgb | null {
  const v = hex.trim();
  if (!v.startsWith("#")) return null;
  const raw = v.slice(1);
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

async function extractDominantColorFromImage(src: string): Promise<Rgb> {
  const cached = dominantColorCache.get(src);
  if (cached) return cached;

  return await new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 180) continue;
        const rr = data[i];
        const gg = data[i + 1];
        const bb = data[i + 2];

        const lum = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
        if (lum < 0.06 || lum > 0.96) continue;

        r += rr;
        g += gg;
        b += bb;
        count += 1;
      }

      if (count === 0) {
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 180) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
      }

      if (count === 0) {
        reject(new Error("Empty image"));
        return;
      }

      const result = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
      if (dominantColorCache.size >= MAX_COLOR_CACHE_SIZE) {
        const oldestKey = dominantColorCache.keys().next().value;
        if (oldestKey) dominantColorCache.delete(oldestKey);
      }
      dominantColorCache.set(src, result);
      resolve(result);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function getEffectsProfile(): GlassEffectsProfile {
  const deviceMemory = navigator?.deviceMemory;
  const cores = navigator?.hardwareConcurrency;
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const lowEnd =
    (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4) ||
    (typeof cores === "number" && cores > 0 && cores <= 4);

  const enableFullEffects = !reduceMotion && !lowEnd;
  return {
    enableFullEffects,
    blurPx: enableFullEffects ? 12 : 8,
    transitionMs: reduceMotion ? 0 : 700,
  };
}

function buildGradientBackground(glowRgb: Rgb, overlayAlpha: number) {
  return `radial-gradient(1100px circle at 50% 18%, rgb(${glowRgb.r} ${glowRgb.g} ${glowRgb.b} / 0.42), transparent 62%),
radial-gradient(900px circle at 14% 86%, rgb(${glowRgb.r} ${glowRgb.g} ${glowRgb.b} / 0.22), transparent 58%),
radial-gradient(900px circle at 86% 92%, rgb(${glowRgb.r} ${glowRgb.g} ${glowRgb.b} / 0.16), transparent 60%),
rgb(0 0 0 / ${overlayAlpha})`;
}

export function useGlassmorphism(coverSrc: string | undefined, fallbackHex: string, enabled: boolean = true) {
  const [dominantRgb, setDominantRgb] = useState<Rgb | null>(null);
  const backgroundCoverSrc = useMemo(() => getOptimizedBackgroundImageUrl(coverSrc), [coverSrc]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fallback = () => {
      const rgb = hexToRgb(fallbackHex) || { r: 30, g: 215, b: 96 };
      if (!cancelled) setDominantRgb(normalizeGlowColor(rgb));
    };

    if (!backgroundCoverSrc) {
      fallback();
      return () => {
        cancelled = true;
      };
    }

    extractDominantColorFromImage(backgroundCoverSrc)
      .then(rgb => {
        if (!cancelled) setDominantRgb(normalizeGlowColor(rgb));
      })
      .catch(() => {
        fallback();
      });

    return () => {
      cancelled = true;
    };
  }, [backgroundCoverSrc, fallbackHex, enabled]);

  const effectsProfile = useMemo(() => getEffectsProfile(), []);

  const glowRgb = useMemo(() => {
    return (
      dominantRgb || (hexToRgb(fallbackHex) ? normalizeGlowColor(hexToRgb(fallbackHex)!) : { r: 30, g: 215, b: 96 })
    );
  }, [dominantRgb, fallbackHex]);

  const glowL = useMemo(() => getRelativeLuminance(glowRgb), [glowRgb]);
  const glassAlpha = glowL > 0.65 ? 0.24 : 0.34;
  const overlayAlpha = glowL > 0.7 ? 0.62 : 0.72;

  const gradientBackground = useMemo(() => buildGradientBackground(glowRgb, overlayAlpha), [glowRgb, overlayAlpha]);

  const bgKey = useMemo(() => {
    return `${backgroundCoverSrc || ""}:${glowRgb.r},${glowRgb.g},${glowRgb.b}:${overlayAlpha.toFixed(2)}`;
  }, [backgroundCoverSrc, glowRgb.b, glowRgb.g, glowRgb.r, overlayAlpha]);

  const [bgLayerA, setBgLayerA] = useState<GlassBackgroundLayer>(() => ({
    coverSrc: backgroundCoverSrc,
    gradientBackground,
  }));
  const [bgLayerB, setBgLayerB] = useState<GlassBackgroundLayer>(() => ({
    coverSrc: backgroundCoverSrc,
    gradientBackground,
  }));
  const [activeBgLayer, setActiveBgLayer] = useState<"a" | "b">("a");
  const lastBgKeyRef = useRef(bgKey);

  useEffect(() => {
    if (lastBgKeyRef.current === bgKey) return;
    lastBgKeyRef.current = bgKey;

    const next = { coverSrc: backgroundCoverSrc, gradientBackground };
    if (activeBgLayer === "a") {
      setBgLayerB(next);
      setActiveBgLayer("b");
    } else {
      setBgLayerA(next);
      setActiveBgLayer("a");
    }
  }, [activeBgLayer, bgKey, backgroundCoverSrc, gradientBackground]);

  const cssVars = useMemo(() => {
    return {
      ["--glow-rgb" as any]: `${glowRgb.r} ${glowRgb.g} ${glowRgb.b}`,
      ["--glass-alpha" as any]: glassAlpha,
    } as CSSProperties;
  }, [glowRgb.b, glowRgb.g, glowRgb.r, glassAlpha]);

  return {
    effectsProfile,
    glowRgb,
    glassAlpha,
    overlayAlpha,
    gradientBackground,
    bgLayerA,
    bgLayerB,
    activeBgLayer,
    cssVars,
  };
}
