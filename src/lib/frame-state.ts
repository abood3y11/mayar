/**
 * Mutable per-frame state shared between the render loop, the heart, the
 * camera rig, particles and the DOM — WITHOUT going through React state.
 * React (Zustand) only holds low-frequency state such as the chapter.
 */
export const frameState = {
  /** pointer in normalized device coords (-1..1). Last known position. */
  pointer: { x: 0, y: 0 },
  /** true while a mouse is over the canvas or a finger is on the screen */
  pointerActive: false,
  /** true while the pointer/finger is on the heart itself */
  touching: false,
  /** true while pressed on the heart (pointerdown … pointerup) */
  pressing: false,
  /** dev diagnostics: what ended the last press, and when; pointerdowns seen / accepted */
  lastRelease: "",
  downEvents: 0,
  heartHits: 0,
  /** 0 far … 1 touching, smoothed */
  proximity: 0,
  /** short-lived excitement after a touch, 1 → 0 over a few seconds */
  excitation: 0,
  /** the story has invited her to touch (set by the intro once the prompt shows) */
  touchEnabled: false,
  /** 0 alive … 1 it stopped, because she did not touch it */
  neglect: 0,
  dead: false,
  /** hold interaction */
  holdEnabled: false,
  holdProgress: 0,
  holdDone: false,
  holdDuration: 5,
  /** her drawing */
  draw: {
    points: 0,
    strokes: 0,
    /** seconds (frameState.time) of the first / last point, -1 = none */
    firstAt: -1,
    lastAt: -1,
    /** the site draws for her when she does not */
    auto: false,
    /** last pointer position on the drawing plane (world units) */
    penX: 0,
    penY: 0,
    penDown: false,
  },
  /** device orientation, normalized roughly to -1..1 (mobile) */
  gyro: { x: 0, y: 0, enabled: false },
  /** music analysis 0..1 (only when a music track is playing) */
  audio: { energy: 0, bass: 0 },
  /** environment flags */
  isMobile: false,
  reducedMotion: false,
  /** the heart's current world-space visual radius (for proximity maths) */
  heartRadius: 1.15,
  /** elapsed time from the loop, seconds */
  time: 0,
};

export type FrameState = typeof frameState;
