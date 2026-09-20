"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser: load the stage client-side, keep the
// server render a plain black stage so there is no flash.
const Experience = dynamic(() => import("./Experience"), {
  ssr: false,
  loading: () => <div className="stage" />,
});

export function ExperienceLoader() {
  return <Experience />;
}
