/** Chapters of the experience, in narrative order. */
export enum Chapter {
  GATE = "GATE", // sound / quiet
  DRAW = "DRAW", // she draws with light; her strokes drift to the centre
  FORM = "FORM", // first lub-DUB; strokes gather into a heart of light
  BECOME = "BECOME", // the drawing becomes a 3D heart and beats
  INTRO = "INTRO", // why he built it; "المسيه يا مياري"
  TOUCH = "TOUCH", // first touch
  PROXIMITY = "PROXIMITY", // it beats faster when she is near
  HOLD = "HOLD", // hold it; it calms with her
  ENTER = "ENTER", // camera travels inside
  MEMORIES = "MEMORIES", // three things he loves
  QUIET = "QUIET", // the world quiets; only the heart remains
  LETTER = "LETTER", // the letter
  FINAL_HOLD = "FINAL_HOLD", // one last time
  DISSOLVE = "DISSOLVE", // the heart returns to her strokes; they write her name
  END = "END", // أحبك يا مياري
}

export type AudioMode = "unset" | "sound" | "quiet";

export type QualityTier = "low" | "medium" | "high";

export interface QualityPreset {
  /** [min, max] device pixel ratio clamp */
  dpr: [number, number];
  bloom: boolean;
  /** MeshPhysicalMaterial transmission (real refraction). Expensive on phones. */
  transmission: boolean;
  dustCount: number;
  envResolution: number;
}

export interface StoryLine {
  text: string;
  /** seconds the line stays fully visible before the next one */
  hold: number;
}
