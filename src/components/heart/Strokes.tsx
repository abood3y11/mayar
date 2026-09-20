"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { experienceConfig } from "@/config/experience";
import { palette } from "@/config/palette";
import { frameState as fs } from "@/lib/frame-state";
import { STROKE_MAX, getHeartSurface } from "@/lib/heart-geometry";
import { heartbeat } from "@/lib/heartbeat";
import { sampleNamePoints } from "@/lib/name-points";
import { visualState as v } from "@/lib/visual-state";
import { strokesFragment, strokesVertex } from "@/shaders/strokes";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

/** world units between points along a stroke */
const STEP = 0.03;
/** enough points to dress the heart, and later to write a name */
const MIN_POINTS = 1400;
/** when the site draws for her */
const AUTO_TOTAL = 1500;

interface DrawState {
  count: number;
  last: THREE.Vector3;
  lastValid: boolean;
  autoT: number;
  nameApplied: boolean;
  lastChapter: Chapter | null;
  storeSync: number;
}

type Attr = THREE.BufferAttribute;

function addPoint(g: THREE.BufferGeometry, d: DrawState, x: number, y: number, z: number, born: number) {
  if (d.count >= STROKE_MAX) return;
  const i = d.count;
  const surface = getHeartSurface();
  (g.attributes.position as Attr).setXYZ(i, x, y, z);
  const heart = g.attributes.aHeart as Attr;
  if (surface) heart.setXYZ(i, surface[i * 3], surface[i * 3 + 1], surface[i * 3 + 2]);
  else heart.setXYZ(i, x * 0.5, y * 0.5, 0);
  (g.attributes.aName as Attr).setXYZ(i, heart.getX(i), heart.getY(i), heart.getZ(i));
  (g.attributes.aSeed as Attr).setXYZ(i, Math.random(), Math.random(), Math.random());
  (g.attributes.aBorn as Attr).setX(i, born);
  d.count += 1;
}

/** upload only what changed since `from` */
function commit(g: THREE.BufferGeometry, d: DrawState, from: number) {
  const n = d.count - from;
  if (n <= 0) return;
  for (const name of ["position", "aHeart", "aName", "aSeed", "aBorn"]) {
    const a = g.attributes[name] as Attr;
    a.clearUpdateRanges();
    a.addUpdateRange(from * a.itemSize, n * a.itemSize);
    a.needsUpdate = true;
  }
  g.setDrawRange(0, d.count);
}

const jitter = (amount: number) => (Math.random() - 0.5) * amount;

/** add points from the last position to `to`, two per step so lines feel full */
function addAlong(g: THREE.BufferGeometry, d: DrawState, to: THREE.Vector3, time: number) {
  if (d.lastValid) {
    const dist = d.last.distanceTo(to);
    const steps = Math.max(1, Math.ceil(dist / STEP));
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      const x = d.last.x + (to.x - d.last.x) * k;
      const y = d.last.y + (to.y - d.last.y) * k;
      addPoint(g, d, x + jitter(0.008), y + jitter(0.008), jitter(0.01), time);
      addPoint(g, d, x + jitter(0.03), y + jitter(0.03), jitter(0.02), time);
    }
  } else {
    addPoint(g, d, to.x, to.y, 0, time);
    addPoint(g, d, to.x + jitter(0.03), to.y + jitter(0.03), jitter(0.02), time);
  }
  d.last.copy(to);
  d.lastValid = true;
}

/** if she drew only a little, echo her strokes so the heart and the name read well */
function ensureMinimum(g: THREE.BufferGeometry, d: DrawState, min: number, time: number) {
  const base = d.count;
  if (base === 0) return;
  const from = d.count;
  const pos = g.attributes.position as Attr;
  while (d.count < min && d.count < STROKE_MAX) {
    const i = Math.floor(Math.random() * base);
    addPoint(g, d, pos.getX(i) + jitter(0.07), pos.getY(i) + jitter(0.07), pos.getZ(i) + jitter(0.04), time - 1);
  }
  commit(g, d, from);
}

/** the site draws a heart for her, stroke by stroke */
function autoDraw(g: THREE.BufferGeometry, d: DrawState, n: number, time: number) {
  const from = d.count;
  for (let k = 0; k < n && d.count < AUTO_TOTAL; k++) {
    d.autoT += 0.012;
    const t = d.autoT % (Math.PI * 2);
    const s = d.autoT < Math.PI * 2 ? 0.085 : 0.062;
    const x = 16 * Math.pow(Math.sin(t), 3) * s;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s + 0.15;
    addPoint(g, d, x + jitter(0.012), y + jitter(0.012), jitter(0.01), time);
    addPoint(g, d, x + jitter(0.035), y + jitter(0.035), jitter(0.02), time);
    fs.draw.penX = x;
    fs.draw.penY = y;
  }
  commit(g, d, from);
}

