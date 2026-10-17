import { ArrowRight } from "lucide-react";

import { SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { links, studioEnabled } from "@/lib/site";

import { AnchorLink, Colophon, StudioLauncher } from "./footer-colophon";
import { Terminus } from "./footer-terminus";
import { TerminusWordmark } from "./footer-wordmark";
import { productIds, stationById } from "./stations";

const row =
  "group flex min-h-11 min-w-0 items-center gap-3 border-b border-line text-[15px] text-ink transition-colors duration-200 hover:text-accent-text md:min-h-10 md:text-[14px]";

/**
 * §12 · TERMINUS. Header and link columns on the grid, then all eight lines
 * arriving from the left edge at buffer stops in front of the koLink roundel,
 * the full-width wordmark, and the legal line + live colophon.
 */
export function Footer() {
  return (
    <footer
      id="footer"
      className={cn(
        "k-section relative scroll-mt-20 border-t-[3px] border-double border-line pt-24 md:pt-32",
        // The fixed Studio pill sits bottom-right; keep the colophon row clear of it.
        studioEnabled ? "pb-24 md:pb-16" : "pb-6 md:pb-8",
      )}
    >
      <div className="k-container">
        <div className="grid grid-cols-1 gap-x-6 gap-y-14 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <SectionHeader
              eyebrow="§12 · TERMINUS"
              lines={["End of the line.", "*Start of yours.*"]}
              body="koLink Chat: chat marketing, without the tab chaos."
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={links.signup} className="k-btn k-btn-accent group h-12 px-5 text-[15px]">
                Get started
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
              </a>
              <a href={links.login} className="k-btn k-btn-ghost h-12 px-5 text-[15px]">
                Log in
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="min-w-0 lg:col-span-5 lg:col-start-8 lg:pt-1">
            <div className="min-w-0">
              <h3 className="eyebrow">Product</h3>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 border-t border-line">
                {productIds.map((id) => {
                  const s = stationById[id];
                  if (!s) return null;
                  return (
                    <li key={id} className="min-w-0">
                      <AnchorLink id={id} className={row}>
                        <span className="mono w-8 shrink-0 text-[11px] text-ink-soft">{s.num}</span>
                        <span className="truncate">{s.label}</span>
                      </AnchorLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      </div>

      <Terminus className="mt-20 md:mt-28" />

      <div className="k-container">
        <TerminusWordmark className="mt-4 md:mt-6" />

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-5 md:mt-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <p className="max-w-[72ch] text-[12px] leading-[1.6] text-ink-soft">
              © 2026 koLink. Platform names and logos are trademarks of their owners.
            </p>
            <ul className="flex gap-6">
              <li>
                <a
                  href={links.privacy}
                  className="mono inline-flex min-h-11 items-center text-[11px] tracking-[0.08em] text-ink uppercase underline-offset-4 hover:underline"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href={links.terms}
                  className="mono inline-flex min-h-11 items-center text-[11px] tracking-[0.08em] text-ink uppercase underline-offset-4 hover:underline"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
          {/* The colophon reads the Design Studio's live settings, so it ships only with the Studio. */}
          {studioEnabled && (
            <div className="min-w-0 lg:col-span-5 lg:text-right">
              <Colophon />
              <StudioLauncher />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
