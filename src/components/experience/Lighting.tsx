"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { QUALITY_PRESETS } from "@/lib/quality";
import { visualState as v } from "@/lib/visual-state";
import { useExperienceStore } from "@/stores/experience-store";

/**
 * Warm light. A soft white key from above-front, a pink rim from behind, and a
 * procedural environment (no network) for the ruby-glass reflections.
 */
export function Lighting() {
  const quality = useExperienceStore((s) => s.quality);
  const preset = QUALITY_PRESETS[quality];
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const l = v.light * (1 - 0.6 * fs.neglect);
    if (key.current) key.current.intensity = 34 * l;
    if (rim.current) rim.current.intensity = 2.2 * l;
    if (ambient.current) ambient.current.intensity = 0.1 + 0.15 * l;
  });

  return (
    <>
      <ambientLight ref={ambient} color={palette.bg1} intensity={0.1} />
      <spotLight ref={key} position={[3.5, 4.5, 5]} angle={0.55} penumbra={1} decay={2} color="#fff1ec" intensity={0} />
      <directionalLight ref={rim} position={[-4, 1.5, -4]} color="#ff5a76" intensity={0} />
      <Environment resolution={preset.envResolution} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff1ec" position={[0, 4, 3]} rotation-x={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color={palette.pink} position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={1.0} color={palette.ruby} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} color={palette.bg1} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
      </Environment>
    </>
  );
}
