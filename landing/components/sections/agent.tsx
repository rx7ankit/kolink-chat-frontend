"use client";

import { HouseRules } from "@/components/sections/agent/house-rules";
import { useStillLayout } from "@/components/sections/agent/hydrated";
import { Playground } from "@/components/sections/agent/playground";
import { StepSequence } from "@/components/sections/agent/sequence";
import { PinnedStage } from "@/components/sections/agent/stage";
import { Section, SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";

const copy = {
  eyebrow: "§02 · AUTOREPLY AGENT",
  lines: ["Answers from what you taught it.", "*Nothing else.*"],
  body: "Your Instagram and Messenger DMs, answered from your knowledge library. When it doesn’t know, your team takes over.",
};

/**
 * §02 Autoreply agent. Desktop pins one 240vh stage (the page's long pin);
 * phones and reduced motion get the same six exchanges as stacked panels.
 */
export function Agent() {
  const still = useStillLayout();
  return (
    <Section id="agent">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
        <SectionHeader className="lg:col-span-8" eyebrow={copy.eyebrow} lines={copy.lines} body={<p>{copy.body}</p>} />
        <p className="mono mt-8 self-end text-[11px] leading-relaxed text-ink-soft lg:col-span-4 lg:mt-0 lg:pb-1 lg:text-right">
          Demo brand · Instagram and Messenger DMs only
        </p>
      </div>

      <div className="mt-14 md:mt-20">
        {!still && (
          <div className="hidden lg:block">
            <PinnedStage />
          </div>
        )}
        <div className={cn(!still && "lg:hidden")}>
          <StepSequence still={still} />
        </div>
      </div>

      <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:gap-x-6">
        <HouseRules className="lg:col-span-5 lg:self-center" />
        <Playground className="min-w-0 lg:col-span-7" />
      </div>
    </Section>
  );
}
