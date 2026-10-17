"use client";

import { Fragment, memo, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import { animate, AnimatePresence, LayoutGroup, motion } from "motion/react";
import { CornerDownLeft } from "lucide-react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { publishTargets } from "@/lib/capabilities";
import { cn } from "@/lib/cn";
import type { ComposerMode } from "@/lib/hero/board";
import { abortError, type Clock } from "@/lib/hero/clock";
import { counterRow, MAX_POST } from "@/lib/hero/counters";
import { hashString, mulberry32 } from "@/lib/hero/seed";
import type { Media } from "@/lib/hero/types";
import { platformById, type PlatformId } from "@/lib/platforms";

import { draftStore } from "./draft-store";
import { MediaThumb } from "./post-media";

export type ComposerHandle = {
  /** Typewriter: owns the bar's text while a script runs. Pausable through the clock. */
  type(text: string, o: { clock: Clock; signal: AbortSignal; speed: "post" | "reply"; pace: number }): Promise<void>;
  /** Show text instantly (reduced motion). */
  show(text: string, speed?: "post" | "reply"): void;
  /** Press send: the text collapses into a POST capsule at the key, then the bar clears. */
  send(o: { clock: Clock; signal: AbortSignal; still: boolean }): Promise<void>;
  /** Drop any scripted text (the visitor's own draft is kept). */
  reset(): void;
  focus(): void;
};

const TRAVEL = [0.65, 0, 0.35, 1] as const;
const PAUSE_AFTER = /[,.!?]|\p{Extended_Pictographic}/u;

const replyNoun: Partial<Record<PlatformId, string>> = {
  gmail: "the Gmail thread",
  whatsapp: "the WhatsApp chat, as session text",
  instagram: "the Instagram DM",
  messenger: "the Messenger DM",
  x: "the X thread",
  facebook: "the Facebook comment thread",
  threads: "the Threads reply",
  linkedin: "the LinkedIn comment, as the organization",
};

function ChipTile({ id }: { id: PlatformId }) {
  const p = platformById[id];
  return (
    <span
      className="pi pi-tile grid size-full place-items-center rounded-sm"
      style={{ "--pi-color": p.color, "--pi-tile": p.tile ?? p.color } as CSSProperties}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-[56%]">
        <path d={p.path} fill="currentColor" />
      </svg>
    </span>
  );
}

function Chips({ ids, lit, still }: { ids: PlatformId[]; lit: boolean; still: boolean }) {
  return (
    <LayoutGroup id="kh-chips">
      <ul className="flex shrink-0 items-center gap-1" aria-label={`Targets: ${ids.map((id) => platformById[id].name).join(", ")}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {ids.map((id, i) => (
            <motion.li
              key={id}
              layout={still ? false : "position"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: still ? 0.15 : 0.24, ease: TRAVEL }}
              className="relative size-7 min-[75rem]:size-6"
            >
              <span className="absolute inset-0 grid place-items-center rounded-sm border-[1.5px] border-line-strong bg-surface">
                <PlatformIcon id={id} size={12} />
              </span>
              <motion.span
                data-active="true"
                aria-hidden
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.7 }}
                transition={{ duration: still ? 0 : 0.14, delay: lit && !still ? i * 0.025 : 0 }}
              >
                <ChipTile id={id} />
              </motion.span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </LayoutGroup>
  );
}

/**
 * The attachment: a real thumbnail (the Reel's first frame or the photo) and a short filename.
 * Coming back from a reply it waits for the mode label to swap, so the two never disagree.
 */
function MediaChip({ media, compact, delayed, className }: { media: Media; compact?: boolean; delayed?: boolean; className?: string }) {
  return (
    <motion.span
      initial={delayed ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, delay: 0.2 }}
      className={cn(
        "mono inline-flex h-9 max-w-[176px] min-w-0 shrink-0 items-center gap-2 rounded-full bg-bg-alt p-1 text-[11px] text-ink",
        compact ? "md:pr-3" : "pr-3",
        className,
      )}
      title={`${media.chip} · Instagram publishing needs a photo or video`}
    >
      <span className="relative size-7 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_1px_var(--k-line)]">
        <MediaThumb media={media} sizes="28px" />
      </span>
      <span className={cn("min-w-0 truncate", compact && "sr-only md:not-sr-only")}>{media.chip}</span>
    </motion.span>
  );
}

/**
 * THE COMPOSER: a real input. Its typewriter state lives here only, so per-character
 * updates never re-render the board or the routes.
 */
export const Composer = memo(function Composer({
  ref,
  mode,
  chips,
  media,
  visitor,
  still,
  pauseLabel,
  onPauseToggle,
  onFocusChange,
  onSubmit,
  onDraftChange,
}: {
  ref: Ref<ComposerHandle>;
  mode: ComposerMode;
  chips: "idle" | "lit";
  media: Media | null;
  visitor: boolean;
  still: boolean;
  pauseLabel: string;
  onPauseToggle: () => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: (text: string) => void;
  onDraftChange: (empty: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [demo, setDemo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Once the bar has been in reply mode, the media chip's return is staged after the label swap.
  const [replied, setReplied] = useState(false);
  if (mode.mode === "reply" && !replied) setReplied(true);
  const chipDelayed = replied && !still;
  const inputRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef("");
  const shownRef = useRef("");

  useImperativeHandle(
    ref,
    () => ({
      async type(text, { clock, signal, speed, pace }) {
        const rnd = mulberry32(hashString(text));
        // Only the post feeds the focus pane's draft preview; a teammate's reply never does.
        const preview = speed === "post";
        let acc = "";
        setDemo("");
        shownRef.current = "";
        if (preview) draftStore.set("");
        for (const ch of Array.from(text)) {
          // Yield the bar the moment the visitor has a draft of their own in it.
          if (valueRef.current.trim()) throw abortError();
          acc += ch;
          setDemo(acc);
          shownRef.current = acc;
          if (preview) draftStore.set(acc);
          const base = speed === "post" ? 20 + rnd() * 6 : 20;
          await clock.sleep((base + (speed === "post" && PAUSE_AFTER.test(ch) ? 90 : 0)) * pace, signal);
        }
      },
      show(text, speed = "post") {
        setDemo(text);
        shownRef.current = text;
        if (speed === "post") draftStore.set(text);
      },
      async send({ clock, signal, still: instant }) {
        const shown = shownRef.current;
        const key = keyRef.current;
        if (key && !instant) animate(key, { scale: [1, 0.94, 1] }, { duration: 0.22, ease: [0.22, 1, 0.36, 1] });
        if (!shown) return;
        setValue("");
        valueRef.current = "";
        onDraftChange(true);
        if (instant) {
          setDemo(null);
          shownRef.current = "";
          return;
        }
        setDemo(shown);
        setSending(true);
        try {
          await clock.sleep(220, signal);
        } finally {
          setSending(false);
          setDemo(null);
          shownRef.current = "";
        }
      },
      reset() {
        setDemo(null);
        setSending(false);
        shownRef.current = valueRef.current;
        draftStore.set(valueRef.current);
      },
      focus() {
        inputRef.current?.focus();
      },
    }),
    [onDraftChange],
  );

  const shown = demo ?? value;
  const ready = shown.trim().length > 0 && !sending;
  const ids = mode.mode === "reply" ? [mode.platform] : publishTargets;
  const label = mode.mode === "reply" ? mode.label : "COMPOSE → 5 NETWORKS";
  const cells = counterRow(shown);

  const submit = () => {
    const t = valueRef.current.trim();
    if (t) onSubmit(t);
    else inputRef.current?.focus();
  };

  const keepVisible = () => {
    if (window.matchMedia("(min-width: 48rem)").matches) return;
    const run = () => {
      const el = barRef.current;
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
    };
    requestAnimationFrame(run);
    window.visualViewport?.addEventListener("resize", run, { once: true });
  };

  return (
    <div className="kh-drive relative">
      <div className="kh-labelrow flex min-h-9 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <label htmlFor="hero-composer" className="mono relative grid h-4 min-w-0 overflow-hidden text-[11px] leading-4 tracking-[0.08em] text-ink">
            {/* A roll in step (old up and out as the new one rises in): never blank, never two labels at once.
                A split-flap here flashed garbled glyphs between modes. */}
            <AnimatePresence initial={false}>
              <motion.span
                key={label}
                aria-hidden
                className="col-start-1 row-start-1 truncate"
                initial={still ? { opacity: 0 } : { opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: "0%" }}
                exit={still ? { opacity: 0 } : { opacity: 0, y: "-100%" }}
                transition={{ duration: still ? 0.1 : 0.28, ease: TRAVEL }}
              >
                {label}
              </motion.span>
            </AnimatePresence>
            <span className="sr-only">{mode.mode === "reply" ? `Reply in ${replyNoun[mode.platform] ?? "this thread"} (demo)` : "Write a post (demo)"}</span>
          </label>
          {media && mode.mode === "compose" && <MediaChip media={media} delayed={chipDelayed} className="hidden min-[75rem]:inline-flex" />}
        </div>
        <Chips ids={ids} lit={chips === "lit"} still={still} />
      </div>

      <div className="kh-barrow mt-2 flex items-center">
        <div
          ref={barRef}
          className="kh-bar relative flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-surface pr-1.5 pl-5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-accent-text min-[75rem]:h-16 min-[75rem]:pr-2 min-[75rem]:pl-6"
        >
          <div className="relative min-w-0 flex-1 self-stretch">
            <input
              ref={inputRef}
              id="hero-composer"
              data-hero-composer
              type="text"
              maxLength={MAX_POST}
              enterKeyHint="send"
              autoComplete="off"
              spellCheck={false}
              value={value}
              placeholder={demo !== null ? "" : mode.mode === "reply" ? "Write a reply…" : "Write a post…"}
              aria-describedby="hero-composer-help"
              onChange={(e) => {
                const v = e.target.value;
                if (demo !== null) setDemo(null);
                const wasEmpty = valueRef.current.trim().length === 0;
                setValue(v);
                valueRef.current = v;
                shownRef.current = v;
                draftStore.set(v);
                const isEmpty = v.trim().length === 0;
                if (wasEmpty !== isEmpty) onDraftChange(isEmpty);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                submit();
              }}
              onFocus={() => {
                setDemo(null);
                shownRef.current = valueRef.current;
                draftStore.set(valueRef.current);
                onFocusChange(true);
                keepVisible();
              }}
              onBlur={() => onFocusChange(false)}
              className="absolute inset-0 w-full min-w-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-soft min-[75rem]:text-[17px]"
            />
            {demo !== null && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden text-[16px] text-ink min-[75rem]:text-[17px]"
                initial={false}
                animate={sending ? { opacity: 0, scaleX: 0.12 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.22, ease: TRAVEL }}
                style={{ originX: 1 }}
              >
                <span className="mr-auto shrink-0 whitespace-pre">
                  {demo}
                  {!sending && (
                    <span className="kh-caret kh-loop ml-px inline-block h-[1.1em] w-[2px] translate-y-[0.18em] bg-accent" />
                  )}
                </span>
              </motion.div>
            )}
          </div>
          {media && mode.mode === "compose" && <MediaChip media={media} compact delayed={chipDelayed} className="min-[75rem]:hidden" />}
          <span className="relative shrink-0">
            <button
              ref={keyRef}
              type="button"
              data-hx="send"
              onClick={submit}
              aria-label="Send (simulated: nothing is posted)"
              className="relative grid size-11 place-items-center overflow-hidden rounded-full border-[1.5px] border-line-strong text-ink min-[75rem]:size-12"
            >
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-accent"
                initial={false}
                animate={{ clipPath: ready ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                transition={{ duration: still ? 0 : 0.2, ease: TRAVEL }}
              />
              <CornerDownLeft size={18} strokeWidth={2.2} aria-hidden className={cn("relative transition-colors", ready ? "text-accent-ink" : "text-ink")} />
            </button>
            <AnimatePresence>
              {sending && (
                <motion.span
                  aria-hidden
                  className="mono pointer-events-none absolute top-1/2 left-1/2 z-[4] grid h-5 w-[60px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-ink bg-accent text-[11px] font-bold tracking-[0.14em] text-accent-ink"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  transition={{ type: "spring", stiffness: 520, damping: 30 }}
                >
                  POST
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>
      </div>

      <div className="kh-counter mt-2 flex min-h-5 items-center justify-between gap-3 px-1 text-[11px] text-ink-soft min-[75rem]:px-2">
        <p id="hero-composer-help" className="mono min-w-0 truncate">
          {mode.mode === "reply" ? (
            <>Sends in {replyNoun[mode.platform] ?? "this thread"} only</>
          ) : visitor && !shown ? (
            <>Your turn: write a post, press Enter.</>
          ) : (
            cells.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && " · "}
                {c.limit ? (
                  <>
                    {c.label}{" "}
                    <span className={cn("tabular-nums", c.over && "rounded-xs bg-pop-1/45 px-1 text-ink")}>
                      {c.used}/{c.limit}
                    </span>
                  </>
                ) : (
                  c.label
                )}
              </Fragment>
            ))
          )}
        </p>
        <p className="mono hidden shrink-0 items-center gap-1.5 md:flex">
          <span>
            <kbd className="rounded-xs border border-line-strong px-1 text-ink">/</kbd> to try
          </span>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={onPauseToggle}
            className="relative min-h-6 text-ink underline decoration-accent-text decoration-1 underline-offset-3 before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']"
          >
            {pauseLabel}
          </button>
        </p>
      </div>
    </div>
  );
});
