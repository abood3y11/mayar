/** Crimson threads of light between memories and the heart's core. */

export const threadVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const threadFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorHot;
  uniform float uAlpha;
  uniform float uBeat;
  uniform float uPulse; // 0..1 position of a travelling light, < 0 none
  uniform float uTime;

  varying float vT;

  void main() {
    float base = 0.14 + 0.1 * uBeat + 0.05 * sin(uTime * 1.7 + vT * 12.0);
    float pulse = uPulse < 0.0 ? 0.0 : exp(-pow((vT - uPulse) * 7.0, 2.0));
    vec3 col = mix(uColor, uColorHot, pulse);
    gl_FragColor = vec4(col * (1.0 + pulse * 1.5), (base + pulse) * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
