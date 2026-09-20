"use client";

import { AnimatePresence, motion } from "motion/react";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { BpmIndicator } from "./BpmIndicator";
import { DissolveStory, EndStory, FinalHoldStory, LetterStory } from "./Closing";
import { Gate } from "./Gate";
import { MemoriesStory, QuietStory } from "./Inside";
import { BecomeStory, DrawStory, FormStory, IntroStory } from "./Opening";
import { EnterStory, HoldStory, ProximityStory, TouchStory } from "./Touching";

const chapterFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.8 } },
  transition: { duration: 0.8 },
} as const;

const STORIES: Partial<Record<Chapter, () => React.JSX.Element>> = {
  [Chapter.DRAW]: DrawStory,
  [Chapter.FORM]: FormStory,
  [Chapter.BECOME]: BecomeStory,
  [Chapter.INTRO]: IntroStory,
  [Chapter.TOUCH]: TouchStory,
  [Chapter.PROXIMITY]: ProximityStory,
  [Chapter.HOLD]: HoldStory,
  [Chapter.ENTER]: EnterStory,
  [Chapter.MEMORIES]: MemoriesStory,
  [Chapter.QUIET]: QuietStory,
  [Chapter.LETTER]: LetterStory,
  [Chapter.FINAL_HOLD]: FinalHoldStory,
  [Chapter.DISSOLVE]: DissolveStory,
  [Chapter.END]: EndStory,
};

const WITH_BPM = new Set<Chapter>([Chapter.TOUCH, Chapter.PROXIMITY, Chapter.HOLD]);

/** DOM layer over the canvas. Text lives in space, not in boxes. */
export function Overlay() {
  const chapter = useExperienceStore((s) => s.chapter);
  const Story = STORIES[chapter];
  return (
    <div className="overlay">
      <div className="vignette" aria-hidden />
      <AnimatePresence mode="wait">
        {chapter === Chapter.GATE && <Gate key="gate" />}
        {Story && (
          <motion.div key={chapter} className="chapter" {...chapterFade}>
            <Story />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{WITH_BPM.has(chapter) && <BpmIndicator key="bpm" />}</AnimatePresence>
    </div>
  );
}
