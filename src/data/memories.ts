/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  جوّا القلب
 *
 *  1) ثلاث كلمات (نضجك، صدقك، طفوليتك): بطاقات كلام، القصة تمر عليها وحدة وحدة.
 *  2) الصور: مجموعة مستقلة، أي عدد تبغاه. كل صورة مربوطة بخيط ضوء للمنتصف،
 *     تطوف ببطء، ولمسها يقرّب الكاميرا منها. حطها في public/memories/photos/
 *     وضيفها في القائمة تحت. لو الملف مو موجود تظهر بطاقة ناعمة بدالها.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { StoryLine } from "@/types/experience";

export interface Memory {
  id: string;
  /** الكلمة على البطاقة */
  word: string;
  lines: StoryLine[];
  position: [number, number, number];
  rotation: [number, number, number];
  /** عرض البطاقة بالوحدات */
  width: number;
}

export const memories: Memory[] = [
  {
    id: "maturity",
    word: "نضجك",
    lines: [
      { text: "أحب نضجك...", hold: 2.6 },
      { text: "الطريقة اللي تفكري فيها، وكيف تشوفي أشياء يمكن غيرك ما ينتبه لها.", hold: 4 },
    ],
    position: [-2.2, 0.55, -4.3],
    rotation: [0, 0.38, 0.02],
    width: 1.7,
  },
  {
    id: "honesty",
    word: "صدقك",
    lines: [
      { text: "وأحب صدقك.", hold: 2.4 },
      { text: "حتى لمن الصدق مو أسهل حاجة تنقال.", hold: 3 },
      { text: "يمكن ما أقولها لك كثير...", hold: 2.6 },
      { text: "بس دي من أكثر الأشياء اللي تخليني أثق فيك.", hold: 3.6 },
    ],
    position: [2.4, -0.25, -5.3],
    rotation: [0, -0.42, -0.02],
    width: 1.7,
  },
  {
    id: "playfulness",
    word: "طفوليتك",
    lines: [
      { text: "وأحب طفوليتك.", hold: 2.4 },
      { text: "ودي بالذات لا تكبري منها 😂❤️", hold: 3 },
      { text: "لأن مهما كنتِ ناضجة وعاقلة...", hold: 2.8 },
      { text: "فجأة تطلع مياري الصغيرة من ولا مكان.", hold: 3.6 },
    ],
    position: [0.15, 1.45, -6.6],
    rotation: [0.06, 0.02, 0.03],
    width: 1.8,
  },
];

export interface Photo {
  image: string;
  /** جملة قصيرة تظهر لمن تلمس الصورة (اختياري) */
  caption?: string;
}

/** ── الصور: ضيفي أي عدد هنا ──────────────────────────────────────────────── */
export const photos: Photo[] = [
  { image: "/memories/photos/01.jpg" }, // TODO: بدّلها بصوركم
  { image: "/memories/photos/02.jpg" },
  { image: "/memories/photos/03.jpg" },
  { image: "/memories/photos/04.jpg" },
  { image: "/memories/photos/05.jpg" },
  { image: "/memories/photos/06.jpg" },
  { image: "/memories/photos/07.jpg" },
  { image: "/memories/photos/08.jpg" },
];

/** النقطة المضيئة في عمق القلب اللي كل الخيوط تروح لها */
export const NEBULA_CORE: [number, number, number] = [0, 0.2, -8];

type Vec3 = [number, number, number];

/**
 * Where a word card sits for a given viewport. Landscape uses the authored
 * position; portrait phones squeeze x, spread y and push everything deeper so
 * all three stay in frame.
 */
export function layoutMemory(memory: Memory, aspect: number): Vec3 {
  const [x, y, z] = memory.position;
  if (aspect >= 1) return [x, y, z];
  const k = Math.max(0.4, aspect / 1.2);
  return [x * k * 0.85, y * 1.7, z * 1.25];
}

/**
 * Photo positions for any count. The camera sits at the origin looking down -z
 * with a 62° vertical field of view, so the layout is solved on the screen
 * (projected coordinates): a sunflower spiral inside the visible frame, pushed
 * apart from the word cards and from each other, then given varied depths.
 * Deterministic.
 */
export function layoutPhotos(count: number, portrait: boolean, avoid: Vec3[]): Vec3[] {
  const halfH = Math.tan((62 / 2) * (Math.PI / 180)); // ≈ 0.6 at unit depth
  const halfW = halfH * (portrait ? 0.46 : 1.55);
  const boundX = halfW * 0.82;
  const boundY = halfH * 0.8;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const words = avoid.map(([x, y, z]) => ({ px: x / -z, py: y / -z }));

  const pts = Array.from({ length: count }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / count);
    const a = i * golden + 0.9;
    return {
      px: Math.cos(a) * r * boundX,
      py: Math.sin(a) * r * boundY,
      d: 4.8 + (((i * 7) % count) / Math.max(1, count - 1)) * 4.2, // 4.8 … 9 world units away
    };
  });

  const minWord = portrait ? 0.24 : 0.33;
  const minPhoto = portrait ? 0.15 : 0.21;
  for (let iter = 0; iter < 14; iter++) {
    for (const p of pts) {
      const push = (qx: number, qy: number, min: number) => {
        const dx = p.px - qx;
        const dy = p.py - qy;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d < min) {
          const k = ((min - d) / d) * 0.5;
          p.px += dx * k;
          p.py += dy * k;
        }
      };
      for (const w of words) push(w.px, w.py, minWord);
      for (const q of pts) if (q !== p) push(q.px, q.py, minPhoto);
      p.px = Math.max(-boundX, Math.min(boundX, p.px));
      p.py = Math.max(-boundY, Math.min(boundY, p.py));
    }
  }
  return pts.map(({ px, py, d }) => [px * d, py * d, -d] as Vec3);
}
