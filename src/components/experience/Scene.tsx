"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Heart } from "@/components/heart/Heart";
import { HeartDust } from "@/components/heart/HeartDust";
import { HeartInput } from "@/components/heart/HeartInput";
import { Pen } from "@/components/heart/Pen";
import { Strokes } from "@/components/heart/Strokes";
import { MemoryWorld } from "@/components/memories/MemoryWorld";
import { lowerTier } from "@/lib/quality";
import { useExperienceStore } from "@/stores/experience-store";
import { Aura } from "./Aura";
import { Background } from "./Background";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { FrameLoop } from "./FrameLoop";
import { Lighting } from "./Lighting";

/** dev only: lets the console (and tests) read the R3F state */
function DevHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __heart?: Record<string, unknown> };
    w.__heart = { ...(w.__heart ?? {}), three: get };
  }, [get]);
  return null;
}

/** Everything inside the persistent canvas. Never remounted between chapters. */
export function Scene() {
  const setQuality = useExperienceStore((s) => s.setQuality);
  const declines = useRef(0);
  const mountedAt = useRef(0);
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  return (
    <>
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          // ignore shader-compile stalls in the first seconds
          if (performance.now() - mountedAt.current < 6000) return;
          if (declines.current >= 2) return;
          declines.current += 1;
          setQuality(lowerTier(useExperienceStore.getState().quality));
        }}
      />
      <Background />
      <Lighting />
      <Aura />
      <Heart />
      <HeartInput />
      <Strokes />
      <Pen />
      <HeartDust />
      <MemoryWorld />
      <CameraRig />
      <FrameLoop />
      <Effects />
      <DevHandle />
    </>
  );
}
