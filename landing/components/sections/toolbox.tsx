import { Section, SectionHeader } from "@/components/ui/section";

import { TicketSheet } from "./toolbox/sheet";

/** §08 ALSO ON BOARD: a ticket sheet of six working vignettes, straight under the header. */
export function Toolbox() {
  return (
    <Section id="toolbox">
      <SectionHeader
        eyebrow="§08 · ALSO ON BOARD"
        lines={["The rest of the workspace,", "*on one sheet.*"]}
        body="The small things that make it a workspace, not a widget."
      />
      <TicketSheet />
      <p className="mono mt-4 text-[11px] tracking-[0.06em] text-ink-soft uppercase">Demo workspace · illustrative numbers</p>
    </Section>
  );
}
