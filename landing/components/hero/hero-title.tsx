import { Emphasis } from "@/components/ui/emphasis";
import { headlines, plainText } from "@/lib/copy";
import type { LookOptionValue } from "@/lib/studio/types";

const ids = Object.keys(headlines) as LookOptionValue<"headline">[];

/**
 * The H1 (LCP element): every Studio headline is server-rendered and CSS shows the one that
 * matches html[data-headline], which the boot script sets before first paint — no flash,
 * no layout shift, never masked or hidden on load. The last emphasis run ends in a roundel.
 */
export function HeroTitle() {
  return (
    <h1 id="hero-title" className="kh-title font-display kinetic text-ink">
      {ids.map((id) => {
        const lines = headlines[id].lines;
        const lastEm = lines.reduce((acc, l, i) => (l.includes("*") ? i : acc), -1);
        return (
          <span key={id} data-hl={id} className="kh-hl">
            <span className="sr-only">{plainText(lines.join(" "))}</span>
            <span aria-hidden>
              {lines.map((line, i) => (
                <span key={i} className="block">
                  <Emphasis text={line} terminal={i === lastEm} />
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </h1>
  );
}
