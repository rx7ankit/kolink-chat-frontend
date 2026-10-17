"use client";

import { useState } from "react";

import type { PlatformId } from "@/lib/platforms";

import { lineRows, signIns, stations } from "./data";
import { Footnotes } from "./legend";
import { MapDesktop } from "./map-desktop";
import { MapVertical } from "./map-vertical";
import { CapabilityMatrix } from "./matrix";

/**
 * The map (horizontal at xl+, vertical below), its notes and the capability
 * matrix. Shares one "focused line" between the matrix rows and the map.
 */
export function LinesBody() {
  const [focus, setFocus] = useState<PlatformId | null>(null);
  return (
    <>
      {/* Same measure as the header and the matrix, so every rule in the section shares one left and right edge. */}
      <div className="k-container mt-12 md:mt-16">
        <div className="hidden xl:block">
          <MapDesktop focus={focus} onFocusLine={setFocus} />
        </div>
        <div className="xl:hidden">
          <MapVertical />
        </div>
        <Footnotes className="border-t border-line" />
        <MapSummary />
      </div>
      <div className="k-container mt-10 md:mt-12">
        <CapabilityMatrix focus={focus} onFocusLine={setFocus} />
      </div>
    </>
  );
}

const conversationLines = lineRows.filter((r) => r.dashed).map((r) => r.id);
const nameOf = Object.fromEntries(lineRows.map((r) => [r.id, r.label])) as Record<PlatformId, string>;
const list = (ids: PlatformId[]) =>
  ids.length < 2 ? ids.map((id) => nameOf[id]).join("") : `${ids.slice(0, -1).map((id) => nameOf[id]).join(", ")} and ${nameOf[ids[ids.length - 1]]}`;

/** Separators read aloud badly ("middle dot"), so the spoken version uses commas and words. */
const say = (s: string) => s.replace(/ · /g, ", ").replace(/ → /g, " to ");
const [shared, ...ownSignIns] = signIns;

/** The map is drawn for eyes; this is the same map for screen readers. */
function MapSummary() {
  return (
    <div className="sr-only">
      <h3>Where each line stops</h3>
      <p>
        {list(shared.lines)} share {shared.label}. {ownSignIns.map((s) => `${list(s.lines)}: ${s.label}`).join(", ")}.{" "}
        {list(conversationLines)} are conversation-only: replies come in, nothing is published there.
      </p>
      <ul>
        {stations.map((st) => {
          const served = lineRows.filter((r) => st.stops[r.id]);
          return (
            <li key={st.key}>
              {st.name} ({st.gist}): {served.map((r) => `${r.label}, ${say(st.stops[r.id]?.label ?? "")}`).join("; ")}.
            </li>
          );
        })}
      </ul>
    </div>
  );
}
