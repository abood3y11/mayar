/**
 * Authored visual targets, tweened by the director (GSAP) on chapter changes
 * and read every frame by the heart, camera rig, lights, background and
 * particles. Nothing here is React state.
 */
export const visualState = {
  /** core glow presence; the heart is alive from the moment it exists */
  wake: 0.75,
  /** base scale of the heart group */
  scale: 1,
  /** vertical position of the heart group */
  heartY: 0,
  /** hold warmth 0..1 */
  warmth: 0,
  /** one-shot flare 0..1 */
  burst: 0,
  /** 0 = the heart does not exist yet … 1 = fully there */
  heartOpacity: 0,
  /** 0 = perfectly still, 1 = full sway + pointer follow */
  sway: 1,
  /** red aura behind the heart */
  aura: 0,
  /** camera distance multiplier over the "fits the heart" distance */
  camDistMul: 1.35,
  camY: 0,
  lookY: 0,
  /** ambient dust presence */
  dust: 0.5,
  /** key light presence */
  light: 0.9,
  /** background: 0 warm and bright … 1 deep and dark */
  bgDepth: 0.1,
  /** how much the background breathes with the beat */
  bgPulse: 1,
  /** full-screen flash (DOM), used to hide the cut into the heart */
  flash: 0,
  /** her strokes of light */
  strokes: {
    alpha: 0,
    /** 0 where she drew them … 1 on the heart's surface */
    toHeart: 0,
    /** 0 … 1 forming her name */
    toName: 0,
    /** drift toward the centre while she is still drawing */
    attract: 0,
    size: 1,
  },
  /** 0 outside … 1 inside the heart (memory world) */
  inside: 0,
  /** word card the camera is moving toward, -1 none */
  focusIndex: -1,
  /** photo the camera is moving toward, -1 none */
  photoIndex: -1,
  /** where the focused thing is (world), for the camera */
  focusPos: [0, 0, -5] as [number, number, number],
  /** 0 … 1 camera focus progress */
  focus: 0,
};

export type VisualState = typeof visualState;
