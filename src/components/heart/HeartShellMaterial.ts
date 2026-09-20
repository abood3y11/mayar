import * as THREE from "three";
import { palette } from "@/config/palette";

/**
 * Ruby-glass shell for the heart.
 *
 * A MeshPhysicalMaterial (clearcoat, optional real transmission) with a small
 * shader extension that adds the living part: an internal glow that brightens
 * with the beat, a light wave that travels from the core to the edges on every
 * lub, and a proximity-aware rim. Opacity is animated by the director.
 */
export interface HeartShellUniforms {
  uBeat: { value: number };
  uWake: { value: number };
  uPulseR: { value: number };
  uProximity: { value: number };
  uWarmth: { value: number };
  uCoreColor: { value: THREE.Color };
  uRimColor: { value: THREE.Color };
}

export class HeartShellMaterial extends THREE.MeshPhysicalMaterial {
  readonly uniforms: HeartShellUniforms = {
    uBeat: { value: 0 },
    uWake: { value: 0.75 },
    uPulseR: { value: 10 },
    uProximity: { value: 0 },
    uWarmth: { value: 0 },
    uCoreColor: { value: new THREE.Color(palette.pulse) },
    uRimColor: { value: new THREE.Color(palette.text) },
  };

  constructor(transmission: boolean) {
    super({
      color: new THREE.Color(palette.ruby),
      emissive: new THREE.Color(0x000000),
      metalness: 0,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.1,
      ior: 1.5,
      transparent: true,
      opacity: 0,
      ...(transmission
        ? {
            transmission: 0.88,
            thickness: 1.4,
            attenuationColor: new THREE.Color(palette.pulse),
            attenuationDistance: 1.1,
          }
        : {}),
    });
    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);

      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vHeartPos;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeartPos = position;");

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uBeat;
          uniform float uWake;
          uniform float uPulseR;
          uniform float uProximity;
          uniform float uWarmth;
          uniform vec3 uCoreColor;
          uniform vec3 uRimColor;
          varying vec3 vHeartPos;`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          {
            float d = length(vHeartPos) / 1.12;
            float centerGlow = 1.0 - smoothstep(0.0, 1.0, d);
            float ringMask = smoothstep(uPulseR - 0.34, uPulseR, d) * (1.0 - smoothstep(uPulseR, uPulseR + 0.14, d));
            float ringLife = 1.0 - smoothstep(0.7, 1.5, uPulseR);
            float fres = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0);

            vec3 inner = uCoreColor * (0.08 + 0.5 * uBeat) * (0.3 + 0.7 * centerGlow);
            vec3 wave = uCoreColor * ringMask * ringLife * (0.3 + 0.9 * uBeat);
            vec3 rim = uRimColor * fres * (0.05 + 0.25 * uProximity + 0.18 * uBeat);

            totalEmissiveRadiance += (inner + wave + rim) * (0.3 + 0.7 * uWake) + uWarmth * uCoreColor * 0.55;
          }`,
        );
    };
  }

  customProgramCacheKey(): string {
    return "heart-shell";
  }
}
