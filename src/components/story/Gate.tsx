"use client";

import { AnimatePresence, motion } from "motion/react";
import { experienceConfig } from "@/config/experience";
import { audioEngine } from "@/lib/audio/audio-engine";
import { frameState as fs } from "@/lib/frame-state";
import { enableGyro } from "@/lib/gyro";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter, type AudioMode } from "@/types/experience";

/**
 * Chapter 00. The warm world, one sentence about headphones and two ways in.
 * Audio and device-tilt permissions are requested here, inside her tap.
 */
export function Gate() {
  const ready = useExperienceStore((s) => s.ready);
  const { gate } = experienceConfig;

  const enter = (mode: AudioMode) => {
    const store = useExperienceStore.getState();
    if (mode === "sound") {
      audioEngine.init(); // AudioContext must be born inside a user gesture
      void audioEngine.loadMusic();
    }
    if (fs.isMobile) void enableGyro();
    store.setAudioMode(mode);
    store.setChapter(Chapter.DRAW);
  };

  return (
    <motion.div
      className="gate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2 } }}
      transition={{ duration: 1.6, delay: 0.3 }}
    >
      <p className="gate-headline">{gate.headline}</p>
      <div className="gate-options">
        <AnimatePresence mode="wait">
          {ready ? (
            <motion.div
              key="options"
              className="gate-options-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <button type="button" className="gate-option" onClick={() => enter("sound")}>
                {gate.withSound}
              </button>
              <button type="button" className="gate-option" onClick={() => enter("quiet")}>
                {gate.quietly}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              className="gate-loading"
              role="status"
              aria-label="Loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 1 }}
            >
              <span className="breath-dot" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
