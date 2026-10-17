"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

import { useParallax } from "@/components/motion/parallax";

import { DESKTOP_QUERY, useMediaQuery } from "../automations/hooks";
import { DeparturesBoard } from "./board";
import { Composer } from "./composer";
import { EngagementPanel } from "./engagement";

/**
 * Composer beside the departures board, engagement panel under the board.
 * The composer is the section's only parallax (±40px, springed, desktop only).
 */
export function BroadcastStage() {
  const [replay, setReplay] = useState(0);
  const composerRef = useRef<HTMLDivElement>(null);
  const y = useParallax(composerRef, 80);
  const desktop = useMediaQuery(DESKTOP_QUERY);

  return (
    <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-20 lg:grid-cols-12">
      <motion.div ref={composerRef} style={desktop ? { y } : undefined} className="min-w-0 lg:col-span-4 lg:self-start">
        <Composer onPublish={() => setReplay((n) => n + 1)} />
      </motion.div>
      <div className="min-w-0 lg:col-span-8">
        <h3 className="sr-only">Departures board</h3>
        <DeparturesBoard replay={replay} />
        <div className="mt-16">
          <EngagementPanel />
        </div>
      </div>
    </div>
  );
}
