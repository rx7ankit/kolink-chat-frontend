"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Bubble, HandoffBanner, MarginNote, MenuToast, TypingDots } from "./bubbles";
import { MENU_CONFIRM_BEAT, type AgentStep } from "./data";

/**
 * Renders one step's exchange up to `cursor`.
 * - "stage": rows are [thread | margin] so notes sit in the margin outside the DM card;
 *   the settings toast is drawn by the stage next to the mode cards instead.
 * - "stack": a single column; notes sit under their bubble and the toast is inline.
 */
export function Exchange({
  step,
  cursor,
  play,
  layout,
}: {
  step: AgentStep;
  cursor: number;
  /** Whether beats entering now should animate (false renders end states). */
  play: boolean;
  layout: "stage" | "stack";
}) {
  const stage = layout === "stage";
  const done = cursor >= step.beats.length;
  // The first menu button the customer's keyword matched lights up once the reply lands.
  const activeButton = step.n === 1 && cursor >= 2 ? "Hours" : undefined;

  return (
    <>
      {step.beats.map((beat, i) => {
        if (i > cursor) return null;
        switch (beat.kind) {
          case "typing":
            if (i !== cursor || done) return null;
            return (
              <Row key={i} stage={stage}>
                <TypingDots />
              </Row>
            );
          case "msg":
            return (
              <Row
                key={i}
                stage={stage}
                note={beat.note ? <MarginNote text={beat.note} className={stage ? "" : "mt-2 pl-1"} /> : null}
              >
                <Bubble beat={beat} play={play} activeButton={activeButton} />
              </Row>
            );
          case "handoff":
            return (
              <Row key={i} stage={stage}>
                <HandoffBanner handoff={beat.handoff} play={play} />
              </Row>
            );
          case "toast":
            if (stage) return null;
            return (
              <Row key={i} stage={false}>
                <MenuToast confirmed={cursor >= MENU_CONFIRM_BEAT} play={play} withSwitch className="mt-2" />
              </Row>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function Row({ stage, note, children }: { stage: boolean; note?: ReactNode; children: ReactNode }) {
  if (stage) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_var(--gutter)] items-start">
        <div className="min-w-0 px-5 py-1.5">{children}</div>
        <div className={cn("relative min-w-0 pt-[30px] pl-4", !note && "hidden")}>
          {note && (
            <>
              <span aria-hidden className="absolute top-[37px] -left-2 h-px w-4 bg-line-strong" />
              {note}
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 py-1.5">
      {children}
      {note}
    </div>
  );
}
