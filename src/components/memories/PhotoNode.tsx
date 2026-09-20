"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { palette } from "@/config/palette";
import type { Photo } from "@/data/memories";
import { heartbeat } from "@/lib/heartbeat";
import { openPhoto } from "@/lib/memory-flow";
import { makeRandom } from "@/lib/random";
import { visualState as v } from "@/lib/visual-state";
import { auraFragment, auraVertex } from "@/shaders/aura";
import { loadPhotoTexture, textureAspect } from "./memory-texture";

interface Props {
  photo: Photo;
  index: number;
  position: [number, number, number];
  /** width in world units */
  width: number;
}

/** A photograph floating inside the heart, tied to the core by a thread of light. */
export function PhotoNode({ photo, index, position, width }: Props) {
  const group = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const seed = useMemo(() => {
    const random = makeRandom(100 + index);
    return { phase: random() * 10, tilt: (random() - 0.5) * 0.5, roll: (random() - 0.5) * 0.12 };
  }, [index]);

  useEffect(() => {
    let alive = true;
    void loadPhotoTexture(photo).then((t) => {
      if (alive) setTexture(t);
      else t.dispose();
    });
    return () => {
      alive = false;
    };
  }, [photo]);
  useEffect(() => () => texture?.dispose(), [texture]);

  const material = useMemo(
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
  useEffect(() => () => material.dispose(), [material]);

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

  const aspect = texture ? textureAspect(texture) : 1.33;
  const w = width;
  const h = w / aspect;

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const focused = v.photoIndex === index;
    const other = v.focus > 0.001 && !focused;
    const beat = heartbeat.intensity;

    g.visible = v.inside > 0.01;
    g.position.set(
      position[0] + Math.sin(t * 0.31 + seed.phase) * 0.08,
      position[1] + Math.sin(t * 0.43 + seed.phase * 1.7) * 0.09,
      position[2],
    );
    g.rotation.set(Math.sin(t * 0.2 + seed.phase) * 0.04, seed.tilt + Math.sin(t * 0.17 + seed.phase) * 0.05, seed.roll);

    const vis = v.inside * (other ? 1 - 0.75 * v.focus : 1);
    const pm = plane.current?.material as THREE.MeshBasicMaterial | undefined;
    if (pm) pm.opacity = vis * (0.92 + 0.08 * beat);
    const gm = glow.current?.material as THREE.ShaderMaterial | undefined;
    if (gm) {
      gm.uniforms.uBeat.value = beat;
      gm.uniforms.uAlpha.value = vis * (0.16 + 0.12 * beat + (focused ? 0.45 : 0));
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (v.inside < 0.5) return;
    e.stopPropagation();
    openPhoto(index, position);
  };

  return (
    <group ref={group} position={position}>
      <mesh ref={glow} material={glowMaterial} position={[0, 0, -0.05]} scale={[w * 2.0, h * 2.0, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={plane} material={material} scale={[w, h, 1]} onPointerDown={onPointerDown}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
