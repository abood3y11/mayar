"use client";

import { useEffect, useState } from "react";
import { experienceConfig as C } from "@/config/experience";
import { director } from "@/lib/director";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { Line, StoryLines } from "./StoryLines";

/** 11 — the letter, then the slow lines. */
export function LetterStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const [stage, setStage] = useState(0);
  return (
    <>
      {stage === 0 && <StoryLines lines={C.letterLines} startDelay={2} onDone={() => setStage(1)} />}
      {stage === 1 && <StoryLines lines={C.slowLines} startDelay={1.6} onDone={() => setChapter(Chapter.FINAL_HOLD)} />}
    </>
  );
}

/** 12 — one last time. Two named beats at the end. */
export function FinalHoldStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const progress = useExperienceStore((s) => s.holdProgress);
  const done = useExperienceStore((s) => s.holdDone);
  const [armed, setArmed] = useState(false);
  const complete = armed && done;

  useEffect(() => {
    const id = window.setTimeout(() => {
      director.armHold(C.finalHold.durationSeconds);
      setArmed(true);
    }, 2200);
    return () => window.clearTimeout(id);
  }, []);

  const during = C.finalHold.during.filter((d) => progress >= d.at).pop();
  const holdingText = progress < 0.08 ? C.finalHold.prompt : (during?.text ?? C.finalHold.prompt);
  const beats = [
    { text: C.finalHold.beat1, hold: 2.2 },
    { text: C.finalHold.beat2, hold: 2.8 },
  ];

  return (
    <>
      <Line show={!complete} text={holdingText} className="touch-prompt" variant="low" />
      {complete && (
        <StoryLines
          lines={beats}
          startDelay={0.6}
          onLine={(i) => director.strongBeat(i === 0 ? 0.9 : 1)}
          onDone={() => setChapter(Chapter.DISSOLVE)}
        />
      )}
    </>
  );
}

/** 13 — the heart returns to her strokes; they write her name. */
export function DissolveStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const [stage, setStage] = useState(0);
  return (
    <>
      {stage === 0 && <StoryLines lines={C.dissolveLines} startDelay={1.6} onDone={() => setStage(1)} />}
      {stage === 1 && <StoryLines lines={C.nameLines} startDelay={0.8} onDone={() => setChapter(Chapter.END)} />}
    </>
  );
}

/** 14 — the last words. Then nothing else: the heart keeps beating. */
export function EndStory() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), 2600);
    return () => window.clearTimeout(id);
  }, []);
  return <Line show={show} text={C.ending} variant="bottom" className="ending" duration={2.4} />;
}
