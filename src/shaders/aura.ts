/** Soft red aura on a plane behind the heart. Additive. */

export const auraVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const auraFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uBeat;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.y *= 1.08;
    float d = length(p);
    float glow = pow(max(0.0, 1.0 - d), 2.6);
    float ring = smoothstep(0.55, 0.3, abs(d - 0.42 - 0.08 * uBeat)) * 0.18 * uBeat;
    gl_FragColor = vec4(uColor, (glow + ring) * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
