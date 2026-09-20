"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { makeRandom } from "@/lib/random";
import { visualState as v } from "@/lib/visual-state";
import { dustFragment, dustVertex } from "@/shaders/dust";
import { useExperienceStore } from "@/stores/experience-store";

const COUNTS = { low: 180, medium: 320, high: 460 } as const;

/** Soft, slow motes drifting through the red space inside the heart. */
export function Nebula() {
  const quality = useExperienceStore((s) => s.quality);
  const count = COUNTS[quality];
  const points = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const random = makeRandom(2022);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 14;
      positions[i * 3 + 1] = (random() - 0.5) * 9;
      positions[i * 3 + 2] = -1 - random() * 11;
      scales[i] = 0.4 + Math.pow(random(), 2) * 1.6;
      phases[i] = random() * 100;
      seeds[i * 3] = random() * 10;
      seeds[i * 3 + 1] = random() * 10;
      seeds[i * 3 + 2] = random() * 10;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uAttract: { value: 0 },
        uBurst: { value: 0 },
        uSize: { value: 10 },
        uPixelRatio: { value: 1 },
        uWake: { value: 0 },
        uNear: { value: 0 },
        uFar: { value: 16 },
        uColor: { value: new THREE.Color(palette.pink) },
        uColorHot: { value: new THREE.Color(palette.gold) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const obj = points.current;
    if (!obj) return;
    const u = (obj.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = state.clock.elapsedTime * (fs.reducedMotion ? 0.25 : 0.6);
    u.uBeat.value = heartbeat.intensity * 0.6;
    u.uWake.value = v.inside * (0.8 + 0.4 * fs.audio.bass);
    u.uPixelRatio.value = state.viewport.dpr;
    obj.visible = v.inside > 0.01;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
