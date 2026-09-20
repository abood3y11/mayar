"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { NEBULA_CORE, layoutMemory, memories } from "@/data/memories";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { LightThread } from "./LightThread";
import { MemoryNode } from "./MemoryNode";
import { Nebula } from "./Nebula";

/**
 * Inside the heart: a red space where three memories float, tied by threads
 * of light to the glowing core deep in the distance. Only visible while
 * visualState.inside > 0.
 */
export function MemoryWorld() {
  const core = useRef<THREE.Mesh>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const size = useThree((s) => s.size);
  const portrait = size.width < size.height;
  // positions depend only on orientation, so threads are not rebuilt on every resize
  const positions = useMemo(() => memories.map((m) => layoutMemory(m, portrait ? 0.5 : 1.5)), [portrait]);

  useFrame(() => {
    const m = coreMaterial.current;
    if (m) {
      const beat = heartbeat.intensity;
      m.color.set(palette.pulse).multiplyScalar(1.2 + 2.2 * beat);
      m.opacity = v.inside;
    }
    if (core.current) {
      core.current.visible = v.inside > 0.01;
      core.current.scale.setScalar(0.22 * (1 + 0.25 * heartbeat.intensity));
    }
  });

  return (
    <group>
      <Nebula />
      {memories.map((m, i) => (
        <MemoryNode key={m.id} memory={m} index={i} position={positions[i]} />
      ))}
      {memories.map((m, i) => (
        <LightThread key={`${m.id}-core-${portrait}`} from={positions[i]} to={NEBULA_CORE} pulseFor={i} />
      ))}
      {memories.slice(1).map((m, i) => (
        <LightThread key={`${m.id}-prev-${portrait}`} from={positions[i]} to={positions[i + 1]} pulseFor={-1} strength={0.5} />
      ))}
      <mesh ref={core} position={NEBULA_CORE}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial ref={coreMaterial} color={palette.pulse} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}
