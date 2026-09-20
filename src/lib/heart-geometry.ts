import * as THREE from "three";
import { makeRandom } from "./random";

/** Max number of points in her strokes; also the size of the surface sample. */
export const STROKE_MAX = 6000;

let surface: Float32Array | null = null;
let source: THREE.BufferGeometry | null = null;

/** Called once by the Heart when the model is ready. */
export function setHeartGeometry(geometry: THREE.BufferGeometry) {
  if (source === geometry) return;
  source = geometry;
  surface = sampleSurface(geometry, STROKE_MAX);
}

/** Random points on the heart's surface (object space), `STROKE_MAX * 3` floats. */
export function getHeartSurface(): Float32Array | null {
  return surface;
}

function sampleSurface(geometry: THREE.BufferGeometry, count: number): Float32Array {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const index = geometry.index;
  const triCount = index ? index.count / 3 : pos.count / 3;
  const cumulative = new Float64Array(triCount);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  let total = 0;
  const tri = (i: number) => {
    const ia = index ? index.getX(i * 3) : i * 3;
    const ib = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const ic = index ? index.getX(i * 3 + 2) : i * 3 + 2;
    a.fromBufferAttribute(pos, ia);
    b.fromBufferAttribute(pos, ib);
    c.fromBufferAttribute(pos, ic);
  };
  for (let i = 0; i < triCount; i++) {
    tri(i);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    total += ab.cross(ac).length() * 0.5;
    cumulative[i] = total;
  }
  const out = new Float32Array(count * 3);
  const random = makeRandom(7);
  for (let k = 0; k < count; k++) {
    const r = random() * total;
    let lo = 0;
    let hi = triCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    tri(lo);
    let u = random();
    let w = random();
    if (u + w > 1) {
      u = 1 - u;
      w = 1 - w;
    }
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    out[k * 3] = a.x + ab.x * u + ac.x * w;
    out[k * 3 + 1] = a.y + ab.y * u + ac.y * w;
    out[k * 3 + 2] = a.z + ab.z * u + ac.z * w;
  }
  return out;
}
