"use client";

import { motion } from "motion/react";
import { experienceConfig } from "@/config/experience";
import { useExperienceStore } from "@/stores/experience-store";

/** Tiny, editorial. A dot that beats with the heart, and the number. */
export function BpmIndicator() {
  const bpm = useExperienceStore((s) => s.bpmDisplay);
  return (
    <motion.div
      className="bpm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6, delay: 1 }}
    >
      <span className="bpm-dot" aria-hidden />
      <span className="bpm-value">{bpm}</span>
      <span>{experienceConfig.proximity.bpmSuffix}</span>
    </motion.div>
  );
}
