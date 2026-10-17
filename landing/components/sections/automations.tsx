import { Section, SectionHeader } from "@/components/ui/section";

import { ActivityLog } from "./automations/activity-log";
import { FbThreadsStrip } from "./automations/fb-threads";
import { MatcherToy } from "./automations/matcher-toy";
import { Results } from "./automations/results";
import { SignalScene } from "./automations/scene";

/**
 * §04 COMMENT AUTOMATIONS — the second (and last) pinned scene: a post with a live
 * comment stream beside a signal-box diagram of Keyword → DM + reply. Below it,
 * the real matcher beside the activity log and demo results, then the
 * Facebook/Threads strip (the section's one honesty footnote lives there).
 */
export function Automations() {
  return (
    <Section id="automations">
      <SectionHeader
        eyebrow="§04 · COMMENT AUTOMATIONS"
        lines={["Comment “LINK”.", "*Get the DM.*"]}
        body={
          <p>
            Add trigger words to any Instagram post or reel. Whoever comments one gets a public reply and a DM with
            your link, once per person.
          </p>
        }
      />

      <SignalScene />

      <div className="ka-after mt-24 grid grid-cols-1 gap-x-8 gap-y-20 md:mt-32 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <MatcherToy />
        </div>
        {/* Top padding = the matcher card's border + padding, so both kickers share a line. */}
        <div className="min-w-0 space-y-14 lg:col-span-7 lg:pt-[29px]">
          <ActivityLog />
          <Results />
        </div>
        <div className="min-w-0 lg:col-span-12">
          <FbThreadsStrip />
        </div>
      </div>
    </Section>
  );
}
