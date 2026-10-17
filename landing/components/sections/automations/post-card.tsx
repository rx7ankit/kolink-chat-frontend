"use client";

import type { CSSProperties } from "react";
import { Bookmark, Heart, MessageCircle, Send, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Reel } from "@/components/media/reel";
import { Glyph, type Handler } from "@/components/transit/glyph";
import { FlapText } from "@/components/ui/flap-text";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";
import { demoBrand } from "@/lib/media";

import { BrandAvatar, scrim } from "./brand";
import { beats, finalPhase, postCaption, routePhases, statusFor, streamComments, type Phase } from "./data";
import { Highlighted } from "./highlight";

type CommentState = { status: string; handler: Handler; active: boolean };

/** Where each comment stands at `step`, given the live phase of the current beat. */
function commentState(id: string, step: number, phase: Phase | null): CommentState | null {
  let last = -1;
  for (let i = 0; i < Math.min(step, beats.length); i++) if (beats[i].comment === id) last = i;
  if (last < 0) return null;
  const { route } = beats[last];
  const active = last === step - 1;
  const ph: Phase = active ? (phase ?? routePhases[route][0]) : finalPhase(route);
  const status = statusFor(route, ph);
  const handler: Handler = route === "inbox" ? (ph === "routed" || ph === "sorted" ? "team" : "incoming") : "automation";
  return { status, handler, active };
}

/*
 * The post is laid out the way Instagram lays it out at each width:
 * - phones and narrow desktops: the feed card (header, 4:5 media, actions, caption, comments);
 * - xl: the desktop post view (media on the left, header, caption and comments on the right),
 *   stretched to the diagram's height so the pinned stage reads as one block.
 * Between lg and xl the column is narrow and the stage is pinned, so the media gets a
 * viewport-aware height instead of 4:5 and the decorative action row steps aside.
 */
const postCss = `.ka-post { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "media" "acts" "cap" "com"; }
.ka-post-head { grid-area: head; } .ka-post-media { grid-area: media; aspect-ratio: 4 / 5; }
.ka-post-acts { grid-area: acts; } .ka-post-cap { grid-area: cap; } .ka-post-com { grid-area: com; }
@media (min-width: 1024px) and (max-width: 1279.98px) {
  .ka-post-media { aspect-ratio: auto; height: clamp(140px, calc(100svh - 660px), 380px); }
  .ka-post-acts { display: none; }
}
@media (min-width: 1280px) {
  .ka-post { height: 100%; grid-template-columns: minmax(0, 45fr) minmax(0, 55fr); grid-template-rows: auto auto 1fr auto;
    grid-template-areas: "media head" "media cap" "media com" "media acts"; }
  .ka-post-media { aspect-ratio: auto; min-height: 400px; }
  .ka-post-acts { border-top: 1px solid var(--k-line); }
}`;

export function PostCard({
  step,
  phase,
  still,
  pace,
  amp,
}: {
  step: number;
  phase: Phase | null;
  still: boolean;
  pace: number;
  amp: number;
}) {
  const rows = streamComments
    .map((c) => ({ c, state: commentState(c.id, step, phase) }))
    .filter((r): r is { c: (typeof streamComments)[number]; state: CommentState } => r.state !== null);

  return (
    <article
      className="ka-post k-card overflow-hidden"
      style={{ "--k-tilt": "-1deg" } as CSSProperties}
      aria-label={`Example Instagram reel by @${demoBrand.handle}, with its comments`}
    >
      <style>{postCss}</style>
      <header className="ka-post-head flex items-center gap-3 px-4 py-3 xl:border-b xl:border-line">
        <BrandAvatar size={32} />
        <div className="min-w-0">
          <p className="truncate text-[14px] leading-tight font-semibold">{demoBrand.handle}</p>
          <p className="mono mt-0.5 text-[11px] leading-tight text-ink-soft">Reel · Drop 04</p>
        </div>
        <span className="ml-auto" data-active={step > 0 ? "true" : "false"}>
          <PlatformIcon id="instagram" size={18} title="Instagram" />
        </span>
      </header>

      <div className="ka-post-media relative overflow-hidden bg-bg-alt">
        <Reel className="absolute inset-0 object-[50%_46%]" />
        <span
          aria-hidden
          className="absolute right-3 bottom-3 grid size-7 place-items-center rounded-full text-white"
          style={{ background: scrim(0.62) }}
        >
          <VolumeX className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      <div className="ka-post-acts flex items-center gap-3.5 px-4 pt-3 text-ink xl:py-3" aria-hidden>
        <Heart className="size-[19px]" strokeWidth={1.6} />
        <MessageCircle className="size-[19px]" strokeWidth={1.6} />
        <Send className="size-[19px]" strokeWidth={1.6} />
        <span className="ml-auto flex items-center gap-3">
          <span className="mono hidden text-[11px] tracking-[0.06em] text-ink-soft uppercase xl:inline">2 h ago</span>
          <Bookmark className="size-[19px]" strokeWidth={1.6} />
        </span>
      </div>

      <div className="ka-post-cap px-4 pt-2.5 xl:pt-3">
        <p className="text-[13.5px] leading-snug">
          <span className="font-semibold">{demoBrand.handle}</span> {postCaption}
        </p>
      </div>

      <div className="ka-post-com mt-3 border-t border-line px-4 pt-3 pb-3">
        <p className="eyebrow flex items-center justify-between">
          <span>Comments</span>
          <span aria-hidden>
            <Odometer value={rows.length} className="text-[12px] text-ink" />
          </span>
        </p>
        <div className="relative mt-2 min-h-[236px]">
          {/* initial={false}: the empty state is part of the server-rendered first paint. */}
          <AnimatePresence initial={false}>
            {rows.length === 0 && (
              <motion.p
                key="empty"
                className="absolute inset-x-0 top-3 text-[13px] text-ink-soft"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                No comments yet.
              </motion.p>
            )}
          </AnimatePresence>
          <ul>
            <AnimatePresence initial={false}>
              {rows.map(({ c, state }) => (
                <motion.li
                  key={c.id}
                  className="relative overflow-hidden"
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-md bg-bg-alt"
                    style={{ opacity: state.active ? 1 : 0, transition: "opacity .3s" }}
                  />
                  <motion.div
                    className="relative flex gap-2.5 px-1.5 py-[5px] xl:gap-2"
                    initial={still ? false : { y: 32 * amp, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.26 * (pace || 1), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span
                      className="mono mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-[11px] text-ink uppercase xl:size-6"
                      aria-hidden
                    >
                      {c.handle[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] leading-snug break-words xl:text-[13px]">
                        <span className="font-semibold">{c.handle}</span> <Highlighted text={c.text} range={c.hl} />
                      </p>
                      <p className={cn("mt-0.5 flex items-center gap-1.5 text-[11px] leading-4", state.active ? "text-ink" : "text-ink-soft")}>
                        <Glyph handler={state.handler} size={8} />
                        <span className="sr-only">Status: {state.status}</span>
                        <span aria-hidden>
                          <FlapText text={state.status} />
                        </span>
                      </p>
                    </div>
                  </motion.div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </article>
  );
}
