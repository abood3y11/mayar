"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { auraFragment, auraVertex } from "@/shaders/aura";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

/** A small glow that follows the pointer while she draws (desktop, and the auto-drawing). */
export function Pen() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: auraVertex,
        fragmentShader: auraFragment,
        uniforms: {
          uColor: { value: new THREE.Color(palette.strokeHot) },
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

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const chapter = useExperienceStore.getState().chapter;
    const show = chapter === Chapter.DRAW && (fs.draw.auto || (!fs.isMobile && fs.pointerActive));
    const target = show ? (fs.draw.penDown || fs.draw.auto ? 0.9 : 0.5) : 0;
    const u = (m.material as THREE.ShaderMaterial).uniforms;
    u.uAlpha.value = THREE.MathUtils.damp(u.uAlpha.value, target, 8, delta);
    m.position.set(fs.draw.penX, fs.draw.penY, 0.05);
    m.scale.setScalar(0.42 + 0.05 * Math.sin(state.clock.elapsedTime * 6));
    m.visible = u.uAlpha.value > 0.01;
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={4}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
