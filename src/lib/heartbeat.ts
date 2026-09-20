/**
 * HeartbeatClock — the single rhythm everything in the experience follows.
 *
 * One instance drives: heart scale, internal emissive, point light, particles,
 * camera response, the audio heartbeat and DOM pulses. Nothing else should keep
 * its own beat timer.
 *
 * Framework-agnostic: advance it with `update(dt)` from the render loop.
 */
export type BeatKind = "lub" | "dub";
export type BeatListener = (kind: BeatKind, strength: number) => void;

/** Fraction of the cycle at which the second sound (DUB) lands. */
const DUB_AT = 0.28;

/** Attack/decay impulse in seconds. Returns 0..1. */
function impulse(t: number, attack: number, decay: number): number {
  if (t < 0) return 0;
  if (t < attack) {
    const u = t / attack;
    return u * u * (3 - 2 * u); // smoothstep attack
  }
  return Math.exp(-(t - attack) / decay);
}

export class HeartbeatClock {
  /** smoothed, currently effective BPM */
  bpm = 55;
  /** where bpm is heading */
  targetBpm = 55;
  /** 0..1 position inside the current beat cycle */
  phase = 0;
  /** lub-DUB envelope, 0..1 — the value most systems should read */
  intensity = 0;
  /** total beats since the clock started beating */
  beatCount = 0;
  /** false = dormant (before the heart's first visible beat) */
  isBeating = false;
  /** global multiplier, e.g. lowered for prefers-reduced-motion */
  amplitude = 1;
  /** time constant (s) for BPM transitions — never jump */
  smoothing = 1.4;
  /** seconds since the last lub, useful for shaders */
  timeSinceBeat = 10;

  private lubFired = false;
  private dubFired = false;
  private listeners = new Set<BeatListener>();

  onBeat(listener: BeatListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Jump-free re-targeting. Clamped to sane values. */
  setTarget(bpm: number) {
    this.targetBpm = Math.min(200, Math.max(20, bpm));
  }

  start() {
    if (this.isBeating) return;
    this.isBeating = true;
    this.phase = 0;
    this.lubFired = false;
    this.dubFired = false;
  }

  stop() {
    this.isBeating = false;
  }

  /** The strength of a beat, 0..1: faster hearts beat harder. */
  get strength(): number {
    return Math.min(1, Math.max(0, (this.bpm - 40) / 90));
  }

  update(dt: number) {
    // BPM follows target with an exponential ease (frame-rate independent)
    const k = 1 - Math.exp(-dt / this.smoothing);
    this.bpm += (this.targetBpm - this.bpm) * k;
    this.timeSinceBeat += dt;

    if (!this.isBeating) {
      this.intensity *= Math.exp(-dt * 4);
      return;
    }

    this.phase += (dt * this.bpm) / 60;
    if (this.phase >= 1) {
      this.phase -= Math.floor(this.phase);
      this.beatCount += 1;
      this.lubFired = false;
      this.dubFired = false;
    }

    if (!this.lubFired) {
      this.lubFired = true;
      this.timeSinceBeat = 0;
      this.emit("lub", 0.7 + 0.3 * this.strength);
    }
    if (!this.dubFired && this.phase >= DUB_AT) {
      this.dubFired = true;
      this.emit("dub", 0.8 + 0.2 * this.strength);
    }

    this.intensity = this.envelope(this.phase) * this.amplitude;
  }

  /** lub-DUB envelope for a given phase: two asymmetric impulses per cycle. */
  envelope(phase: number): number {
    const period = 60 / this.bpm;
    const t = phase * period;
    const lub = impulse(t, 0.055, 0.11) * 0.62;
    const dub = impulse(t - DUB_AT * period, 0.04, 0.15) * 1.0;
    return Math.min(1, lub + dub);
  }

  private emit(kind: BeatKind, strength: number) {
    for (const l of this.listeners) l(kind, strength);
  }
}

/** The one clock. Import this everywhere. */
export const heartbeat = new HeartbeatClock();
