"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { QUALITY_PRESETS } from "@/lib/quality";
import { makeRandom } from "@/lib/random";
import { visualState as v } from "@/lib/visual-state";
import { dustFragment, dustVertex } from "@/shaders/dust";
import { useExperienceStore } from "@/stores/experience-store";

/** Light dust — gold and pink, very light — in a shell around the heart. */
export function HeartDust() {
  const quality = useExperienceStore((s) => s.quality);
  const count = QUALITY_PRESETS[quality].dustCount;
  const points = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const random = makeRandom(1409);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 2.0 + Math.pow(random(), 1.5) * 6.5;
      positions[i * 3] = s * Math.cos(theta) * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = s * Math.sin(theta) * r;
      scales[i] = 0.35 + Math.pow(random(), 2) * 1.0;
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
        uSize: { value: 7 },
        uPixelRatio: { value: 1 },
        uWake: { value: 0 },
        uNear: { value: 1.6 },
        uFar: { value: 12 },
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
    u.uTime.value = state.clock.elapsedTime * (fs.reducedMotion ? 0.25 : 1);
    u.uBeat.value = heartbeat.intensity;
    u.uAttract.value = fs.proximity + v.warmth * 0.6;
    u.uBurst.value = v.burst;
    // the music (if any) makes the world breathe; the heart keeps its own rhythm
    u.uWake.value = v.dust * (1 - v.inside) * (1 - 0.85 * fs.neglect) * (0.75 + 0.5 * fs.audio.bass);
    u.uPixelRatio.value = state.viewport.dpr;
    obj.visible = u.uWake.value > 0.003;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}
