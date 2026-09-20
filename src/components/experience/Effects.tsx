"use client";

import { useMemo } from "react";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { QUALITY_PRESETS, isCoarsePointer } from "@/lib/quality";
import { useExperienceStore } from "@/stores/experience-store";

/** Bloom only. The glow should come from the heart and the light, not the whole screen. */
export function Effects() {
  const quality = useExperienceStore((s) => s.quality);
  const multisampling = useMemo(() => (isCoarsePointer() ? 0 : 4), []);
  if (!QUALITY_PRESETS[quality].bloom) return null;
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom mipmapBlur luminanceThreshold={0.86} luminanceSmoothing={0.2} intensity={0.9} radius={0.7} />
    </EffectComposer>
  );
}
