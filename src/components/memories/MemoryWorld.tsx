"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { NEBULA_CORE, layoutMemory, layoutPhotos, memories, photos } from "@/data/memories";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { LightThread } from "./LightThread";
import { MemoryNode } from "./MemoryNode";
import { Nebula } from "./Nebula";
import { PhotoNode } from "./PhotoNode";

/**
 * Inside the heart: a red space where three word cards and her photos float,
 * all tied by threads of light to the glowing core deep in the distance.
 * Only visible while visualState.inside > 0.
 */
export function MemoryWorld() {
  const core = useRef<THREE.Mesh>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const size = useThree((s) => s.size);
  const portrait = size.width < size.height;
  // positions depend only on orientation, so threads are not rebuilt on every resize
  const wordPositions = useMemo(() => memories.map((m) => layoutMemory(m, portrait ? 0.5 : 1.5)), [portrait]);
  const photoPositions = useMemo(() => layoutPhotos(photos.length, portrait, wordPositions), [portrait, wordPositions]);
  const photoWidth = portrait ? 0.95 : 1.15;

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __heart?: Record<string, unknown> };
    w.__heart = { ...(w.__heart ?? {}), photoPositions, wordPositions };
  }, [photoPositions, wordPositions]);

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
        <MemoryNode key={m.id} memory={m} index={i} position={wordPositions[i]} />
      ))}
      {memories.map((m, i) => (
        <LightThread key={`${m.id}-core-${portrait}`} from={wordPositions[i]} to={NEBULA_CORE} pulseFor={i} />
      ))}
      {memories.slice(1).map((m, i) => (
        <LightThread key={`${m.id}-prev-${portrait}`} from={wordPositions[i]} to={wordPositions[i + 1]} pulseFor={-1} strength={0.5} />
      ))}
      {photos.map((p, i) => (
        <PhotoNode key={p.image} photo={p} index={i} position={photoPositions[i]} width={photoWidth} />
      ))}
      {photos.map((p, i) => (
        <LightThread key={`${p.image}-core-${portrait}`} from={photoPositions[i]} to={NEBULA_CORE} pulseFor={-1} strength={0.35} />
      ))}
      <mesh ref={core} position={NEBULA_CORE}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial ref={coreMaterial} color={palette.pulse} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}
