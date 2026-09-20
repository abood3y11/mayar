/**
 * Her strokes of light. One Points draw call that lives through the whole
 * experience: drawn on a plane, drifting to the centre, gathering on the
 * heart's surface, and at the very end writing her name.
 */

export const strokesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBeat;
  uniform float uToHeart;
  uniform float uToName;
  uniform float uAttract;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aHeart;
  attribute vec3 aName;
  attribute vec3 aSeed;
  attribute float aBorn;

  varying float vAlpha;
  varying float vHot;

  float ease(float t) { return t * t * (3.0 - 2.0 * t); }

  void main() {
    float life = clamp((uTime - aBorn) / 0.35, 0.0, 1.0);
    vec3 o = position;

    // while she draws, the lines drift toward the centre without her noticing
    o *= 1.0 - 0.35 * uAttract * (0.6 + 0.4 * aSeed.x);

    // flight to the heart: staggered per point, with a soft arc
    float t1 = ease(clamp(uToHeart * 1.35 - aSeed.z * 0.35, 0.0, 1.0));
    vec3 arc1 = vec3(
      sin(aSeed.x * 6.283 + uTime * 0.7),
      cos(aSeed.y * 6.283 + uTime * 0.5),
      sin(aSeed.z * 6.283)
    ) * 0.7 * sin(3.14159 * t1);
    vec3 p = mix(o, aHeart, t1) + arc1;

    // on the surface they breathe with the heart
    p *= 1.0 + 0.045 * uBeat * t1;

    // and at the end they go write her name
    float t2 = ease(clamp(uToName * 1.3 - aSeed.y * 0.3, 0.0, 1.0));
    vec3 arc2 = vec3(
      cos(aSeed.y * 6.283),
      sin(aSeed.x * 6.283 + uTime * 0.4),
      cos(aSeed.z * 6.283)
    ) * 0.8 * sin(3.14159 * t2);
    p = mix(p, aName, t2) + arc2;

    // idle shimmer
    p += vec3(sin(uTime * 1.3 + aSeed.x * 30.0), cos(uTime * 1.1 + aSeed.y * 30.0), 0.0) * 0.006;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(-mv.z, 0.5);
    float tw = 0.7 + 0.3 * sin(uTime * 2.5 + aSeed.x * 50.0);
    gl_PointSize = uSize * uPixelRatio * (5.0 + 5.0 * aSeed.y) * (0.6 + 0.4 * life) * (9.0 / depth) * (1.0 + 0.3 * uBeat * t1);
    vAlpha = life * tw;
    vHot = 0.25 + 0.5 * uBeat * t1 + 0.45 * (1.0 - life);
  }
`;

export const strokesFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying float vAlpha;
  varying float vHot;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    float core = smoothstep(0.22, 0.0, d);
    vec3 col = mix(uColor, uColorHot, clamp(vHot + core * 0.6, 0.0, 1.0));
    gl_FragColor = vec4(col * (1.0 + core * 0.8), a * vAlpha * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
