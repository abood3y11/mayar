import { director } from "@/lib/director";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

/** Opens the memory she touched — only the current one, in story order. */
export function openMemory(index: number) {
  const s = useExperienceStore.getState();
  if (s.chapter !== Chapter.MEMORIES || s.memoryOpen || s.memoryIndex !== index) return;
  s.setMemoryOpen(true);
  director.focusMemory(index);
}

/** Back to the constellation; the next memory becomes the current one. */
export function closeMemory() {
  const s = useExperienceStore.getState();
  if (!s.memoryOpen) return;
  director.unfocusMemory();
  s.setMemoryOpen(false);
  s.setMemoryIndex(s.memoryIndex + 1);
}
