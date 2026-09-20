"use client";

import { useEffect, useState } from "react";
import { experienceConfig as C } from "@/config/experience";
import { memories, photos } from "@/data/memories";
import { closeMemory, closePhoto, openMemory } from "@/lib/memory-flow";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { Line, StoryLines } from "./StoryLines";

/** seconds a photo stays close before drifting back */
const PHOTO_SECONDS = 6;

/** 09 — inside the heart: three things he loves, one word at a time; her photos float around. */
export function MemoriesStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const setMemoryIndex = useExperienceStore((s) => s.setMemoryIndex);
  const memoryIndex = useExperienceStore((s) => s.memoryIndex);
  const memoryOpen = useExperienceStore((s) => s.memoryOpen);
  const photoOpen = useExperienceStore((s) => s.photoOpen);
  const [stage, setStage] = useState(0);

  const browsing = stage === 1 && memoryIndex >= 0 && memoryIndex < memories.length;
  const finished = stage === 1 && memoryIndex >= memories.length;

  // if she does not touch the glowing word, it opens by itself (not while she is looking at a photo)
  useEffect(() => {
    if (!browsing || memoryOpen || photoOpen >= 0) return;
    const id = window.setTimeout(() => openMemory(memoryIndex), C.enter.autoOpenSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [browsing, memoryOpen, memoryIndex, photoOpen]);

  // a photo drifts back on its own after a while
  useEffect(() => {
    if (photoOpen < 0) return;
    const id = window.setTimeout(closePhoto, PHOTO_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [photoOpen]);

  // leaving the chapter closes whatever is open
  useEffect(() => () => closePhoto(), []);

  const current = browsing && memoryOpen ? memories[memoryIndex] : null;
  const caption = photoOpen >= 0 ? photos[photoOpen]?.caption : undefined;

  return (
    <>
      {stage === 0 && (
        <StoryLines
          lines={C.enter.inside}
          startDelay={2.2}
          onDone={() => {
            setMemoryIndex(0);
            setStage(1);
          }}
        />
      )}
      {current && <StoryLines key={current.id} lines={current.lines} startDelay={1.8} variant="low" onDone={closeMemory} />}
      {finished && <StoryLines lines={C.afterMemories} startDelay={1.6} onDone={() => setChapter(Chapter.QUIET)} />}
      <Line show={!!caption && !memoryOpen} text={caption ?? ""} variant="low" className="caption" duration={1.2} />
    </>
  );
}

/** 10 — the world quiets; only the heart remains. */
export function QuietStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  return <StoryLines lines={C.quietLines} startDelay={4} onDone={() => setChapter(Chapter.LETTER)} />;
}
