"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

/**
 * Her hand on the heart — handled with native pointer events on the canvas and
 * a plain ray/sphere test, so a tap or a hold on a phone never depends on the
 * synthetic event pipeline. The sphere is a little larger than the heart: a
 * finger is not a cursor.
 */
export function HeartInput() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const sphere = new THREE.Sphere();
    const hit = new THREE.Vector3();

    const interactive = () =>
      (heartbeat.isBeating || fs.touchEnabled || fs.holdEnabled) && v.heartOpacity > 0.5 && v.inside < 0.5;

    const onHeart = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const pad = e.pointerType === "mouse" ? 1.0 : 1.25;
      sphere.set(new THREE.Vector3(0, v.heartY, 0), fs.heartRadius * pad);
      return raycaster.ray.intersectSphere(sphere, hit) !== null;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button > 0 || !interactive() || !onHeart(e)) return;
      fs.pressing = true;
      fs.touching = true;
      fs.excitation = Math.max(fs.excitation, fs.holdEnabled ? 0.35 : 1);
      const store = useExperienceStore.getState();
      store.registerTouch();
      if (store.chapter === Chapter.INTRO && fs.touchEnabled) store.setChapter(Chapter.TOUCH);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const over = interactive() && onHeart(e);
      fs.touching = over;
      document.body.style.cursor = over ? "pointer" : "";
    };
    const onUp = (e: PointerEvent) => {
      if (fs.pressing) fs.lastRelease = `${e.type}@${Math.round(performance.now())}`;
      fs.pressing = false;
      if (fs.isMobile) fs.touching = false;
    };

    // a (passive) touch listener on the canvas keeps mobile browsers delivering
    // pointer events for stationary fingers, so a long hold is never dropped
    const noop = () => {};
    el.addEventListener("touchstart", noop, { passive: true });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("touchstart", noop);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
    };
  }, [camera, gl]);

  return null;
}
