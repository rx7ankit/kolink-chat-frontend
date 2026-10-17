import { Section, SectionHeader } from "@/components/ui/section";

import { BroadcastStage } from "./broadcasts/stage";

/**
 * §05 BROADCASTS — one composer, five listings on a departures board, and what you
 * can do on each published post. Publishing covers Instagram, Facebook Page,
 * Threads, X and LinkedIn only (see lib/capabilities publishTargets).
 */
export function Broadcasts() {
  return (
    <Section id="broadcasts">
      <SectionHeader
        eyebrow="§05 · BROADCASTS"
        lines={["Write once.", "*Publish to five networks.*"]}
        body={
          <p>
            One post for Instagram, Facebook, Threads, X and LinkedIn. Publish now or schedule it, and watch every network
            land on one board.
          </p>
        }
      />
      <BroadcastStage />
      <p className="mt-14 max-w-[72ch] text-[13px] leading-snug text-ink-soft">
        The same caption goes to every network, unchanged. LinkedIn posts are text only.
      </p>
    </Section>
  );
}
