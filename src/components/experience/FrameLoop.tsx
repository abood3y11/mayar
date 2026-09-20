"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { experienceConfig } from "@/config/experience";
import { audioEngine } from "@/lib/audio/audio-engine";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { computeTargetBpm } from "@/lib/heartbeat-policy";
import { updateVitality } from "@/lib/vitality";
import { visualState as v } from "@/lib/visual-state";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { CAMERA_FOV } from "./CameraRig";

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The one place the clock ticks. Every frame:
 *  1. pointer → proximity (how close she is to the heart on screen)
 *  2. drawing and hold interactions advance (and end their chapters)
 *  3. chapter + state → target BPM (policy) → heartbeat.update(dt)
 *  4. DOM mirrors: --beat, --flash, BPM display, hold progress
 */
export function FrameLoop() {
  const center = useMemo(() => new THREE.Vector3(), []);
  const lastDisplay = useRef(0);
  const chapterRef = useRef<{ chapter: Chapter | null; since: number }>({ chapter: null, since: 0 });
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    fs.time += dt;
    fs.pointer.x = state.pointer.x;
    fs.pointer.y = state.pointer.y;
    const store = useExperienceStore.getState();
    const chapter = store.chapter;
    if (chapter !== chapterRef.current.chapter) chapterRef.current = { chapter, since: fs.time };
    const inChapter = fs.time - chapterRef.current.since;

    // 1. proximity — distance from the pointer to the heart's projected disc
    let raw = 0;
    if (fs.touching) {
      raw = 1;
    } else if (fs.pointerActive && v.heartOpacity > 0.3 && v.inside < 0.5) {
      center.set(0, v.heartY, 0).project(state.camera);
      const aspect = state.size.width / state.size.height;
      const camDist = state.camera.position.length();
      const rNdc = fs.heartRadius / (camDist * tanHalf);
      const dx = (fs.pointer.x - center.x) * aspect;
      const dy = fs.pointer.y - center.y;
      const d = Math.hypot(dx, dy);
      raw = 1 - smoothstep(rNdc * 0.85, rNdc * 3.2, d);
    }
    fs.proximity = THREE.MathUtils.damp(fs.proximity, raw, 4, dt);
    fs.excitation *= Math.exp(-dt / 2.2);

    // 2a. drawing: when her lines are enough (or the time is), they start to gather
    if (chapter === Chapter.DRAW) {
      const d = fs.draw;
      const cfg = experienceConfig.draw;
      if (d.firstAt >= 0) {
        const since = fs.time - d.firstAt;
        const idle = fs.time - d.lastAt;
        v.strokes.attract = clamp01((since - 4) / 10) * 0.6;
        const enough = d.points >= cfg.minPoints && since >= cfg.minSeconds && idle > 1.2 && !d.penDown;
        const late = since >= cfg.maxSeconds && d.points > 40 && (!d.penDown || since >= cfg.maxSeconds + 4);
        const autoDone = d.auto && d.points >= 1400 && idle > 0.8;
        if (enough || late || autoDone) store.setChapter(Chapter.FORM);
      } else if (inChapter >= cfg.autoAfterSeconds) {
        d.auto = true;
      }
    }

    // 2b. hold: progress fills while she keeps her hand on the heart, decays gently otherwise
    if (fs.holdEnabled) {
      if (fs.pressing) fs.holdProgress = Math.min(1, fs.holdProgress + dt / fs.holdDuration);
      else fs.holdProgress = Math.max(0, fs.holdProgress - dt * 0.12);
      v.warmth = fs.holdProgress;
      if (fs.holdProgress >= 1 && !fs.holdDone) fs.holdDone = true;
      store.setHold(Math.round(fs.holdProgress * 20) / 20, fs.holdDone);
    }

    // 2c. it needs her: waiting too long for her hand slows it down, then stops it
    updateVitality(dt);

    // 3. rhythm — dying hearts slow toward a last, faint beat
    heartbeat.setTarget(computeTargetBpm(chapter, fs) * (1 - fs.neglect) + 28 * fs.neglect);
    heartbeat.update(dt);
    audioEngine.update(dt);

    // 4. DOM
    const root = document.documentElement.style;
    root.setProperty("--beat", heartbeat.intensity.toFixed(3));
    root.setProperty("--flash", v.flash.toFixed(3));
    if (state.clock.elapsedTime - lastDisplay.current > 0.25) {
      lastDisplay.current = state.clock.elapsedTime;
      store.setBpmDisplay(Math.round(heartbeat.bpm));
    }
  });

  return null;
}
