import { FaqDesk } from "@/components/sections/faq/faq-desk";
import { Section } from "@/components/ui/section";

/** §11 · Information desk: sticky signage on the left, a disclosure list on the right. */
export function Faq() {
  return (
    <Section id="faq">
      <FaqDesk />
    </Section>
  );
}
