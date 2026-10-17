"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Link2, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { headlines, scriptLabels } from "@/lib/copy";
import { contrast, inkFor } from "@/lib/studio/color";
import { fontPairings } from "@/lib/studio/font-pairings";
import { palettes } from "@/lib/studio/palettes";
import { resetLook, setLook, shareUrl, useLook } from "@/lib/studio/store";
import { tokenKeys, type Look, type LookOptionKey } from "@/lib/studio/types";

type Choice<K extends LookOptionKey> = { value: Look[K]; label: string };

function Segmented<K extends LookOptionKey>({
  name,
  value,
  choices,
}: {
  name: K;
  value: Look[K];
  choices: Choice<K>[];
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1 rounded-lg border border-line bg-bg p-1">
      {choices.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLook({ [name]: c.value } as Partial<Look>)}
            className={cn(
              "relative min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors",
              active ? "text-accent-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${name}`}
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-5 first:border-t-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="mono text-[11px] tracking-[0.12em] text-ink uppercase">{title}</h3>
        {hint && <span className="mono text-[10px] text-ink-soft">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="mb-1.5 text-[12px] text-ink-soft">{label}</p>
      {children}
    </div>
  );
}

function useCopied() {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      window.prompt("Copy this:", text);
    }
  };
  return { copied, copy };
}

function cssTokens(look: Look) {
  const palette = palettes.find((p) => p.id === look.palette) ?? palettes[0];
  const font = fontPairings.find((f) => f.id === look.font) ?? fontPairings[0];
  const tokens = { ...palette.tokens };
  if (look.accent) {
    tokens.accent = look.accent;
    tokens.accentInk = inkFor(look.accent);
  }
  const lines = tokenKeys.map((k) => `  --${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${tokens[k]};`);
  return `:root {\n${lines.join("\n")}\n  /* ${font.displayLabel} + ${font.bodyLabel} */\n}`;
}

const OPEN_EVENT = "kolink:open-studio";

/** Opens the Design Studio from anywhere (e.g. the footer launcher). */
export function openStudio() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function DesignStudio() {
  const look = useLook();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const { copied, copy } = useCopied();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The launcher slides away while the visitor scrolls down (so it never sits on content
  // they are reading) and returns on scroll-up or once scrolling settles.
  useEffect(() => {
    let last = window.scrollY;
    let idle: number | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last + 4 && y > 120) setTucked(true);
      else if (y < last - 4) setTucked(false);
      last = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setTucked(false), 1400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  // Stay out of the hero's way: the launcher appears once the hero is mostly scrolled past
  // (the S key and the footer launcher always work).
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOverHero(e.intersectionRatio > 0.35), {
      threshold: [0, 0.35, 0.6, 1],
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // Announce open/close so autoplaying scenes can pause: html[data-studio-open] + a "kolink:studio" event.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-studio-open", open);
    window.dispatchEvent(new CustomEvent("kolink:studio", { detail: { open } }));
  }, [open]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // "S" toggles the Studio when the visitor is not typing; Escape closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "Escape") setOpen(false);
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "s") setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const palette = palettes.find((p) => p.id === look.palette) ?? palettes[0];
  const accent = look.accent ?? palette.tokens.accent;
  const accentRatio = useMemo(() => contrast(accent, inkFor(accent)), [accent]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="design-studio"
        className="mono fixed right-3 bottom-3 z-[70] flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-2 pr-2 pl-2 text-[12px] text-ink shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] md:right-4 md:bottom-4 md:pr-3.5"
        animate={{ y: (tucked || overHero) && !open ? 90 : 0, opacity: (tucked || overHero) && !open ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="flex -space-x-1.5" aria-hidden>
          {(["accent", "pop1", "pop2", "pop3"] as const).map((k) => (
            <span
              key={k}
              className="size-4 rounded-full border-2 border-surface"
              style={{ background: k === "accent" ? accent : palette.tokens[k] }}
            />
          ))}
        </span>
        <span className="sr-only md:not-sr-only">Design Studio</span>
        <kbd className="hidden rounded border border-line px-1 text-[10px] text-ink-soft md:inline">S</kbd>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[71] bg-ink/10 md:bg-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="panel"
              id="design-studio"
              role="dialog"
              aria-label="Design Studio"
              data-lenis-prevent
              className={cn(
                "fixed z-[72] flex flex-col overflow-hidden border-line bg-surface text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]",
                isMobile
                  ? "inset-x-0 bottom-0 h-[82vh] rounded-t-[20px] border-t"
                  : "top-3 right-3 bottom-3 w-[392px] rounded-[18px] border",
              )}
              initial={isMobile ? { y: "100%" } : { x: 420, opacity: 0.6 }}
              animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: "100%" } : { x: 420, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 140 || info.velocity.y > 600) setOpen(false);
              }}
            >
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <p className="mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">koLink · landing</p>
                  <h2 className="font-display text-[22px] leading-none">Design Studio</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-9 place-items-center rounded-full border border-line text-ink-soft hover:text-ink"
                  aria-label="Close Design Studio"
                >
                  <X className="size-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <Group title="Palette" hint={palette.name}>
                  <div className="overflow-hidden rounded-lg border border-line">
                    <div className="flex h-12">
                      {tokenKeys.map((k) => (
                        <span key={k} className="flex-1" style={{ background: palette.tokens[k] }} title={k} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">{palette.mood}</p>

                  <Field label="Custom accent">
                    <div className="flex items-center gap-2">
                      <label className="relative size-9 shrink-0 overflow-hidden rounded-md border border-line">
                        <span className="sr-only">Pick accent color</span>
                        <input
                          type="color"
                          value={accent.toLowerCase()}
                          onChange={(e) => setLook({ accent: e.target.value })}
                          className="absolute -inset-2 size-[calc(100%+16px)] cursor-pointer"
                        />
                      </label>
                      <code className="mono flex-1 text-[12px]">{accent.toUpperCase()}</code>
                      <span
                        className={cn(
                          "mono rounded-full px-2 py-0.5 text-[10px]",
                          accentRatio >= 4.5 ? "bg-agent/15 text-ink" : "bg-attention/20 text-ink",
                        )}
                        title="Contrast of the button label on the accent"
                      >
                        {accentRatio.toFixed(1)}:1 {accentRatio >= 4.5 ? "AA" : "low"}
                      </span>
                      {look.accent && (
                        <button
                          type="button"
                          onClick={() => setLook({ accent: null })}
                          className="text-[11px] text-ink-soft underline underline-offset-2 hover:text-ink"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </Field>
                </Group>

                <Group title="Type" hint={fontPairings.find((f) => f.id === look.font)?.name}>
                  <div className="grid grid-cols-2 gap-2">
                    {fontPairings.map((f) => {
                      const active = f.id === look.font;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLook({ font: f.id })}
                          aria-pressed={active}
                          className={cn(
                            "rounded-lg border bg-bg p-3 text-left",
                            active ? "border-ink ring-2 ring-ink/80" : "border-line hover:border-ink/40",
                          )}
                        >
                          <span
                            className="block text-[34px] leading-none"
                            style={{
                              fontFamily: `var(${f.display})`,
                              letterSpacing: f.displayTracking,
                              fontWeight: f.displayWeight,
                            }}
                          >
                            Aa{" "}
                            <span style={{ fontFamily: "var(--font-instrument-serif)", fontStyle: "italic", fontWeight: 400 }}>
                              Aa
                            </span>
                          </span>
                          <span className="mt-2 block text-[12px] font-semibold" style={{ fontFamily: `var(${f.body})` }}>
                            {f.name}
                          </span>
                          <span className="mono block truncate text-[10px] text-ink-soft">
                            {f.displayLabel} · {f.bodyLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Field label="Emphasis words">
                    <Segmented
                      name="emphasis"
                      value={look.emphasis}
                      choices={[
                        { value: "route", label: "Route line" },
                        { value: "serif", label: "Serif italic" },
                        { value: "display", label: "Italic" },
                        { value: "highlight", label: "Marker" },
                        { value: "plain", label: "Plain" },
                      ]}
                    />
                  </Field>
                </Group>

                <Group title="Hero">
                  <Field label="Layout">
                    <Segmented
                      name="hero"
                      value={look.hero}
                      choices={[
                        { value: "branch", label: "Branch" },
                        { value: "interchange", label: "Interchange" },
                      ]}
                    />
                  </Field>
                  <Field label="Headline">
                    <div role="radiogroup" className="flex flex-col gap-1">
                      {(Object.keys(headlines) as Look["headline"][]).map((id) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={look.headline === id}
                          onClick={() => setLook({ headline: id })}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[13px]",
                            look.headline === id ? "border-ink bg-bg" : "border-line text-ink-soft hover:text-ink",
                          )}
                        >
                          <span className="mono text-[10px] uppercase">{id}</span>
                          {headlines[id].label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Demo story">
                    <Segmented
                      name="script"
                      value={look.script}
                      choices={(Object.keys(scriptLabels) as Look["script"][]).map((v) => ({ value: v, label: scriptLabels[v] }))}
                    />
                  </Field>
                  <Field label="Line drawing">
                    <Segmented
                      name="lines"
                      value={look.lines}
                      choices={[
                        { value: "octilinear", label: "Transit 45°" },
                        { value: "orthogonal", label: "Right angles" },
                        { value: "cord", label: "Patch cords" },
                      ]}
                    />
                  </Field>
                  <Field label="Line color">
                    <Segmented
                      name="lineColor"
                      value={look.lineColor}
                      choices={[
                        { value: "ink", label: "Ink" },
                        { value: "brand", label: "Brand" },
                        { value: "tints", label: "Tints" },
                      ]}
                    />
                  </Field>
                </Group>

                <Group title="Surfaces">
                  <Field label="Corners">
                    <Segmented
                      name="radius"
                      value={look.radius}
                      choices={[
                        { value: "sharp", label: "Sharp" },
                        { value: "soft", label: "Soft" },
                        { value: "round", label: "Round" },
                      ]}
                    />
                  </Field>
                  <Field label="Cards">
                    <Segmented
                      name="card"
                      value={look.card}
                      choices={[
                        { value: "hairline", label: "Hairline" },
                        { value: "paper", label: "Paper" },
                        { value: "sticker", label: "Sticker" },
                      ]}
                    />
                  </Field>
                  <Field label="Section rhythm">
                    <Segmented
                      name="rhythm"
                      value={look.rhythm}
                      choices={[
                        { value: "hairlines", label: "Hairlines" },
                        { value: "bands", label: "Bands" },
                      ]}
                    />
                  </Field>
                  <Field label="Texture">
                    <Segmented
                      name="grain"
                      value={look.grain}
                      choices={[
                        { value: "off", label: "Off" },
                        { value: "paper", label: "Paper" },
                        { value: "riso", label: "Riso" },
                      ]}
                    />
                  </Field>
                  <Field label="Grid overlay">
                    <Segmented
                      name="grid"
                      value={look.grid}
                      choices={[
                        { value: "off", label: "Off" },
                        { value: "hero", label: "Hero" },
                        { value: "everywhere", label: "Everywhere" },
                        { value: "baseline", label: "+ Baseline" },
                      ]}
                    />
                  </Field>
                </Group>

                <Group title="Motion">
                  <Segmented
                    name="motion"
                    value={look.motion}
                    choices={[
                      { value: "still", label: "Still" },
                      { value: "calm", label: "Calm" },
                      { value: "lively", label: "Lively" },
                      { value: "bold", label: "Bold" },
                    ]}
                  />
                  <p className="mt-2 text-[12px] text-ink-soft">Your OS reduced-motion setting always wins.</p>
                </Group>
              </div>

              <footer className="grid grid-cols-2 gap-2 border-t border-line bg-bg p-4">
                <button
                  type="button"
                  onClick={() => copy("link", shareUrl(look))}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-ink"
                >
                  {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
                  {copied === "link" ? "Link copied" : "Copy share link"}
                </button>
                <button
                  type="button"
                  onClick={() => copy("json", JSON.stringify(look, null, 2))}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12px]"
                >
                  {copied === "json" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  Config JSON
                </button>
                <button
                  type="button"
                  onClick={() => copy("css", cssTokens(look))}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12px]"
                >
                  {copied === "css" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  CSS tokens
                </button>
                <button
                  type="button"
                  onClick={resetLook}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-1 text-[12px] text-ink-soft hover:text-ink"
                >
                  <RotateCcw className="size-3.5" /> Reset to default
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
