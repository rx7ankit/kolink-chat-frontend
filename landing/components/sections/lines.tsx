import { Section, SectionHeader } from "@/components/ui/section";

import { LinesBody } from "./lines/body";

const copy = {
  eyebrow: "§01 · LINES 01–08",
  lines: ["Eight lines.", "*One interchange.*"],
  body: "Eight channels in one workspace. Each line stops only at the features it really supports.",
};

/**
 * §01 LINES — an honest transit map: eight platform lines leave the CONNECT
 * terminus and only stop at the stations they really serve, then the full
 * capability matrix sits one click below.
 */
export function Lines() {
  return (
    <Section id="lines" container={false}>
      <div className="k-container">
        <SectionHeader eyebrow={copy.eyebrow} lines={copy.lines} body={copy.body} />
      </div>
      <LinesBody />
    </Section>
  );
}
