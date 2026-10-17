"use client";

import { useCallback, useRef, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { links } from "@/lib/site";

import { NavMenu } from "./nav-menu";
import { NavRail } from "./nav-rail";
import { navIds, stationById, stations } from "./stations";
import { useAnchorClick } from "./use-jump";
import { useStationProgress } from "./use-stations";

const navStations = navIds.map((id) => stationById[id]).filter(Boolean);

/** The page's grain tile (none when the Studio grain is off), so the solid bar matches the paper. */
const paper = { backgroundImage: "var(--k-grain-img, none)", backgroundSize: "160px 160px" } as const;

/**
 * Sticky site nav (64px, 56px on mobile): lockup left, section links centre,
 * account actions right, and the "you are here" rail along the bottom hairline.
 * Solid paper and a hairline: no glass, and no half-transparent bar for
 * headlines to ghost through without a blur.
 */
export function Nav() {
  const { index, current } = useStationProgress();
  const onAnchor = useAnchorClick();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const activeId = current > 0 ? stations[current - 1]?.id : null;

  const closeMenu = useCallback((opts?: { restoreFocus?: boolean }) => {
    setMenuOpen(false);
    if (opts?.restoreFocus !== false) requestAnimationFrame(() => menuButton.current?.focus());
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg" style={paper}>
      <div className="k-container relative flex h-14 items-center gap-3 md:h-16 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <a
          href="#"
          onClick={(e) => onAnchor(e, null)}
          className="-ml-1 flex min-h-11 min-w-0 items-center gap-2 justify-self-start rounded-sm px-1"
          aria-label="koLink Chat, back to top"
        >
          <LogoMark className="h-[18px] md:h-5" />
          <span className="font-display truncate text-[17px] leading-none md:text-[18px]" aria-hidden>
            koLink <span className="text-accent-text">Chat</span>
          </span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center">
            {navStations.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => onAnchor(e, s.id)}
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "mono relative flex h-11 items-center gap-1.5 rounded-sm px-2 text-[12px] tracking-[0.06em] uppercase transition-colors duration-200 xl:px-2.5",
                      active ? "text-ink" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {s.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-2 bottom-2 h-px origin-left bg-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] xl:inset-x-2.5",
                        // CSS-only still path (OS setting or Studio "Still") so the markup never differs at hydration.
                        "motion-reduce:transition-none [html[data-motion=still]_&]:transition-none",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 justify-self-end sm:gap-3">
          <a
            href={links.login}
            className="hidden min-h-11 items-center rounded-sm px-2 text-[14px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
          >
            Log in
          </a>
          <a
            href={links.signup}
            className="k-btn k-btn-accent relative h-10 px-3.5 text-[14px] whitespace-nowrap after:absolute after:inset-x-0 after:-inset-y-0.5 sm:px-4"
          >
            Get started
          </a>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? "site-index" : undefined}
            // Inset focus ring: the button sits in the gutter, so an outset ring would touch the screen edge.
            className="-mr-2 grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-offset-[-2px] lg:hidden"
          >
            <span className="sr-only">Open section index</span>
            <span aria-hidden className="flex w-[18px] flex-col gap-[5px]">
              <span className="block h-[2px] w-full rounded-full bg-ink" />
              <span className="block h-[2px] w-[12px] rounded-full bg-ink" />
            </span>
          </button>
        </div>

        <NavRail index={index} current={current} />
      </div>

      <NavMenu open={menuOpen} onClose={closeMenu} current={current} />
    </header>
  );
}
