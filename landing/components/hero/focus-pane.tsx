"use client";

import { Fragment, memo, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Photo } from "@/components/media/photo";
import { Glyph } from "@/components/transit/glyph";
import { FlapText } from "@/components/ui/flap-text";
import { cn } from "@/lib/cn";
import type { FocusLine } from "@/lib/hero/board";
import type { Media, ThreadLine } from "@/lib/hero/types";
import { demoBrand } from "@/lib/media";
import type { PlatformId } from "@/lib/platforms";

import { MediaThumb, PostScene } from "./post-media";

const EASE = [0.22, 1, 0.36, 1] as const;
/** The next scene rises like a sheet: quick off the mark, long soft landing. */
const SHEET = [0.32, 0.72, 0, 1] as const;
/** New lines settle with a spring; the ones above are pushed by the same spring (layout, transforms only). */
const LINE = { type: "spring", stiffness: 420, damping: 36 } as const;
/**
 * Scene change: the next scene slides up over the last as one opaque sheet (its own content never
 * sliced by a moving edge), while the covered one eases up and dims under it.
 */
const WIPE = 0.5;
const WIPE_PREVIEW = 0.3;

const byLabel = { automation: "Automation", agent: "AI agent", team: "Your team" } as const;

function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mono text-[11px] leading-snug text-ink-soft", className)}>{children}</p>;
}

/** The keyword an automation matched, with a highlighter swipe in a pop3 tint (text stays ink). */
function Highlighted({ text, mark, still }: { text: string; mark?: string; still: boolean }) {
  if (!mark) return <>{text}</>;
  const at = text.toLowerCase().indexOf(mark.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="relative inline-block">
        <motion.span
          aria-hidden
          className="absolute inset-x-[-2px] top-[45%] bottom-[1px] origin-left rounded-[2px] bg-pop-3/45"
          initial={still ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.22, delay: 0.12, ease: EASE }}
        />
        <span className="relative">{text.slice(at, at + mark.length)}</span>
      </span>
      {text.slice(at + mark.length)}
    </>
  );
}

