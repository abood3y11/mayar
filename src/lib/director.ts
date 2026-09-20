/**
 * Director — the only place that authors transitions between chapters.
 * It tweens `visualState` with GSAP, starts/stops the heartbeat and talks to
 * the audio engine. Components never tween these values themselves.
 */
import gsap from "gsap";
import { experienceConfig } from "@/config/experience";
import { audioEngine } from "@/lib/audio/audio-engine";
import { frameState as fs } from "@/lib/frame-state";
import { heartbeat } from "@/lib/heartbeat";
import { visualState as v } from "@/lib/visual-state";

const S = v.strokes;
const EASE = "power2.inOut";

function kill() {
  gsap.killTweensOf(v);
  gsap.killTweensOf(S);
}

/** a short flare on the heart that fades by itself */
function flare(strength: number) {
  gsap.killTweensOf(v, "burst");
  gsap
    .timeline()
    .to(v, { burst: strength, duration: 0.12, ease: "power2.out" })
    .to(v, { burst: 0, duration: 2.2, ease: "power3.out" });
}

export const director = {
  /** 00 — sound gate. Nothing exists yet but the warm world. */
  gate() {
    kill();
    heartbeat.stop();
    Object.assign(v, { heartOpacity: 0, aura: 0, dust: 0.35, bgDepth: 0.15, inside: 0, sway: 0, warmth: 0, scale: 1, heartY: 0 });
    Object.assign(S, { alpha: 0, toHeart: 0, toName: 0, attract: 0 });
  },

  /** 01 — she draws with light. */
  draw() {
    kill();
    v.sway = 0;
    gsap.to(v, { bgDepth: 0.05, dust: 0.45, camDistMul: 1.35, duration: 2, ease: EASE });
    gsap.to(S, { alpha: 1, duration: 0.6 });
  },

  /** 02 — first lub-DUB. Her strokes gather into a heart of light. */
  form() {
    kill();
    heartbeat.start();
    fs.excitation = 0.9;
    if (audioEngine.enabled) audioEngine.setHeartbeatLevel(1, 0.8);
    gsap.to(S, { attract: 1, duration: 1.2, ease: "power2.in" });
    gsap.to(S, { toHeart: 1, duration: 5, ease: EASE, delay: 0.5 });
    gsap.to(v, { aura: 0.5, duration: 3, delay: 2.5, ease: EASE });
    gsap.to(v, { camDistMul: 1.15, duration: 5.5, ease: EASE });
  },

  /** 03 — the drawing becomes a ruby heart and beats for the first time. */
  become() {
    kill();
    gsap.to(v, { heartOpacity: 1, duration: 3.2, ease: EASE });
    gsap.to(S, { alpha: 0, duration: 3, delay: 1.4, ease: "power2.in" });
    gsap.to(v, { aura: 0.8, light: 1, dust: 0.7, sway: 1, wake: 0.8, duration: 3, delay: 1, ease: EASE });
    gsap.delayedCall(1.6, () => {
      fs.excitation = 1;
      flare(0.5);
    });
  },

  /** 04 — why he built it. */
  intro() {
    gsap.to(v, { camDistMul: 1.0, duration: 3, ease: EASE });
  },

  /** 05 — her first touch. The song arrives now, slowly. */
  touch() {
    fs.excitation = 1;
    flare(0.9);
    gsap.to(v, { camDistMul: 0.95, duration: 2.4, ease: EASE });
    if (audioEngine.enabled) void audioEngine.startMusic();
  },

  /** 06 — proximity play. */
  proximity() {
    gsap.to(v, { camDistMul: 0.94, duration: 2, ease: EASE });
  },

  /** 07 — hold it. The story arms the hold once it has asked her to. */
  hold() {
    fs.holdEnabled = false;
    fs.holdProgress = 0;
    fs.holdDone = false;
    gsap.to(v, { camDistMul: 0.98, duration: 2.4, ease: EASE });
  },

  /** start counting her hand on the heart; progress lives in frameState, warmth follows it */
  armHold(seconds: number) {
    fs.holdProgress = 0;
    fs.holdDone = false;
    fs.holdDuration = seconds;
    fs.holdEnabled = true;
  },

  /** the hold completed: a strong beat, then it calms, warm. */
  holdComplete() {
    fs.holdEnabled = false;
    fs.excitation = 1;
    flare(0.8);
    gsap.to(v, { warmth: 0.55, camDistMul: 0.86, duration: 2.6, ease: EASE });
  },

  /** 08 — the camera travels through the surface into the heart. */
  enter() {
    kill();
    const tl = gsap.timeline();
    tl.to(v, { camDistMul: 0.03, duration: 3.4, ease: "power3.in" }, 0)
      .to(v, { heartOpacity: 0, duration: 0.9, ease: "power2.in" }, 2.5)
      .to(v, { flash: 1, duration: 0.55, ease: "power2.in" }, 2.85)
      .add(() => {
        Object.assign(v, { inside: 1, aura: 0, warmth: 0, bgDepth: 0.8, dust: 0.2, camDistMul: 1.35, sway: 1, focus: 0, focusIndex: -1 });
      }, 3.4)
      .to(v, { flash: 0, duration: 1.8, ease: "power2.out" }, 3.5);
  },

  /** inside — approach a memory */
  focusMemory(index: number) {
    v.focusIndex = index;
    fs.excitation = 0.6;
    gsap.killTweensOf(v, "focus");
    gsap.to(v, { focus: 1, duration: 2.2, ease: EASE });
  },

  /** inside — back to the constellation */
  unfocusMemory() {
    gsap.killTweensOf(v, "focus");
    gsap.to(v, { focus: 0, duration: 1.8, ease: EASE });
  },

  /** 10 — the world quiets; only the heart remains. */
  quiet() {
    kill();
    const tl = gsap.timeline();
    tl.to(v, { inside: 0, duration: 3, ease: EASE }, 0)
      .add(() => {
        Object.assign(v, { camDistMul: 1.4, heartY: 0, scale: 1, focus: 0, focusIndex: -1 });
      }, 1.4)
      .to(v, { heartOpacity: 1, aura: 0.35, light: 0.7, dust: 0.18, bgDepth: 0.55, wake: 0.6, duration: 3.5, ease: EASE }, 2.2);
    if (audioEngine.enabled) audioEngine.setMusicLevel(experienceConfig.audio.musicVolume * 0.55, 4);
  },

  /** 11 — the letter. Small heart, deep world, slow beat. */
  letter() {
    gsap.to(v, { camDistMul: 1.55, bgDepth: 0.65, aura: 0.28, dust: 0.12, duration: 4, ease: EASE });
  },

  /** 12 — one last time. */
  finalHold() {
    fs.holdEnabled = false;
    fs.holdProgress = 0;
    fs.holdDone = false;
    gsap.to(v, { camDistMul: 0.95, bgDepth: 0.4, aura: 0.6, light: 0.9, dust: 0.3, wake: 0.8, duration: 3, ease: EASE });
    if (audioEngine.enabled) audioEngine.setMusicLevel(experienceConfig.audio.musicVolume, 3);
  },

  /** a named beat during the final hold */
  strongBeat(strength: number) {
    fs.excitation = strength;
    flare(0.5 * strength);
  },

  /** 13 — the heart returns to her strokes, and they write her name. */
  dissolve() {
    fs.holdEnabled = false;
    kill();
    v.sway = 0;
    Object.assign(S, { toHeart: 1, toName: 0, attract: 1 });
    const tl = gsap.timeline();
    tl.to(S, { alpha: 1, duration: 1.8 }, 0)
      .to(v, { heartOpacity: 0, aura: 0.25, warmth: 0, duration: 2.4, ease: EASE }, 0.8)
      .to(v, { camDistMul: 1.25, duration: 4, ease: EASE }, 1.5)
      .to(S, { toName: 1, duration: 4.2, ease: EASE }, 2.8);
  },

  /** 14 — last big beat; the heart comes back small, under her name, and keeps beating. */
  end() {
    fs.excitation = 1;
    flare(0.6);
    Object.assign(v, { heartY: -1.55, scale: 0.5 });
    gsap.to(v, { heartOpacity: 0.9, aura: 0.3, wake: 0.7, duration: 3.5, ease: EASE, delay: 0.6 });
    gsap.to(v, { camDistMul: 1.45, duration: 4, ease: EASE });
  },
};
