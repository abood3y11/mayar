"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { auraFragment, auraVertex } from "@/shaders/aura";

/** Red aura behind the heart. Breathes with the beat, warms with her hand. */
export function Aura() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: auraVertex,
        fragmentShader: auraFragment,
        uniforms: {
          uColor: { value: new THREE.Color(palette.aura) },
          uAlpha: { value: 0 },
          uBeat: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const beat = heartbeat.intensity;
    const u = (m.material as THREE.ShaderMaterial).uniforms;
    u.uBeat.value = beat;
    u.uAlpha.value =
      v.aura * (1 - fs.neglect) * (0.4 + 0.35 * beat + 0.15 * fs.proximity + 0.45 * v.warmth + 0.6 * v.burst);
    m.position.y = v.heartY;
    m.scale.setScalar(v.scale * (1 + 0.06 * beat) * 5.4);
    m.visible = v.aura > 0.003;
  });

  return (
    <mesh ref={mesh} material={material} position={[0, 0, -0.5]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
