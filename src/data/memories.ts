/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  الذكريات جوّا القلب — ثلاث حاجات يحبها فيها
 *  بدّل الصور في public/memories/ (01.jpg، 02.jpg، 03.jpg). لو الصورة مو
 *  موجودة، تظهر بطاقة بالكلمة نفسها بدالها. الكلام هنا هو اللي يظهر لمن تفتح
 *  الذكرى. المواقع في الفضاء الداخلي للقلب.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { StoryLine } from "@/types/experience";

export interface Memory {
  id: string;
  /** الكلمة على البطاقة */
  word: string;
  image: string;
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
    image: "/memories/01.jpg", // TODO: بدّلها بصورة
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
    image: "/memories/02.jpg", // TODO: بدّلها بصورة
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
    image: "/memories/03.jpg", // TODO: بدّلها بصورة
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

/** النقطة المضيئة في عمق القلب اللي كل الخيوط تروح لها */
export const NEBULA_CORE: [number, number, number] = [0, 0.2, -8];

/**
 * Where a memory sits for a given viewport. Landscape uses the authored
 * position; portrait phones squeeze x, spread y and push everything deeper so
 * all three stay in frame.
 */
export function layoutMemory(memory: Memory, aspect: number): [number, number, number] {
  const [x, y, z] = memory.position;
  if (aspect >= 1) return [x, y, z];
  const k = Math.max(0.4, aspect / 1.2);
  return [x * k * 0.85, y * 1.7, z * 1.25];
}
