"use client";

import { useEffect, useState } from "react";
import { experienceConfig as C } from "@/config/experience";
import { director } from "@/lib/director";
import { frameState as fs } from "@/lib/frame-state";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { Line, StoryLines } from "./StoryLines";

/** 05 — she touched it. */
export function TouchStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  return <StoryLines lines={C.touchLines} startDelay={1.2} onDone={() => setChapter(Chapter.PROXIMITY)} />;
}

/** 06 — it beats faster when she is near. Three small moments. */
export function ProximityStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const [stage, setStage] = useState(0);

  // stage 1 waits for her to actually come close (or gives up after a while)
  useEffect(() => {
    if (stage !== 1) return;
    const started = performance.now();
    const id = window.setInterval(() => {
      if (fs.proximity > 0.72 || performance.now() - started > 12000) {
        window.clearInterval(id);
        setStage(2);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [stage]);

  return (
    <>
      {stage === 0 && <StoryLines lines={[C.proximity.comeCloser]} startDelay={2.6} onDone={() => setStage(1)} />}
      {stage === 2 && <StoryLines lines={[C.proximity.yes]} startDelay={0.2} onDone={() => setStage(3)} />}
      {stage === 3 && <StoryLines lines={C.proximity.evenHere} startDelay={1.2} onDone={() => setChapter(Chapter.HOLD)} />}
    </>
  );
}

/** 07 — hold it. Progress is the heart itself; the words follow her hand. */
export function HoldStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const progress = useExperienceStore((s) => s.holdProgress);
  const done = useExperienceStore((s) => s.holdDone);
  const [stage, setStage] = useState(0);

  const complete = stage === 1 && done;

  useEffect(() => {
    if (stage === 1) director.armHold(C.hold.durationSeconds);
  }, [stage]);

  useEffect(() => {
    if (complete) director.holdComplete();
  }, [complete]);

  const prompt = C.hold.intro[C.hold.intro.length - 1].text;
  const during = C.hold.during.filter((d) => progress >= d.at).pop();
  const holdingText = progress < 0.1 ? prompt : (during?.text ?? prompt);

  return (
    <>
      {stage === 0 && <StoryLines lines={C.hold.intro} startDelay={1.4} onDone={() => setStage(1)} />}
      <Line show={stage === 1 && !done} text={holdingText} className="touch-prompt" variant="low" />
      {complete && <StoryLines lines={C.hold.complete} startDelay={1.6} onDone={() => setChapter(Chapter.ENTER)} />}
    </>
  );
}

/** 08 — one line, then the camera travels inside. */
export function EnterStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const [diving, setDiving] = useState(false);

  useEffect(() => {
    if (!diving) return;
    director.enter();
    const id = window.setTimeout(() => setChapter(Chapter.MEMORIES), 5600);
    return () => window.clearTimeout(id);
  }, [diving, setChapter]);

  return <>{!diving && <StoryLines lines={[C.enter.line]} startDelay={1} onDone={() => setDiving(true)} />}</>;
}