/** Agent replies reveal through word masks, 24ms per word (after `delay`: a morphing bubble settles first). */
function Words({ text, still, delay = 0.1 }: { text: string; still: boolean; delay?: number }) {
  if (still) return <>{text}</>;
  return (
    <>
      {text.split(" ").map((w, i) => (
        // The space sits outside the mask: trailing spaces inside an inline-block collapse.
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="inline-block overflow-hidden pb-[0.1em] align-bottom -mb-[0.1em]">
            <motion.span
              className="inline-block"
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.22, delay: delay + i * 0.024, ease: EASE }}
            >
              {w}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

type Ctx = { media: Media | null; platform: PlatformId | null; still: boolean };

/** The typing dots grow into the reply that replaces them (same slot, same id): one bubble, morphing. */
const BUBBLE = { type: "spring", stiffness: 520, damping: 42 } as const;
const bubbleId = (line: FocusLine | ThreadLine, ctx: Ctx) =>
  !ctx.still && "id" in line && line.id >= 0 && (line.k === "typing" || line.reveal === "words") ? `kh-bubble-${line.id}` : undefined;

function Line({ line, ctx }: { line: FocusLine; ctx: Ctx }) {
  const { still } = ctx;
  switch (line.k) {
    case "them":
      // The margin note sits right beside its bubble (not after the wider handle label above it).
      return (
        <div className="min-w-0">
          {line.who && <Note className="mb-0.5 truncate tracking-[0.02em] uppercase">{line.who}</Note>}
          <div className="flex min-w-0 flex-wrap items-end gap-x-2.5 gap-y-0.5">
            <p className="max-w-[86%] min-w-0 rounded-[14px] rounded-bl-[4px] bg-bg-alt px-3 py-1.5 text-[13px] leading-snug break-words text-ink min-[75rem]:text-[14px]">
              <Highlighted text={line.text ?? ""} mark={line.highlight} still={still} />
            </p>
            {line.note && <Note className="pb-1.5 text-accent-text">{line.note}</Note>}
          </div>
        </div>
      );
    case "us": {
      // A reply that grows out of the typing dots: its label and margin note wait until the bubble
      // has settled (the bubble travels through the label's row), and the text is scale-corrected.
      const morph = bubbleId(line, ctx);
      const settle = (delay: number) => (morph ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay } } : {});
      return (
        <div className="flex min-w-0 flex-col items-end">
          <motion.div className="max-w-full min-w-0" {...settle(0.2)}>
            <Note className="mb-0.5 flex max-w-full min-w-0 items-center gap-1 tracking-[0.02em] uppercase">
              {line.by && <Glyph handler={line.by} size={9} />}
              {line.by ? byLabel[line.by] : ""}
              {line.via ? ` · ${line.via}` : ""}
            </Note>
          </motion.div>
          <motion.div
            layoutId={morph}
            transition={{ layout: BUBBLE }}
            className="max-w-[90%] min-w-0 bg-ink px-3 py-1.5 text-[13px] leading-snug text-bg min-[75rem]:text-[14px]"
            style={{ borderRadius: "14px 14px 4px 14px" }}
          >
            <motion.p layout={morph ? true : undefined} className="break-words">
              {line.reveal === "words" ? <Words text={line.text ?? ""} still={still} delay={morph ? 0.14 : 0.1} /> : line.text}
            </motion.p>
            {line.buttons && !line.cards && (
              <span className="mt-1.5 flex flex-wrap gap-1">
                {line.buttons.map((b) => (
                  <span key={b} className="rounded-full px-2 py-0.5 text-[11px] ring-1 ring-bg/45">
                    {b}
                  </span>
                ))}
              </span>
            )}
          </motion.div>
          {line.cards && (
            <ul className="mt-1.5 flex max-w-full items-end gap-1.5" aria-label="Catalog cards">
              {line.cards.map((c, i) => (
                <motion.li
                  key={c.title}
                  className="w-[80px] shrink-0 overflow-hidden rounded-[10px] bg-surface shadow-[0_0_0_1px_var(--k-line)] sm:w-[92px] min-[75rem]:w-[104px]"
                  initial={still ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.07, ease: EASE }}
                >
                  <div className="relative h-[46px] overflow-hidden min-[75rem]:h-[50px]">
                    <Photo id={c.photo} alt="" sizes="104px" />
                  </div>
                  <div className="px-1.5 pt-1 pb-1.5">
                    <p className="truncate text-[11px] leading-tight text-ink">{c.title}</p>
                    <p className="mono mt-0.5 truncate text-[11px] leading-tight text-ink">
                      {c.price} <span className="text-ink-soft">· {c.meta}</span>
                    </p>
                  </div>
                </motion.li>
              ))}
              {/* The carousel's own button rides after the cards (keeps the bubble one line tall). */}
              {line.buttons?.map((b) => (
                <li key={b} className="mono shrink-0 self-center rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink">
                  {b} ›
                </li>
              ))}
            </ul>
          )}
          {line.note && (
            <motion.div className="max-w-full min-w-0" {...settle(0.32)}>
              <Note className="mt-0.5 text-accent-text">{line.note}</Note>
            </motion.div>
          )}
        </div>
      );
    }
    case "tap":
      return (
        <Note className="flex items-center gap-1.5">
          <span aria-hidden>↳</span> taps
          <span className="rounded-full border border-line-strong px-1.5 py-px text-ink">{line.text}</span>
        </Note>
      );
    case "note":
      return <Note className="text-accent-text">{line.text}</Note>;
    case "typing":
      return (
        <div className="flex justify-end">
          <span className="sr-only">The agent is typing</span>
          <motion.span
            aria-hidden
            layoutId={bubbleId(line, ctx)}
            transition={{ layout: BUBBLE }}
            className="flex gap-1 bg-ink px-3 py-2.5"
            style={{ borderRadius: "14px 14px 4px 14px" }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="kh-dot kh-loop size-1.5 rounded-full bg-bg" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </motion.span>
        </div>
      );
    case "handoff":
      return (
        <div className="flex gap-2 rounded-[10px] border border-line bg-bg px-2.5 py-1.5" style={{ boxShadow: "inset 3px 0 0 var(--k-pop1-deep)" }}>
          <Glyph handler="attention" size={11} className="mt-0.5" />
          <div className="mono min-w-0 text-[11px] leading-snug">
            <p className="tracking-[0.06em] text-ink uppercase">Needs attention · note for your team</p>
            <p className="text-ink-soft">
              Asked: {line.handoff?.asked} / Tried: {line.handoff?.tried} / Why: {line.handoff?.why}
            </p>
          </div>
        </div>
      );
    case "published": {
      // Inside a mixed thread (rare): one compact line. The full moment is the fan (see Scene).
      const live = line.tags?.filter((t) => !t.warn) ?? [];
      return (
        <Note className="flex flex-wrap items-center gap-1.5 tracking-[0.04em] uppercase">
          <Glyph handler="post" size={8} /> Published to {live.length}
          {live.map((t) => (
            <PlatformIcon key={t.platform} id={t.platform} size={11} />
          ))}
        </Note>
      );
    }
  }
}

const postNoun = (p: PlatformId | null, media: Media | null) => {
  switch (p) {
    case "instagram":
      return media?.igFormat === "reel" && media.video ? "Your Reel" : "Your post";
    case "facebook":
      return "Your Page post";
    case "threads":
      return "Your thread";
    case "linkedin":
      return "Your Company Page post";
    default:
      return "Your post";
  }
};

/**
 * Comment threads open under the post they belong to, the way a native comment sheet does:
 * its thumbnail (the Reel cover, the photo, or a text tile on LinkedIn) and the caption.
 */
function PostStrip({ ctx, post }: { ctx: Ctx; post: string }) {
  return (
    <div className="absolute inset-x-0 top-0 flex h-11 items-center gap-2.5 rounded-[12px] bg-bg-alt/80 py-1 pr-3 pl-1">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-[9px] shadow-[0_0_0_1px_var(--k-line)]">
        <MediaThumb media={ctx.media} platform={ctx.platform ?? undefined} sizes="36px" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mono flex min-w-0 items-center gap-1 text-[10px] leading-tight tracking-[0.04em] text-ink-soft uppercase">
          {ctx.platform && <PlatformIcon id={ctx.platform} size={10} />}
          <span className="truncate">
            {postNoun(ctx.platform, ctx.media)} · @{demoBrand.handle}
          </span>
        </p>
        {post && <p className="mt-1 truncate text-[13px] leading-tight text-ink">{post}</p>}
      </div>
    </div>
  );
}

/**
 * One conversation. It reads from the top (under the post strip) while it fits, so a short
 * exchange never sits under a void; once it outgrows the pane the newest line stays in view and
 * any line that no longer fits whole fades out as it slides up. (A trailing spacer absorbs free
 * space; with none left, justify-end makes the overflow spill off the top.)
 * Lines already there when the scene mounts arrive with the scene's own sheet. Later ones rise in
 * by their own height on a spring, and every line above is pushed by the same spring (a
 * position-only layout animation), so nothing jumps or overlaps; a line that drops off the top
 * fades out of the flow.
 */
function Thread({ lines, ctx, post, onPost }: { lines: FocusLine[]; ctx: Ctx; post: string; onPost: boolean }) {
  const [born] = useState(() => new Set(lines.map((l) => l.id)));
  const { still } = ctx;
  const column = useRef<HTMLDivElement>(null);
  // A line pushed past the top edge fades out whole as it starts to rise, instead of leaving a
  // sliver (half a dark bubble) under the post strip. offsetTop is the settled layout position:
  // layout animations only add transforms, so this never measures a line mid-flight.
  useLayoutEffect(() => {
    const el = column.current;
    if (!el) return;
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement && child.dataset.line !== undefined) child.toggleAttribute("data-off", child.offsetTop < 2);
    }
  });
  return (
    <>
      {onPost && <PostStrip ctx={ctx} post={post} />}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_8px)]",
          onPost ? "top-[46px]" : "top-0",
        )}
      >
        <div ref={column} className="relative flex h-full flex-col justify-end pt-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {lines.map((l) => (
              <motion.div
                key={l.id}
                data-line=""
                layout={still ? false : "position"}
                className="group/line min-w-0 shrink-0"
                // A new line rises by its own height on the same spring that lifts the lines above it,
                // like a conveyor: it never lands on a line that has not moved out of the way yet.
                initial={born.has(l.id) ? false : still ? { opacity: 0 } : { opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.16 } }}
                transition={{ layout: LINE, y: LINE, opacity: { duration: 0.24 } }}
              >
                <div className="pt-1.5 transition-opacity duration-200 group-data-[off]/line:opacity-0">
                  <Line line={l} ctx={ctx} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div aria-hidden className="min-h-0 flex-1" />
        </div>
      </div>
    </>
  );
}

