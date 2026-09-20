"use client";

import { useEffect, useState } from "react";
import { experienceConfig as C } from "@/config/experience";
import { frameState as fs } from "@/lib/frame-state";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { Line, StoryLines } from "./StoryLines";

/** 01 — she draws. A small hint if she hesitates. The loop ends the chapter. */
export function DrawStory() {
  const points = useExperienceStore((s) => s.drawPoints);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (points > 0) return;
    const id = window.setTimeout(() => setHint(true), C.draw.hintAfterSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [points]);

  return <Line show={hint && points === 0} text={C.draw.hint} variant="center" className="hint" />;
}

/** 02 — her strokes gather. */
export function FormStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  return <StoryLines lines={C.formLines} startDelay={1.4} onDone={() => setChapter(Chapter.BECOME)} />;
}

/** 03 — the drawing becomes a heart. */
export function BecomeStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  return <StoryLines lines={C.becomeLines} startDelay={0.6} onDone={() => setChapter(Chapter.INTRO)} />;
}

/** 04 — why he built it, then the invitation. */
export function IntroStory() {
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    if (!prompt) return;
    fs.touchEnabled = true;
    return () => {
      fs.touchEnabled = false;
    };
  }, [prompt]);

  return (
    <>
      {!prompt && <StoryLines lines={C.introLines} startDelay={1} onDone={() => setPrompt(true)} />}
      <Line show={prompt} text={C.touchPrompt} className="touch-prompt" duration={1.8} />
    </>
  );
}
