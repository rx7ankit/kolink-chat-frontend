import { HowStops } from "@/components/sections/how/stops";
import { how } from "@/components/sections/how/data";
import { Section, SectionHeader } from "@/components/ui/section";

/**
 * §09 · How it works: one vertical line, four stops, a working vignette at each.
 * From lg the header and the sticky rail share the left column, so the four
 * stops start beside the title instead of under it.
 */
export function How() {
  return (
    <Section id="how">
      <HowStops
        header={
          <SectionHeader
            eyebrow={how.eyebrow}
            lines={how.lines}
            className="lg:[&_h2]:text-[clamp(40px,4.2vw,60px)]"
          />
        }
      />
    </Section>
  );
}
