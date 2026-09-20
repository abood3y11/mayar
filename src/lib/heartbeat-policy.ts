import { experienceConfig } from "@/config/experience";
import { Chapter } from "@/types/experience";
import type { FrameState } from "./frame-state";

const B = experienceConfig.bpm;

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

/**
 * Decides where the heart rate should be heading this frame.
 * Pure function: chapter + per-frame state → target BPM.
 */
export function computeTargetBpm(chapter: Chapter, fs: FrameState): number {
  let bpm: number;
  switch (chapter) {
    case Chapter.GATE:
    case Chapter.DRAW:
      bpm = B.dormant;
      break;
    case Chapter.FORM:
    case Chapter.BECOME:
      bpm = B.idle + 4;
      break;
    case Chapter.INTRO:
      bpm = lerp(B.idle, B.approaching, fs.proximity);
      break;
    case Chapter.TOUCH:
      bpm = lerp(B.approaching, B.close, fs.proximity);
      break;
    case Chapter.PROXIMITY: {
      const near =
        fs.proximity < 0.5
          ? lerp(B.idle, B.approaching, fs.proximity * 2)
          : lerp(B.approaching, B.close, (fs.proximity - 0.5) * 2);
      bpm = fs.touching ? Math.max(near, B.touched - 8) : near;
      break;
    }
    case Chapter.HOLD:
      bpm = fs.holdDone ? B.calm : lerp(B.close, B.held, fs.holdProgress);
      break;
    case Chapter.ENTER:
    case Chapter.MEMORIES:
      bpm = B.memory;
      break;
    case Chapter.QUIET:
      bpm = B.calm;
      break;
    case Chapter.LETTER:
      bpm = B.letter;
      break;
    case Chapter.FINAL_HOLD:
      bpm = fs.holdDone ? B.calm : lerp(B.calm, B.held, fs.holdProgress);
      break;
    case Chapter.DISSOLVE:
      bpm = B.calm + 4;
      break;
    case Chapter.END:
      bpm = B.calm;
      break;
    default:
      bpm = B.idle;
  }
  // a touch leaves a trace that fades over a few seconds
  bpm += fs.excitation * (B.touched - B.approaching);
  if (fs.pressing && !fs.holdEnabled) bpm += 6;
  return Math.min(B.max, Math.max(B.min, bpm));
}
