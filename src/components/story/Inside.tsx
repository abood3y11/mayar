"use client";

import { useEffect, useState } from "react";
import { experienceConfig as C } from "@/config/experience";
import { memories } from "@/data/memories";
import { closeMemory, openMemory } from "@/lib/memory-flow";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";
import { StoryLines } from "./StoryLines";

/** 09 — inside the heart: three things he loves, one memory at a time. */
export function MemoriesStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  const setMemoryIndex = useExperienceStore((s) => s.setMemoryIndex);
  const memoryIndex = useExperienceStore((s) => s.memoryIndex);
  const memoryOpen = useExperienceStore((s) => s.memoryOpen);
  const [stage, setStage] = useState(0);

  const browsing = stage === 1 && memoryIndex >= 0 && memoryIndex < memories.length;
  const finished = stage === 1 && memoryIndex >= memories.length;

  // if she does not touch the glowing memory, it opens by itself
  useEffect(() => {
    if (!browsing || memoryOpen) return;
    const id = window.setTimeout(() => openMemory(memoryIndex), C.enter.autoOpenSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [browsing, memoryOpen, memoryIndex]);

  const current = browsing && memoryOpen ? memories[memoryIndex] : null;

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
    </>
  );
}

/** 10 — the world quiets; only the heart remains. */
export function QuietStory() {
  const setChapter = useExperienceStore((s) => s.setChapter);
  return <StoryLines lines={C.quietLines} startDelay={4} onDone={() => setChapter(Chapter.LETTER)} />;
}
