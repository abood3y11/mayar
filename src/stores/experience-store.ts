import { create } from "zustand";
import { Chapter, type AudioMode, type QualityTier } from "@/types/experience";
import type { VisitMemory } from "@/lib/visits";

/**
 * Low-frequency experience state. Per-frame values (proximity, beat, hold
 * progress) live in `lib/frame-state.ts` and never pass through React;
 * the loop mirrors a few of them here, throttled, for the DOM.
 */
interface ExperienceState {
  chapter: Chapter;
  audioMode: AudioMode;
  quality: QualityTier;
  /** the heart model has loaded — the gate may open */
  ready: boolean;
  /** number of times she has touched the heart */
  touches: number;
  /** kept silently; never shown as a number */
  visit: VisitMemory | null;
  /** throttled BPM for the DOM indicator (updated ~4×/s) */
  bpmDisplay: number;
  /** throttled count of points she has drawn */
  drawPoints: number;
  /** hold progress mirrored for the DOM, in 0.05 steps */
  holdProgress: number;
  holdDone: boolean;
  /** memory flow: which memory is next, whether one is open */
  memoryIndex: number;
  memoryOpen: boolean;

  setChapter: (chapter: Chapter) => void;
  setAudioMode: (mode: AudioMode) => void;
  setQuality: (tier: QualityTier) => void;
  setReady: (ready: boolean) => void;
  setVisit: (visit: VisitMemory) => void;
  registerTouch: () => void;
  setBpmDisplay: (bpm: number) => void;
  setDrawPoints: (n: number) => void;
  setHold: (progress: number, done: boolean) => void;
  setMemoryIndex: (i: number) => void;
  setMemoryOpen: (open: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>()((set) => ({
  chapter: Chapter.GATE,
  audioMode: "unset",
  quality: "medium",
  ready: false,
  touches: 0,
  visit: null,
  bpmDisplay: 0,
  drawPoints: 0,
  holdProgress: 0,
  holdDone: false,
  memoryIndex: -1,
  memoryOpen: false,

  setChapter: (chapter) => set({ chapter }),
  setAudioMode: (audioMode) => set({ audioMode }),
  setQuality: (quality) => set({ quality }),
  setReady: (ready) => set({ ready }),
  setVisit: (visit) => set({ visit }),
  registerTouch: () => set((s) => ({ touches: s.touches + 1 })),
  setBpmDisplay: (bpmDisplay) => set((s) => (s.bpmDisplay === bpmDisplay ? s : { bpmDisplay })),
  setDrawPoints: (drawPoints) => set((s) => (s.drawPoints === drawPoints ? s : { drawPoints })),
  setHold: (holdProgress, holdDone) =>
    set((s) => (s.holdProgress === holdProgress && s.holdDone === holdDone ? s : { holdProgress, holdDone })),
  setMemoryIndex: (memoryIndex) => set({ memoryIndex }),
  setMemoryOpen: (memoryOpen) => set({ memoryOpen }),
}));
