import type { ReactNode } from "react";

import { RevealLines, Reveal } from "@/components/motion/reveal";
import { Emphasis } from "@/components/ui/emphasis";
import { cn } from "@/lib/cn";
import { plainText } from "@/lib/copy";
import type { SectionId } from "@/lib/site";

/** Page section shell: anchor id, Studio rhythm hook, container. */
export function Section({
  id,
  children,
  className,
  container = true,
}: {
  id: SectionId | "hero" | "footer";
  children: ReactNode;
  className?: string;
  container?: boolean;
}) {
  return (
    <section id={id} className={cn("k-section scroll-mt-20 py-24 md:py-32", className)}>
      {container ? <div className="k-container">{children}</div> : children}
    </section>
  );
}

/**
 * Standard header: mono eyebrow ("§02 · AUTOREPLY AGENT"), display title whose
 * `lines` may contain *emphasis*, and an optional body paragraph.
 */
export function SectionHeader({
  eyebrow,
  lines,
  body,
  className,
  align = "left",
}: {
  eyebrow: string;
  lines: string[];
  body?: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal y={12}>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <RevealLines
        as="h2"
        label={plainText(lines.join(" "))}
        className="font-display mt-5 text-[clamp(36px,5vw,72px)] leading-[0.98]"
        lines={lines.map((l, i) => (
          <Emphasis key={l} text={l} terminal={i === lines.length - 1} />
        ))}
      />
      {body && (
        <Reveal delay={0.15}>
          <div className={cn("mt-6 max-w-[58ch] text-[17px] leading-[1.65] text-pretty text-ink-soft", align === "center" && "mx-auto")}>
            {body}
          </div>
        </Reveal>
      )}
    </header>
  );
}
