"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { backgroundFragment, backgroundVertex } from "@/shaders/background";

/** The warm red world, rendered as a full-screen quad behind everything. */
export function Background() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: backgroundVertex,
        fragmentShader: backgroundFragment,
        uniforms: {
          uC0: { value: new THREE.Color(palette.bg0) },
          uC1: { value: new THREE.Color(palette.bg1) },
          uC2: { value: new THREE.Color(palette.bg2) },
          uC3: { value: new THREE.Color(palette.bg3) },
          uBeat: { value: 0 },
          uTime: { value: 0 },
          uDepth: { value: 0 },
          uAspect: { value: 1 },
          uPulse: { value: 1 },
        },
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    const u = m.uniforms;
    u.uBeat.value = heartbeat.intensity;
    u.uTime.value = state.clock.elapsedTime;
    // the world dims and stops breathing when the heart is left alone
    u.uDepth.value = Math.min(1, v.bgDepth + 0.4 * fs.neglect);
    u.uAspect.value = state.size.width / state.size.height;
    u.uPulse.value = v.bgPulse * (1 - fs.neglect) * (fs.reducedMotion ? 0.3 : 1);
  });

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
