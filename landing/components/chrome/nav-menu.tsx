"use client";

import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { X } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { ease } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { links, studioEnabled } from "@/lib/site";
import { useMotionPrefs } from "@/lib/studio/store";

import { stations } from "./stations";
import { useAnchorClick } from "./use-jump";

/** The index lists every numbered stop, §01–§11 plus the footer as §12 Terminus. */
const entries = stations;

const noop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen section index for small screens, drawn as one vertical line with a
 * station per section. Modal: focus is trapped, Escape closes, page scroll is locked
 * (Lenis stopped + html overflow hidden) and focus returns to the menu button.
 * The open "wipe" is a paper layer scaling down from the top (transform only, no
 * full-screen clip-path repaint); labels rise through their own masks.
 */
export function NavMenu({
  open,
  onClose,
  current,
}: {
  open: boolean;
  onClose: (opts?: { restoreFocus?: boolean }) => void;
  current: number;
}) {
  const isClient = useIsClient();
  const lenis = useLenis();
  const { still, pace } = useMotionPrefs();
  const onAnchor = useAnchorClick();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    lenis?.stop();
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (wide.matches) onClose({ restoreFocus: false });
    };
    // Keep focus inside while modal (the page behind is covered but still in the tab order).
    const onFocusIn = (e: FocusEvent) => {
      const panel = panelRef.current;
      if (panel && e.target instanceof Node && !panel.contains(e.target)) closeRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    wide.addEventListener("change", onWide);
    return () => {
      cancelAnimationFrame(raf);
      html.style.overflow = prevOverflow;
      lenis?.start();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      wide.removeEventListener("change", onWide);
    };
  }, [open, lenis, onClose]);

  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isClient) return null;

  const t = (d: number) => (still ? 0 : d * pace);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="site-index"
          ref={panelRef}
          id="site-index"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-index-title"
          onKeyDown={trap}
          className="fixed inset-0 z-[60] text-ink"
          initial={{ opacity: still ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: still ? 0.1 : 0.22, ease: ease.out } }}
          transition={{ duration: still ? 0.15 : 0 }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 origin-top bg-bg"
            style={{ backgroundImage: "var(--k-grain-img, none)", backgroundSize: "160px 160px" }}
            initial={still ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: t(0.5), ease: ease.out }}
          />
          <motion.div
            data-lenis-prevent
            className="relative flex h-full flex-col overflow-y-auto overscroll-contain"
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            // Content arrives once the paper is ~85% down, so it never sits over the uncovered page.
            transition={{ duration: t(0.3), delay: t(0.2), ease: ease.out }}
          >
            <div className="k-container flex h-14 shrink-0 items-center justify-between border-b border-line md:h-16">
              <span className="flex items-center gap-2">
                <LogoMark className="h-[18px] md:h-5" />
                <span className="font-display text-[17px] leading-none md:text-[18px]">
                  koLink <span className="text-accent-text">Chat</span>
                </span>
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onClose()}
                // Inset focus ring: the button sits in the gutter, so an outset ring would touch the screen edge.
                className="-mr-2 grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-offset-[-2px]"
                aria-label="Close section index"
              >
                <X className="size-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <div className="k-container flex-1 pt-6 pb-8">
              <p id="site-index-title" className="eyebrow">
                Section index · {entries[0].num}–{entries[entries.length - 1].num}
              </p>

              <div className="relative mt-5">
                {/* The line every station sits on (outside the <ol>, which may only hold <li>). */}
                <motion.span
                  aria-hidden
                  className="absolute top-7 bottom-7 left-[9px] w-1 origin-top rounded-full bg-ink"
                  initial={still ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: t(0.7), delay: t(0.12), ease: ease.inOut }}
                />
                <ol className="relative">
                  {entries.map((s, i) => {
                    const here = current === i + 1;
                    return (
                      <li key={s.id} className="relative border-b border-line last:border-b-0">
                        <a
                          href={`#${s.id}`}
                          aria-current={here ? "location" : undefined}
                          onClick={(e) => onAnchor(e, s.id, () => onClose({ restoreFocus: false }))}
                          className="group flex min-h-14 items-center gap-3 py-1.5 pl-10"
                        >
                          <span aria-hidden className="absolute top-1/2 left-[11px] -translate-x-1/2 -translate-y-1/2">
                            {here ? (
                              <span className="block h-[12px] w-[24px] rounded-full border-[1.5px] border-ink bg-accent" />
                            ) : (
                              <span className="block size-[14px] rounded-full border-[3px] border-ink bg-surface transition-transform duration-200 group-hover:scale-125" />
                            )}
                          </span>
                          <span className="mono w-9 shrink-0 text-[12px] text-ink-soft">{s.num}</span>
                          <span className="block min-w-0 overflow-hidden pb-[0.08em]">
                            <motion.span
                              className={cn(
                                "font-display block truncate text-[clamp(28px,9vw,36px)] leading-[1.08]",
                                here ? "text-ink" : "text-ink group-hover:text-accent-text",
                              )}
                              initial={still ? false : { y: "105%" }}
                              animate={{ y: "0%" }}
                              transition={{ duration: t(0.6), delay: t(0.1 + i * 0.03), ease: ease.out }}
                            >
                              {s.label}
                            </motion.span>
                          </span>
                          {here && (
                            <span className="mono ml-auto shrink-0 text-[11px] tracking-[0.08em] text-ink-soft uppercase">Here</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* Twelve stops outgrow a phone screen; the account actions stay pinned to the bottom of the scroller. */}
            <div
              className={cn(
                "k-container sticky bottom-0 z-10 grid shrink-0 grid-cols-2 gap-3 border-t border-line bg-bg pt-4 pb-[max(16px,env(safe-area-inset-bottom))]",
                // The fixed Design Studio pill sits bottom-right above this dialog: keep both buttons clear of it.
                studioEnabled && "pr-[84px] md:pr-[228px]",
              )}
            >
              <a href={links.login} className="k-btn k-btn-ghost h-12 text-[15px]">
                Log in
              </a>
              <a href={links.signup} className="k-btn k-btn-accent h-12 text-[15px]">
                Get started
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
