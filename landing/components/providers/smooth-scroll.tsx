"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";

/**
 * Lenis drives native scroll, so motion's useScroll keeps working unchanged.
 * MotionConfig makes every transform/layout animation instant for OS reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        // Sections carry scroll-margin-top for the sticky nav; Lenis already honours it.
        anchors: true,
        respectReducedMotion: true,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  );
}
