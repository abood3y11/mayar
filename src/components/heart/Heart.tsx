"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { setHeartGeometry } from "@/lib/heart-geometry";
import { heartbeat } from "@/lib/heartbeat";
import { QUALITY_PRESETS } from "@/lib/quality";
import { visualState as v } from "@/lib/visual-state";
import { useExperienceStore } from "@/stores/experience-store";
import { HeartShellMaterial } from "./HeartShellMaterial";

const HEART_URL = "/models/heart.glb";
useGLTF.preload(HEART_URL);

const CORE_COLOR = new THREE.Color(palette.pulse);

/**
 * The heart: a ruby-glass shell around a glowing core, lit from inside by a
 * point light. Everything it does is derived from the shared heartbeat clock,
 * the per-frame state (proximity, hold, neglect) and the director's targets.
 * Her touches arrive through HeartInput.
 */
export function Heart() {
  const gltf = useGLTF(HEART_URL);
  const geometry = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    const g = meshes[0]?.geometry;
    if (!g) throw new Error("heart.glb contains no mesh");
    if (!g.attributes.normal) g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [gltf]);

  const quality = useExperienceStore((s) => s.quality);
  const setReady = useExperienceStore((s) => s.setReady);
  const preset = QUALITY_PRESETS[quality];

  const shellMaterial = useMemo(() => new HeartShellMaterial(preset.transmission), [preset.transmission]);
  useEffect(() => () => shellMaterial.dispose(), [shellMaterial]);

  useEffect(() => {
    setHeartGeometry(geometry);
    setReady(true);
  }, [geometry, setReady]);

  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const coreBoost = preset.bloom ? 2.2 : 1.0;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const beat = heartbeat.intensity;
    const opacity = v.heartOpacity;
    const life = 1 - fs.neglect; // it dims when she leaves it alone
    const wake = v.wake * (0.06 + 0.94 * life);
    g.visible = opacity > 0.002;

    // lub-DUB in the body
    const scale = v.scale * (1 + 0.045 * beat + 0.05 * v.warmth + 0.04 * v.burst);
    g.scale.setScalar(scale);
    fs.heartRadius = 1.12 * scale;

    // slow sway, and a subtle turn toward her — never chasing the cursor
    const useGyro = fs.isMobile && fs.gyro.enabled;
    const px = useGyro ? fs.gyro.x : fs.pointerActive ? fs.pointer.x : 0;
    const py = useGyro ? fs.gyro.y : fs.pointerActive ? fs.pointer.y : 0;
    const follow = fs.reducedMotion ? 0 : 0.14 * (0.5 + 0.5 * fs.proximity);
    const ry = (Math.sin(t * 0.28) * 0.11 + px * follow) * v.sway;
    const rx = (Math.sin(t * 0.19) * 0.045 - py * follow * 0.6) * v.sway;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 2.5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 2.5, dt);
    g.position.y = v.heartY + Math.sin(t * 0.5) * 0.04 * v.sway;

    // shell
    const mat = shell.current?.material as HeartShellMaterial | undefined;
    if (mat) {
      const u = mat.uniforms;
      u.uBeat.value = beat;
      u.uWake.value = wake;
      u.uPulseR.value = heartbeat.isBeating ? heartbeat.timeSinceBeat * 2.1 : 10;
      u.uProximity.value = fs.proximity * life;
      u.uWarmth.value = v.warmth;
      mat.envMapIntensity = (0.2 + 1.0 * v.light) * (0.35 + 0.65 * life);
      mat.opacity = opacity * (preset.transmission ? 1 : 0.92);
    }

    // core
    if (core.current && coreMaterial.current) {
      const k = 0.04 + wake * (0.35 + coreBoost * beat) + v.burst * coreBoost * 1.2 + v.warmth * 0.8;
      coreMaterial.current.color.copy(CORE_COLOR).multiplyScalar(k);
      coreMaterial.current.opacity = opacity;
      core.current.scale.setScalar(0.58 * (1 + 0.1 * beat));
    }
    if (light.current) {
      light.current.intensity = opacity * (wake * (1.5 + 10 * beat) + v.burst * 24 + v.warmth * 6);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={core} geometry={geometry} scale={0.58}>
        <meshBasicMaterial ref={coreMaterial} color={palette.pulse} toneMapped={!preset.bloom} transparent />
      </mesh>
      <mesh ref={shell} geometry={geometry} material={shellMaterial} />
      <pointLight ref={light} color={palette.pulse} distance={9} decay={2} intensity={0} />
    </group>
  );
}
