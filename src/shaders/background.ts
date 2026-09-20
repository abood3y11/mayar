/**
 * The living red world: a radial gradient rendered as a full-screen quad
 * behind everything. It breathes with the heartbeat and deepens inside the
 * heart and during the quiet chapters.
 */

export const backgroundVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

export const backgroundFragment = /* glsl */ `
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform float uBeat;
  uniform float uTime;
  uniform float uDepth;
  uniform float uAspect;
  uniform float uPulse;

  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec2 p = vUv - vec2(0.5, 0.42);
    p.x *= uAspect;
    // the centre swells a little on every beat and drifts very slowly
    float r = length(p) * (1.0 - 0.07 * uBeat * uPulse);
    r += 0.02 * sin(uTime * 0.21 + p.x * 2.2) + 0.015 * cos(uTime * 0.17 + p.y * 2.6);
    float d = clamp(r / 0.74, 0.0, 1.0);

    vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.28, d));
    col = mix(col, uC2, smoothstep(0.28, 0.62, d));
    col = mix(col, uC3, smoothstep(0.62, 1.0, d));

    // deeper world: sink toward the darkest stop, keep a faint warm centre
    vec3 deep = mix(uC2, uC3, 0.6) * (1.15 - 0.55 * d);
    col = mix(col, deep, uDepth);

    // film grain, barely
    col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.018;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
