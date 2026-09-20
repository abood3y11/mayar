# إلى مياري — Implementation Notes

Interactive cinematic experience: a living ruby heart is the interface. Warm crimson world, Makkawi Arabic copy,
her own strokes of light open the story and close it by writing her name.

Stack: Next.js 16 (App Router, TS) · React Three Fiber 9 · drei · postprocessing · GSAP · Zustand · motion · Web Audio.

## Chapters (src/types/experience.ts)

| # | Chapter | What happens | Ends when |
|---|---|---|---|
| 00 | GATE | warm world, "ادخلي بالصوت / بهدوء" | she chooses |
| 01 | DRAW | she draws with light; strokes drift to the centre; the site draws for her if she does not | enough strokes / time (FrameLoop) |
| 02 | FORM | first lub-DUB; strokes gather on the heart's surface | formLines end |
| 03 | BECOME | the drawing becomes a 3D ruby heart, first visible beat | becomeLines end |
| 04 | INTRO | why he built it → "المسيه يا مياري" | she touches it |
| 05 | TOUCH | first touch | touchLines end |
| 06 | PROXIMITY | BPM follows her hand; "قربي أكثر" | evenHere lines end |
| 07 | HOLD | hold it; warmth = progress; "خليكِ… لسه شوي" | hold complete + lines |
| 08 | ENTER | "تعالي أوريك حاجة" → camera dives through the surface (flash hides the cut) | timer |
| 09 | MEMORIES | inside: nebula, three memories (نضجك، صدقك، طفوليتك), threads of light | afterMemories end |
| 10 | QUIET | world fades; only the heart remains | quietLines end |
| 11 | LETTER | the letter, then the slow lines | slowLines end |
| 12 | FINAL_HOLD | "حطي يدك عليه مرة أخيرة" → "يحبك." / "مرة." | beats end |
| 13 | DISSOLVE | heart returns to her strokes; they write «مياري» | nameLines end |
| 14 | END | "أحبك يا مياري ❤️", heart keeps beating under her name | never |

**Vitality**: whenever the story waits for her hand (touch prompt, holds) and she does not touch the heart, it
slows, dims and stops (7 s grace + 12 s fade). One press brings it back. See `src/lib/vitality.ts`.

## Architecture

| Layer | Where | Rule |
|---|---|---|
| Copy & personal config | `src/config/experience.ts` | every visible sentence lives here |
| Memories | `src/data/memories.ts` | words, lines, positions, image paths |
| Art direction | `src/config/palette.ts` | warm crimson; brightest reds only pulse |
| Heartbeat engine | `src/lib/heartbeat.ts` | one clock, lub-DUB envelope, smooth BPM; everything derives from it |
| BPM policy | `src/lib/heartbeat-policy.ts` | chapter + proximity + hold → target BPM |
| Per-frame state | `src/lib/frame-state.ts` | pointer, proximity, hold, draw, neglect — never React state |
| Authored visuals | `src/lib/visual-state.ts` + `src/lib/director.ts` | GSAP tweens on chapter changes; the only place transitions live |
| Chapter state | `src/stores/experience-store.ts` | Zustand, low frequency only |
| WebGL | `src/components/experience/*`, `heart/*`, `memories/*` | persistent canvas, never remounted |
| Her strokes | `src/components/heart/Strokes.tsx` | one Points buffer for drawing → heart surface → her name |
| DOM overlay | `src/components/story/*` | text in space, no boxes |
| Audio | `src/lib/audio/audio-engine.ts` | synthesized heartbeat synced to beat events, optional music + analyser |
| Quality tiers | `src/lib/quality.ts` | low / medium / high; PerformanceMonitor steps down |

## Before sending it to her

- photos in `public/memories/01.jpg … 03.jpg` (the cards fall back to the word until then)
- optional licensed track at `public/audio/music.mp3` (starts with her first touch)
- read every line in `src/config/experience.ts` once more in your own voice

## Dev notes

- `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`
- `window.__heart` (dev only) exposes store, frameState, heartbeat, visualState
- `.stage[data-chapter]` mirrors the chapter for tests/CSS