/**
 * Her strokes of light. Drawn on a plane at z=0, they drift to the centre,
 * gather on the heart's surface, dissolve into it — and at the very end come
 * back to write her name.
 */
export function Strokes() {
  const points = useRef<THREE.Points>(null);
  const { camera, gl } = useThree();
  const ds = useRef<DrawState>({
    count: 0,
    last: new THREE.Vector3(),
    lastValid: false,
    autoT: 0,
    nameApplied: false,
    lastChapter: null,
    storeSync: 0,
  });

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const make = (size: number) => {
      const a = new THREE.BufferAttribute(new Float32Array(STROKE_MAX * size), size);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    geometry.setAttribute("position", make(3));
    geometry.setAttribute("aHeart", make(3));
    geometry.setAttribute("aName", make(3));
    geometry.setAttribute("aSeed", make(3));
    geometry.setAttribute("aBorn", make(1));
    geometry.setDrawRange(0, 0);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    const material = new THREE.ShaderMaterial({
      vertexShader: strokesVertex,
      fragmentShader: strokesFragment,
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uToHeart: { value: 0 },
        uToName: { value: 0 },
        uAttract: { value: 0 },
        uSize: { value: 1 },
        uPixelRatio: { value: 1 },
        uAlpha: { value: 0 },
        uColor: { value: new THREE.Color(palette.stroke) },
        uColorHot: { value: new THREE.Color(palette.strokeHot) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // pointer → drawing plane (z = 0)
  useEffect(() => {
    const el = gl.domElement;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();
    const toPlane = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray.intersectPlane(plane, hit);
    };
    const drawing = () => useExperienceStore.getState().chapter === Chapter.DRAW && !fs.draw.auto;

    const onDown = (e: PointerEvent) => {
      if (e.button > 0 || !drawing()) return;
      const p = toPlane(e);
      const obj = points.current;
      if (!p || !obj) return;
      const d = ds.current;
      d.lastValid = false;
      fs.draw.penDown = true;
      fs.draw.strokes += 1;
      if (fs.draw.firstAt < 0) fs.draw.firstAt = fs.time;
      const from = d.count;
      addAlong(obj.geometry, d, p, fs.time);
      commit(obj.geometry, d, from);
      fs.draw.points = d.count;
      fs.draw.lastAt = fs.time;
      fs.draw.penX = p.x;
      fs.draw.penY = p.y;
    };
    const onMove = (e: PointerEvent) => {
      const p = toPlane(e);
      if (!p) return;
      fs.draw.penX = p.x;
      fs.draw.penY = p.y;
      const obj = points.current;
      if (!fs.draw.penDown || !drawing() || !obj) return;
      const d = ds.current;
      const from = d.count;
      addAlong(obj.geometry, d, p, fs.time);
      commit(obj.geometry, d, from);
      fs.draw.points = d.count;
      fs.draw.lastAt = fs.time;
    };
    const onUp = () => {
      fs.draw.penDown = false;
      ds.current.lastValid = false;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl]);

  useFrame((state) => {
    const obj = points.current;
    if (!obj) return;
    const g = obj.geometry;
    const d = ds.current;
    const chapter = useExperienceStore.getState().chapter;

    if (chapter !== d.lastChapter) {
      d.lastChapter = chapter;
      if (chapter === Chapter.FORM) ensureMinimum(g, d, MIN_POINTS, fs.time);
      if (chapter === Chapter.DISSOLVE && !d.nameApplied) {
        d.nameApplied = true;
        const count = Math.max(1, d.count);
        void sampleNamePoints(experienceConfig.nameToDraw, count).then((pts) => {
          const name = g.attributes.aName as Attr;
          for (let i = 0; i < count; i++) name.setXYZ(i, pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
          name.clearUpdateRanges();
          name.needsUpdate = true;
        });
      }
    }

    if (chapter === Chapter.DRAW && fs.draw.auto && d.count < AUTO_TOTAL) {
      if (fs.draw.firstAt < 0) fs.draw.firstAt = fs.time;
      autoDraw(g, d, 22, fs.time);
      fs.draw.points = d.count;
      fs.draw.lastAt = fs.time;
    }

    if (state.clock.elapsedTime - d.storeSync > 0.4) {
      d.storeSync = state.clock.elapsedTime;
      useExperienceStore.getState().setDrawPoints(d.count);
    }

    const u = (obj.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = fs.time;
    u.uBeat.value = heartbeat.intensity;
    u.uToHeart.value = v.strokes.toHeart;
    u.uToName.value = v.strokes.toName;
    u.uAttract.value = v.strokes.attract;
    u.uAlpha.value = v.strokes.alpha;
    u.uSize.value = v.strokes.size;
    u.uPixelRatio.value = state.viewport.dpr;
    obj.visible = v.strokes.alpha > 0.003 && d.count > 0;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
