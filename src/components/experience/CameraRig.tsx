"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";

export const CAMERA_FOV = 38;
/** wider inside the heart: the memory space should wrap around her */
const INSIDE_FOV = 62;

/** Distance at which the heart (≈2.1 wide, 2.2 tall) sits comfortably in frame. */
export function cameraDistanceForAspect(aspect: number): number {
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
  const byHeight = (2.2 * 2.2) / (2 * tanHalf);
  const byWidth = (2.1 * 1.9) / (2 * aspect * tanHalf);
  return Math.max(byHeight, byWidth);
}

const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Authored camera. Outside: chapters set the distance through visualState,
 * plus subtle parallax, breath and a tiny push on each beat. Inside the heart:
 * the camera sits at the origin looking into the memory space, turns a little
 * with the pointer, and glides toward the memory she opened.
 */
export function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(0, 0, 11), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const focusPos = useMemo(() => new THREE.Vector3(), []);
  const focusLook = useMemo(() => new THREE.Vector3(), []);
  const lastInside = useRef(false);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const t = state.clock.elapsedTime;
    const aspect = state.size.width / state.size.height;

    const useGyro = fs.isMobile && fs.gyro.enabled;
    const px = useGyro ? fs.gyro.x : fs.pointerActive ? fs.pointer.x : 0;
    const py = useGyro ? fs.gyro.y : fs.pointerActive ? fs.pointer.y : 0;
    const motion = fs.reducedMotion ? 0 : 1;
    const inside = v.inside > 0.35;

    const fov = inside ? INSIDE_FOV : CAMERA_FOV;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = inside !== lastInside.current ? fov : THREE.MathUtils.damp(cam.fov, fov, 3, dt);
      cam.updateProjectionMatrix();
    }

    if (!inside) {
      const dist = cameraDistanceForAspect(aspect) * v.camDistMul;
      const amount = 0.32 * (0.6 + 0.4 * fs.proximity) * motion;
      target.set(
        px * amount + Math.sin(t * 0.23) * 0.05 * motion,
        py * amount * 0.6 + v.camY + Math.sin(t * 0.37) * 0.03 * motion,
        dist - heartbeat.intensity * 0.06 * v.heartOpacity * motion,
      );
      look.set(0, v.lookY, 0);
    } else {
      // at the heart's centre, looking into the red space
      target.set(px * 0.25 * motion, py * 0.15 * motion, 0.3);
      look.set(px * 1.3 * motion, py * 0.8 * motion, -6);
      if (v.focus > 0.001) {
        const p = v.focusPos;
        focusLook.set(p[0], p[1], p[2]);
        // stand between the origin and the memory, a little in front of it
        focusPos.copy(focusLook).multiplyScalar(1 - 1.9 / focusLook.length());
        const f = ease(v.focus);
        target.lerp(focusPos, f);
        look.lerp(focusLook, f);
      }
    }

    if (inside !== lastInside.current) {
      // the cut is hidden by the flash / crossfade — snap, do not glide across worlds
      lastInside.current = inside;
      cam.position.copy(target);
    } else {
      cam.position.x = THREE.MathUtils.damp(cam.position.x, target.x, 2.2, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, target.y, 2.2, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, target.z, 3, dt);
    }
    cam.lookAt(look);
  });

  return null;
}
