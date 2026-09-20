import { layoutMemory, memories } from "@/data/memories";
import { director } from "@/lib/director";
import { useExperienceStore } from "@/stores/experience-store";
import { Chapter } from "@/types/experience";

const portrait = () => typeof window !== "undefined" && window.innerWidth < window.innerHeight;

/** Opens the word card she touched — only the current one, in story order. */
export function openMemory(index: number) {
  const s = useExperienceStore.getState();
  if (s.chapter !== Chapter.MEMORIES || s.memoryOpen || s.memoryIndex !== index) return;
  if (s.photoOpen >= 0) closePhoto();
  s.setMemoryOpen(true);
  director.focusMemory(index, layoutMemory(memories[index], portrait() ? 0.5 : 1.5));
}

/** Back to the constellation; the next word becomes the current one. */
export function closeMemory() {
  const s = useExperienceStore.getState();
  if (!s.memoryOpen) return;
  director.unfocus();
  s.setMemoryOpen(false);
  s.setMemoryIndex(s.memoryIndex + 1);
}

/** Approaches a photo. Ignored while a word card is open; tapping the same photo closes it. */
export function openPhoto(index: number, position: [number, number, number]) {
  const s = useExperienceStore.getState();
  if (s.chapter !== Chapter.MEMORIES || s.memoryOpen) return;
  if (s.photoOpen === index) {
    closePhoto();
    return;
  }
  s.setPhotoOpen(index);
  director.focusPhoto(index, position);
}

export function closePhoto() {
  const s = useExperienceStore.getState();
  if (s.photoOpen < 0) return;
  s.setPhotoOpen(-1);
  director.unfocus();
}
