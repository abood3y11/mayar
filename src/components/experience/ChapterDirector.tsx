"use client";

import { useEffect } from "react";
import { director } from "@/lib/director";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

/**
 * Maps chapter changes to authored transitions. Chapters whose visuals are
 * triggered mid-story (ENTER, hold completion, the final beats) are driven by
 * their story components through the same director.
 */
export function ChapterDirector() {
  const chapter = useExperienceStore((s) => s.chapter);
  useEffect(() => {
    switch (chapter) {
      case Chapter.GATE:
        director.gate();
        break;
      case Chapter.DRAW:
        director.draw();
        break;
      case Chapter.FORM:
        director.form();
        break;
      case Chapter.BECOME:
        director.become();
        break;
      case Chapter.INTRO:
        director.intro();
        break;
      case Chapter.TOUCH:
        director.touch();
        break;
      case Chapter.PROXIMITY:
        director.proximity();
        break;
      case Chapter.HOLD:
        director.hold();
        break;
      case Chapter.QUIET:
        director.quiet();
        break;
      case Chapter.LETTER:
        director.letter();
        break;
      case Chapter.FINAL_HOLD:
        director.finalHold();
        break;
      case Chapter.DISSOLVE:
        director.dissolve();
        break;
      case Chapter.END:
        director.end();
        break;
      default:
        break;
    }
  }, [chapter]);
  return null;
}
