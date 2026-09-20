import { frameState } from "@/lib/frame-state";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type RequestPermission = () => Promise<"granted" | "denied">;

/**
 * Gentle device-orientation parallax on phones. Must be called from a user
 * gesture (iOS asks for permission). Resolves false when unavailable.
 */
export async function enableGyro(): Promise<boolean> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;
  const DOE = DeviceOrientationEvent as unknown as { requestPermission?: RequestPermission };
  try {
    if (typeof DOE.requestPermission === "function") {
      const result = await DOE.requestPermission();
      if (result !== "granted") return false;
    }
  } catch {
    return false;
  }

  let baseBeta: number | null = null;
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.beta === null || e.gamma === null) return;
      if (baseBeta === null) baseBeta = e.beta; // calibrate to how she is holding it now
      frameState.gyro.x = clamp(e.gamma / 28, -1, 1);
      frameState.gyro.y = clamp((e.beta - baseBeta) / 28, -1, 1);
      frameState.gyro.enabled = true;
    },
    { passive: true },
  );
  return true;
}
