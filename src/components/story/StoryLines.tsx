"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { frameState as fs } from "@/lib/frame-state";
import type { StoryLine } from "@/types/experience";

const ENTER = 1.3;
const EASE = [0.22, 1, 0.36, 1] as const;

export type StoryVariant = "default" | "center" | "low" | "bottom";

interface Props {
  lines: readonly StoryLine[];
  /** seconds before the first line */
  startDelay?: number;
  /** called when a line becomes visible */
  onLine?: (index: number) => void;
  /** called after the last line has faded out */
  onDone?: () => void;
  variant?: StoryVariant;
  className?: string;
}

/**
 * Shows lines one at a time, directly in space: opacity + a little lift,
 * no typewriter, no boxes.
 */
export function StoryLines({ lines, startDelay = 0.8, onLine, onDone, variant = "default", className }: Props) {
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (index >= lines.length) return;
    const delay = index === -1 ? startDelay : ENTER + lines[index].hold;
    const id = window.setTimeout(() => setIndex((i) => i + 1), delay * 1000);
    return () => window.clearTimeout(id);
  }, [index, lines, startDelay]);

  useEffect(() => {
    if (index >= 0 && index < lines.length) onLine?.(index);
    // onLine is a notification; re-running it on identity changes would double-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lines.length]);

  const line = index >= 0 && index < lines.length ? lines[index] : null;
  const lift = fs.reducedMotion ? 0 : 10;

  return (
    <div className={`story-anchor story-anchor--${variant}`}>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (index >= lines.length) onDone?.();
        }}
      >
        {line && (
          <motion.p
            key={index}
            className={`story-line ${className ?? ""}`}
            initial={{ opacity: 0, y: lift, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -lift * 0.6, filter: "blur(4px)", transition: { duration: 0.9, ease: EASE } }}
            transition={{ duration: ENTER, ease: EASE }}
          >
            <span className="pulse-text">{line.text}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A single persistent line that fades in/out with `show`. */
export function Line({
  show,
  text,
  variant = "default",
  className,
  duration = 1.6,
}: {
  show: boolean;
  text: string;
  variant?: StoryVariant;
  className?: string;
  duration?: number;
}) {
  return (
    <div className={`story-anchor story-anchor--${variant}`}>
      <AnimatePresence mode="wait">
        {show && (
          <motion.p
            key={text}
            className={`story-line ${className ?? ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration }}
          >
            <span className="pulse-text">{text}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
