/** Light dust (gold and pink) around the heart, and the nebula inside it. One draw call each. */

export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBeat;
  uniform float uAttract;
  uniform float uBurst;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uWake;
  uniform float uNear;
  uniform float uFar;

  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aSeed;

  varying float vAlpha;
  varying float vHot;

  void main() {
    vec3 p = position;

    // slow, individual drift
    float t = uTime * 0.07 + aPhase;
    p.x += sin(t * 1.3 + aSeed.x) * 0.28;
    p.y += sin(t * 0.9 + aSeed.y) * 0.28 + sin(uTime * 0.18 + aPhase) * 0.12;
    p.z += cos(t * 1.1 + aSeed.z) * 0.28;

    // proximity pulls the dust in; each beat pushes it out a touch; bursts throw it
    float r = length(p);
    vec3 dir = p / max(r, 0.001);
    float radius = r * (1.0 - 0.14 * uAttract) + uBeat * 0.09 * (0.5 + aScale) + uBurst * (0.9 + aScale * 1.4);
    p = dir * radius;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(-mv.z, 0.5);
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 + 0.4 * uBeat + uBurst) * (8.0 / depth);

    float near = smoothstep(uNear, uNear + 1.0, r);      // never inside the heart
    float far = 1.0 - smoothstep(uFar, uFar * 2.0, depth); // fade with distance
    vAlpha = 0.6 * uWake * near * far * (0.25 + 0.75 * aScale) * (0.55 + 0.45 * uBeat);
    vHot = uBeat * 0.5 + uBurst;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorHot;

  varying float vAlpha;
  varying float vHot;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.04, d);
    a *= a;
    vec3 col = mix(uColor, uColorHot, clamp(vHot, 0.0, 1.0));
    gl_FragColor = vec4(col, a * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
