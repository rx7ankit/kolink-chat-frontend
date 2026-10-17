import { LogoMark } from "@/components/brand/logo";
import { ByChannel } from "@/components/sections/insights/by-channel";
import { Conversions } from "@/components/sections/insights/conversions";
import { Languages } from "@/components/sections/insights/languages";
import { MessagesChart } from "@/components/sections/insights/messages-chart";
import { NetContacts } from "@/components/sections/insights/net-contacts";
import { PlatformTiles } from "@/components/sections/insights/platform-tiles";
import { Stamp } from "@/components/sections/insights/stamp";
import { StatTiles } from "@/components/sections/insights/stat-tiles";
import { Section, SectionHeader } from "@/components/ui/section";

const copy = {
  eyebrow: "§07 · INSIGHTS",
  lines: ["Read the whole network.", "*Seven days at a glance.*"],
  body: "Your inbox activity next to your Instagram, Facebook and Threads account numbers.",
};

/**
 * §07 Insights — a Swiss data spread. One sheet on the 12-column grid whose
 * hairlines come from a 1px grid gap; every chart is hand-drawn (SVG or plain
 * boxes), direct-labelled, mirrored by a screen-reader table, and complete
 * under reduced motion. All numbers are a demo workspace.
 */
export function Insights() {
  return (
    <Section id="insights">
      <SectionHeader eyebrow={copy.eyebrow} lines={copy.lines} body={copy.body} />

      <div className="relative mt-20">
        {/* Phones: the stamp sits in the gap above the sheet so it never covers the window bar's label. */}
        <Stamp className="absolute -top-[66px] right-1 z-10 sm:right-6 md:-top-9 md:right-10" />

        <div className="k-card overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-12">
            {/* Window bar */}
            <div className="col-span-2 flex min-w-0 items-center gap-2.5 bg-surface px-4 py-3 sm:px-6 md:col-span-12">
              <LogoMark className="h-3.5 text-ink" />
              <span className="text-[13px] font-semibold text-ink">Insights</span>
              <span aria-hidden className="h-3 w-px bg-line-strong" />
              <span className="mono truncate text-[11px] tracking-[0.06em] text-ink-soft uppercase">
                Last 7 days<span className="hidden sm:inline"> · Tue → Mon</span>
              </span>
            </div>

            <StatTiles />

            <MessagesChart className="col-span-2 md:col-span-7 lg:col-span-8" />
            <NetContacts className="col-span-2 md:col-span-5 lg:col-span-4" />

            <ByChannel className="col-span-2 md:col-span-7 xl:col-span-6" />
            <Languages className="col-span-2 md:col-span-5 xl:col-span-3" />
            <Conversions className="col-span-2 md:col-span-12 xl:col-span-3" />

            <PlatformTiles />
          </div>
        </div>
      </div>
    </Section>
  );
}
