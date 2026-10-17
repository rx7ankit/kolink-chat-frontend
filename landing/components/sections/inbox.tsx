import { Section, SectionHeader } from "@/components/ui/section";

import { InboxDemo } from "./inbox/inbox-demo";

/**
 * §06 UNIFIED INBOX. A short header, then the demo: the lines enter from the section's edge in
 * the band below the header and sweep down the gutter into the thread rows, one row per line.
 */
export function Inbox() {
  return (
    <Section id="inbox">
      <SectionHeader
        eyebrow="§06 · UNIFIED INBOX"
        lines={["Every line ends *here.*"]}
        body="Every DM, comment, mention and email from eight channels lands in one list. Assign it, label it, reply where it came from."
      />
      <InboxDemo />
    </Section>
  );
}
