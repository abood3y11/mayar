"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { palette } from "@/config/palette";
import type { Memory } from "@/data/memories";
import { heartbeat } from "@/lib/heartbeat";
import { openMemory } from "@/lib/memory-flow";
import { visualState as v } from "@/lib/visual-state";
import { auraFragment, auraVertex } from "@/shaders/aura";
import { useExperienceStore } from "@/stores/experience-store";
import { loadMemoryTexture, textureAspect } from "./memory-texture";

interface Props {
  memory: Memory;
  index: number;
  /** laid out for the current orientation (see layoutMemory) */
  position: [number, number, number];
}

/** A photographic surface floating inside the heart, with its own glow. */
export function MemoryNode({ memory, index, position }: Props) {
  const group = useRef<THREE.Group>(null);
  const photo = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let alive = true;
    void loadMemoryTexture(memory).then((t) => {
      if (alive) setTexture(t);
      else t.dispose();
    });
    return () => {
      alive = false;
    };
  }, [memory]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // built imperatively so the map is present at compile time (no black cards)
  const photoMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: texture ? 0xffffff : new THREE.Color(palette.bg1),
        transparent: true,
        opacity: 0,
        toneMapped: false,
      }),
    [texture],
  );
  useEffect(() => () => photoMaterial.dispose(), [photoMaterial]);

  const glowMaterial = useMemo(
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
  useEffect(() => () => glowMaterial.dispose(), [glowMaterial]);

  const aspect = texture ? textureAspect(texture) : 1.5;
  const w = memory.width;
  const h = w / aspect;

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const store = useExperienceStore.getState();
    const current = store.memoryIndex === index && !store.memoryOpen;
    const focused = v.focusIndex === index;
    const other = v.focusIndex >= 0 && !focused;
    const beat = heartbeat.intensity;

    g.visible = v.inside > 0.01;
    g.position.set(position[0], position[1] + Math.sin(t * 0.5 + index * 2.1) * 0.06, position[2]);
    g.rotation.z = memory.rotation[2] + Math.sin(t * 0.3 + index) * 0.02;

    const vis = v.inside * (other ? 1 - 0.7 * v.focus : 1);
    const pm = photo.current?.material as THREE.MeshBasicMaterial | undefined;
    if (pm) pm.opacity = vis;
    const gm = glow.current?.material as THREE.ShaderMaterial | undefined;
    if (gm) {
      gm.uniforms.uBeat.value = beat;
      gm.uniforms.uAlpha.value = vis * (0.3 + (current ? 0.35 + 0.4 * beat : 0) + (focused ? 0.5 : 0));
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (v.inside < 0.5) return;
    e.stopPropagation();
    openMemory(index);
  };

  return (
    <group ref={group} position={position} rotation={memory.rotation}>
      <mesh ref={glow} material={glowMaterial} position={[0, 0, -0.06]} scale={[w * 2.1, h * 2.1, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={photo} material={photoMaterial} scale={[w, h, 1]} onPointerDown={onPointerDown}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
