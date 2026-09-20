/**
 * The heart remembers her visits — localStorage only, never displayed as a
 * number. Used to change small details between visits.
 */
const KEY = "our-heart:visits";

export interface VisitMemory {
  count: number;
  isReturning: boolean;
  firstVisit: number;
  lastVisit: number | null;
}

interface Stored {
  count: number;
  firstVisit: number;
  lastVisit: number;
}

let recorded: VisitMemory | null = null;

/** Records this page load once (safe under StrictMode double effects). */
export function recordVisit(): VisitMemory {
  if (recorded) return recorded;
  const now = Date.now();
  const fallback: VisitMemory = { count: 1, isReturning: false, firstVisit: now, lastVisit: null };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    const prev = raw ? (JSON.parse(raw) as Stored) : null;
    const memory: VisitMemory = prev
      ? { count: prev.count + 1, isReturning: true, firstVisit: prev.firstVisit, lastVisit: prev.lastVisit }
      : fallback;
    const next: Stored = { count: memory.count, firstVisit: memory.firstVisit, lastVisit: now };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    recorded = memory;
    return memory;
  } catch {
    recorded = fallback;
    return fallback;
  }
}
