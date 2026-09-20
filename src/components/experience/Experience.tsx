"use client";

import { Suspense, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Overlay } from "@/components/story/Overlay";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { QUALITY_PRESETS, detectQualityTier, isCoarsePointer, prefersReducedMotion } from "@/lib/quality";
import { recordVisit } from "@/lib/visits";
import { visualState } from "@/lib/visual-state";
import { useExperienceStore } from "@/stores/experience-store";
import { ChapterDirector } from "./ChapterDirector";
import { Scene } from "./Scene";
import { CAMERA_FOV } from "./CameraRig";

/**
 * The persistent stage: one WebGL canvas for the whole experience plus the
 * DOM overlay for text. Chapters change what is inside, never the canvas.
 */
export default function Experience() {
  const quality = useExperienceStore((s) => s.quality);
  const chapter = useExperienceStore((s) => s.chapter);
  const preset = QUALITY_PRESETS[quality];

  useEffect(() => {
    const store = useExperienceStore.getState();
    fs.isMobile = isCoarsePointer();
    fs.reducedMotion = prefersReducedMotion();
    heartbeat.amplitude = fs.reducedMotion ? 0.45 : 1;
    store.setQuality(detectQualityTier());
    store.setVisit(recordVisit());

    if (process.env.NODE_ENV !== "production") {
      // dev-only handle for poking the experience from the console
      (window as unknown as { __heart?: unknown }).__heart = {
        store: useExperienceStore,
        frameState: fs,
        heartbeat,
        visualState,
      };
    }

    const end = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") fs.pointerActive = false;
    };
    // no rubber-banding, pinch or double-tap zoom while her finger is on the stage
    const block = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    document.addEventListener("touchmove", block, { passive: false });
    document.addEventListener("gesturestart", block as EventListener, { passive: false });
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.removeEventListener("touchmove", block);
      document.removeEventListener("gesturestart", block as EventListener);
    };
  }, []);

  const onPointerEnter = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") fs.pointerActive = true;
  };
  const onPointerLeave = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") fs.pointerActive = false;
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") fs.pointerActive = true;
  };

  return (
    <div
      className="stage"
      data-chapter={chapter}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        className="stage-canvas"
        style={{ touchAction: "none" }}
        dpr={preset.dpr}
        camera={{ fov: CAMERA_FOV, near: 0.1, far: 80, position: [0, 0, 11] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        onCreated={({ gl }) => gl.setClearColor(palette.bg3)}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="flash" aria-hidden />
      <ChapterDirector />
      <Overlay />
    </div>
  );
}
