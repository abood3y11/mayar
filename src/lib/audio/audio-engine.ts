/**
 * AudioEngine — Web Audio, no autoplay. Created only after "Enter with sound".
 *
 * Layers:
 *  - heartbeat: synthesized lub-DUB driven by the HeartbeatClock beat events,
 *    so sound and visuals can never drift apart.
 *  - music: optional looped track (config.audio.music) with a slow fade-in and
 *    an analyser exposing bass/energy to the environment.
 *
 * Every gain change is a ramp. Nothing is ever loud.
 */
import { experienceConfig } from "@/config/experience";
import { frameState } from "@/lib/frame-state";
import { heartbeat, type BeatKind } from "@/lib/heartbeat";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private heartBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicLoading: Promise<boolean> | null = null;
  private unsubscribeBeat: (() => void) | null = null;

  get enabled() {
    return this.ctx !== null;
  }

  get musicPlaying() {
    return this.musicSource !== null;
  }

  /** Must be called from a user gesture. Safe to call twice. */
  init() {
    if (this.ctx || typeof window === "undefined") return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.master.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);

    this.heartBus = ctx.createGain();
    this.heartBus.gain.value = 0;
    this.heartBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.musicBus);

    // short noise buffer for the "thump" texture
    const len = Math.floor(ctx.sampleRate * 0.25);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;

    if (ctx.state === "suspended") void ctx.resume();

    this.unsubscribeBeat = heartbeat.onBeat((kind, strength) => this.playBeat(kind, strength));

    // iOS/Safari: keep the context alive when the tab comes back
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ctx.state === "suspended") void ctx.resume();
    });
  }

  /** 0..1 — how present the heartbeat is. Ramped, never stepped. */
  setHeartbeatLevel(level: number, seconds = 1.5) {
    if (!this.ctx || !this.heartBus) return;
    const target = Math.max(0, Math.min(1, level)) * experienceConfig.audio.heartbeatVolume;
    const g = this.heartBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(target, this.ctx.currentTime + seconds);
  }

  private playBeat(kind: BeatKind, strength: number) {
    const ctx = this.ctx;
    if (!ctx || !this.heartBus || !this.noiseBuffer) return;
    if (this.heartBus.gain.value < 0.005) return;
    const t = ctx.currentTime;
    const isLub = kind === "lub";
    const peak = (isLub ? 0.5 : 0.72) * strength;

    // body: low sine with a falling pitch
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(isLub ? 64 : 54, t);
    osc.frequency.exponentialRampToValueAtTime(isLub ? 40 : 34, t + (isLub ? 0.14 : 0.11));
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.009);
    env.gain.exponentialRampToValueAtTime(0.0001, t + (isLub ? 0.2 : 0.16));
    osc.connect(env).connect(this.heartBus);
    osc.start(t);
    osc.stop(t + 0.25);

    // texture: a filtered noise tick
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = isLub ? 120 : 95;
    bp.Q.value = 0.8;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.0001, t);
    nEnv.gain.exponentialRampToValueAtTime(0.11 * strength, t + 0.006);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    noise.connect(bp).connect(nEnv).connect(this.heartBus);
    noise.start(t);
    noise.stop(t + 0.12);
  }

  /** Fetches and decodes the music track once. Resolves false if it is missing. */
  loadMusic(url: string = experienceConfig.audio.music): Promise<boolean> {
    if (this.musicLoading) return this.musicLoading;
    this.musicLoading = (async () => {
      const ctx = this.ctx;
      if (!ctx) return false;
      try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) return false;
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("text/html")) return false; // Next dev returns 404 pages as HTML
        const bytes = await res.arrayBuffer();
        this.musicBuffer = await ctx.decodeAudioData(bytes);
        return true;
      } catch {
        return false;
      }
    })();
    return this.musicLoading;
  }

  /** Starts the loop with a long fade. No-op without a decoded track. */
  async startMusic(fadeSeconds = experienceConfig.audio.musicFadeIn, volume = experienceConfig.audio.musicVolume) {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.analyser || this.musicSource) return;
    const ok = await this.loadMusic();
    if (!ok || !this.musicBuffer || this.musicSource) return;
    const src = ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = true;
    src.connect(this.analyser);
    src.start();
    this.musicSource = src;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(0, ctx.currentTime);
    g.linearRampToValueAtTime(volume, ctx.currentTime + fadeSeconds);
  }

  setMusicLevel(volume: number, seconds = 2) {
    if (!this.ctx || !this.musicBus) return;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(volume, this.ctx.currentTime + seconds);
  }

  /** Called every frame: feeds music analysis into frameState.audio. */
  update(dt: number) {
    const a = frameState.audio;
    if (!this.analyser || !this.analyserData || !this.musicSource) {
      a.energy *= Math.exp(-dt * 2);
      a.bass *= Math.exp(-dt * 2);
      return;
    }
    this.analyser.getByteFrequencyData(this.analyserData);
    const d = this.analyserData;
    let bass = 0;
    for (let i = 1; i <= 6; i++) bass += d[i];
    bass /= 6 * 255;
    let energy = 0;
    const n = Math.min(d.length, 96);
    for (let i = 0; i < n; i++) energy += d[i];
    energy /= n * 255;
    const k = 1 - Math.exp(-dt * 6);
    a.bass += (bass - a.bass) * k;
    a.energy += (energy - a.energy) * k;
  }

  dispose() {
    this.unsubscribeBeat?.();
    this.musicSource?.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.musicSource = null;
  }
}

export const audioEngine = new AudioEngine();