/** A one-line label that rolls to its next value: old up and out, new up and in, in step (never both readable). */
function Roll({ text, still, className }: { text: string; still: boolean; className?: string }) {
  return (
    <span className={cn("relative block h-4 min-w-0 overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.span
          key={text}
          className="absolute inset-0 truncate leading-4"
          initial={still ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={still ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          transition={{ duration: still ? 0.12 : 0.3, ease: EASE }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * NOW ARRIVING · {LINE}: one readable conversation at a time. Before anything departs it
 * previews the draft; at the publish beat the draft's own media morphs into the Instagram post
 * and the other native posts deal out beside it (same surface, no cut). Every other switch slides
 * the next scene up over the last as one opaque sheet; the old scene is removed
 * only once it is fully covered, so the pane is never empty and two scenes never overlap.
 * Margin notes sit outside the bubbles: they explain the mechanism, customers never see them.
 */
export const FocusPane = memo(function FocusPane({
  title,
  status,
  lines,
  onPost,
  post,
  layer,
  platform,
  media,
  preview,
  hint,
  still,
  onResume,
}: {
  title: string;
  status: string | null;
  lines: FocusLine[];
  /** The scene is a comment thread under the published post. */
  onPost: boolean;
  /** Caption of the post this run published. */
  post: string;
  /** The pane surface: a new value slides a new scene in. */
  layer: number;
  platform: PlatformId | null;
  media: Media | null;
  /** Hover/pin preview of one row's latest exchange. */
  preview: { title: string; lines: ThreadLine[]; pinned: boolean; platform: PlatformId } | null;
  hint: string | null;
  still: boolean;
  onResume: () => void;
}) {
  const shown: FocusLine[] = preview ? preview.lines.slice(-4).map((l, i) => ({ ...l, id: -1 - i })) : lines;
  const heading = preview ? preview.title : title;
  const ctx: Ctx = { media, platform: preview ? preview.platform : platform, still };
  const fan = shown.length === 1 && shown[0].k === "published" ? shown[0] : null;
  const key = preview ? `pv-${preview.platform}` : `L${layer}`;
  const wipe = preview ? WIPE_PREVIEW : WIPE;

  let body: ReactNode;
  if (preview && shown.length === 0) {
    body = <Note className="pt-2">Nothing on this line yet.</Note>;
  } else if (shown.length === 0 || fan) {
    body = <PostScene phase={fan ? "published" : "draft"} media={media} caption={fan?.text ?? post} tags={fan?.tags ?? []} still={still} />;
  } else {
    body = <Thread lines={shown} ctx={ctx} post={post} onPost={preview ? preview.lines.some((l) => l.onPost) : onPost} />;
  }

  return (
    <div className="kh-b-focus relative flex h-[216px] flex-col border-t border-line min-[75rem]:h-[240px]">
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 px-3 min-[75rem]:px-4">
        <p className="mono min-w-0 flex-1 text-[11px] tracking-[0.06em] text-ink-soft uppercase">
          <Roll text={heading} still={still} />
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {hint && !preview && (
            <span className="mono hidden rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink sm:inline">{hint}</span>
          )}
          {status && !preview && (
            <span className="mono rounded-full bg-bg-alt px-2 py-0.5 text-[11px] text-ink">
              <span aria-hidden>
                <FlapText text={status} />
              </span>
              <span className="sr-only">Status: {status}</span>
            </span>
          )}
          {preview?.pinned && (
            <button
              type="button"
              onClick={onResume}
              className="mono relative inline-flex min-h-7 items-center rounded-full bg-ink px-3 text-[11px] tracking-[0.06em] text-bg uppercase before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
            >
              Resume
            </button>
          )}
        </div>
      </div>
      <div className="relative mx-3 mb-3 min-h-0 flex-1 overflow-hidden min-[75rem]:mx-4">
        <AnimatePresence initial={false}>
          <motion.div
            key={key}
            // The sheet's top edge carries a soft shadow while it travels (clipped away once it lands).
            className="absolute inset-0 bg-surface shadow-[0_-14px_24px_-16px_rgba(38,43,38,0.28)] [container-type:size]"
            initial={still ? false : { y: "100%", opacity: 1 }}
            animate={{ y: "0%", opacity: 1 }}
            // The covered scene recedes (eases up, dimmed) and is dropped once fully covered.
            // A preview never dims: if the scene under it comes back mid-change, the preview stays opaque on top.
            exit={
              still
                ? { opacity: 0, transition: { duration: 0 } }
                : { y: -16, opacity: preview ? 1 : 0.4, transition: { duration: wipe, ease: SHEET } }
            }
            transition={{ duration: wipe, ease: SHEET }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});
