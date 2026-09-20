"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { palette } from "@/config/palette";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";
import { threadFragment, threadVertex } from "@/shaders/thread";

interface Props {
  from: [number, number, number];
  to: [number, number, number];
  /** memory index whose focus sends light along this thread; -1 = ambient only */
  pulseFor: number;
  strength?: number;
}

const SEGMENTS = 40;

/** A crimson thread of light between two points inside the heart. */
export function LightThread({ from, to, pulseFor, strength = 1 }: Props) {
  const ref = useRef<THREE.Line>(null);

  const line = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= 0.35; // a little sag, like a thread
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(SEGMENTS);
    const positions = new Float32Array(pts.length * 3);
    const ts = new Float32Array(pts.length);
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      ts[i] = i / SEGMENTS;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aT", new THREE.BufferAttribute(ts, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: threadVertex,
      fragmentShader: threadFragment,
      uniforms: {
        uColor: { value: new THREE.Color(palette.aura) },
        uColorHot: { value: new THREE.Color(palette.strokeHot) },
        uAlpha: { value: 0 },
        uBeat: { value: 0 },
        uPulse: { value: -1 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geometry, material);
  }, [from, to]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame((state) => {
    const obj = ref.current;
    if (!obj) return;
    const u = (obj.material as THREE.ShaderMaterial).uniforms;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;
    u.uBeat.value = heartbeat.intensity;
    u.uAlpha.value = v.inside * 0.9 * strength;
    const focused = pulseFor >= 0 && v.focusIndex === pulseFor && v.focus > 0.2;
    u.uPulse.value = focused ? ((t * 0.55 + pulseFor * 0.3) % 1.3) - 0.15 : -1;
    obj.visible = v.inside > 0.01;
  });

  return <primitive ref={ref} object={line} renderOrder={2} />;
}
