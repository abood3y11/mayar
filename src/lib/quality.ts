import type { QualityPreset, QualityTier } from "@/types/experience";

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  low: { dpr: [1, 1], bloom: false, transmission: false, dustCount: 300, envResolution: 64 },
  medium: { dpr: [1, 1.5], bloom: true, transmission: false, dustCount: 700, envResolution: 128 },
  high: { dpr: [1, 2], bloom: true, transmission: true, dustCount: 1200, envResolution: 256 },
};

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Initial guess from device hints. The PerformanceMonitor in the scene can
 * step the tier down later if the frame rate does not hold.
 */
export function detectQualityTier(): QualityTier {
  if (typeof navigator === "undefined") return "medium";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const mobile = isCoarsePointer();
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 500;

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
  if (mobile || smallScreen) score -= 1;
  if (prefersReducedMotion()) score -= 1;

  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

export function lowerTier(tier: QualityTier): QualityTier {
  return tier === "high" ? "medium" : "low";
}
