"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useInView } from "motion/react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Photo } from "@/components/media/photo";
import { Glyph } from "@/components/transit/glyph";
import type { PlatformId } from "@/lib/platforms";
import { demoBrand, type PhotoId } from "@/lib/media";

import { BrandAvatar } from "./brand";
import { deleteDemo, replyDemo } from "./data";
import { Highlighted } from "./highlight";
import { useSectionMotion } from "./hooks";

/**
 * Facebook Pages and Threads get keyword reply and keyword delete only.
 * A narrow strip, played once on inView: a reply lands under "SIZE"; a spam
 * comment gets a Deleted stamp and collapses while the normal one stays (the log
 * line below it slides up with a transform-based layout animation).
 */
export function FbThreadsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const { still, pace, amp } = useSectionMotion();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!inView || still) return;
    const marks = [250, 900, 1500, 2700];
    // One-way: a Studio pace change mid-run never rewinds the strip.
    const timers = marks.map((ms, i) => window.setTimeout(() => setBeat((n) => Math.max(n, i + 1)), ms * pace));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, still, pace]);

  const b = still ? 4 : beat;
  const ease = [0.22, 1, 0.36, 1] as const;
  const t = (d: number) => (still ? { duration: 0 } : { duration: d * pace, ease });

  return (
    <div ref={ref} className="k-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 md:px-6">
        <span className="flex items-center gap-2" data-active={b > 0 ? "true" : "false"}>
          <PlatformIcon id="facebook" size={18} title="Facebook" />
          <PlatformIcon id="threads" size={18} title="Threads" />
        </span>
        <h3 className="text-[16px] font-semibold">Facebook Pages and Threads</h3>
      </header>

      <div className="grid md:grid-cols-2">
        {/* Keyword → reply, on a Threads post */}
        <div className="min-w-0 border-b border-line p-5 md:border-r md:border-b-0 md:p-6">
          <p className="eyebrow flex flex-wrap items-center gap-2">
            <Glyph handler="automation" size={9} /> Keyword → reply
            <Chip>{replyDemo.keyword}</Chip>
          </p>
          <PostContext network="threads" photo={replyDemo.post.photo} author={`@${demoBrand.handle}`} kind={replyDemo.post.kind} />
          <div className="mt-4 space-y-3">
            <Comment handle={replyDemo.comment.handle}>
              <Highlighted text={replyDemo.comment.text} range={replyDemo.comment.hl} play={b >= 1} delay={0.1} />
            </Comment>
            <div className="overflow-hidden pl-9">
              <motion.div initial={false} animate={{ y: b >= 2 ? "0%" : "110%", opacity: b >= 2 ? 1 : 0 }} transition={t(0.42)}>
                <Comment handle={demoBrand.handle} reply>
                  {replyDemo.reply}
                </Comment>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Keyword → delete, on a Facebook Page post */}
        <div className="min-w-0 p-5 md:p-6">
          <p className="eyebrow flex flex-wrap items-center gap-2">
            <Glyph handler="automation" size={9} /> Keyword → delete
            {deleteDemo.words.map((w) => (
              <Chip key={w}>{w}</Chip>
            ))}
          </p>
          <PostContext network="facebook" photo={deleteDemo.post.photo} author={demoBrand.name} kind={deleteDemo.post.kind} />
          <ul className="mt-4 min-h-[108px] space-y-3">
            <LayoutGroup>
              <li>
                <Comment name={deleteDemo.keep.name}>{deleteDemo.keep.text}</Comment>
              </li>
              <AnimatePresence initial={false}>
                {b >= 1 && b < 4 && (
                  <motion.li
                    key="spam"
                    className="relative"
                    initial={{ x: 24 * amp, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={
                      still
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { opacity: 0, scaleY: 0.4, transition: { duration: 0.26 * pace } }
                    }
                    style={{ originY: 0 }}
                    transition={t(0.32)}
                  >
                    <Comment name={deleteDemo.spam.name}>
                      <Highlighted text={deleteDemo.spam.text} range={deleteDemo.spam.hl} play={b >= 2} delay={0} />
                    </Comment>
                    <AnimatePresence>
                      {b >= 3 && (
                        <motion.span
                          className="mono absolute top-1/2 right-1 -translate-y-1/2 -rotate-6 rounded-[3px] border-2 border-ink bg-surface px-2 py-1 text-[11px] tracking-[0.12em] text-ink uppercase"
                          initial={still ? false : { scale: 1.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 520, damping: 28 }}
                        >
                          Deleted
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.li>
                )}
              </AnimatePresence>
              {b >= 4 && (
                <motion.li
                  layout
                  className="mono text-[11.5px] text-ink-soft"
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    still
                      ? { duration: 0 }
                      : { duration: 0.3 * pace, ease, layout: { duration: 0.32 * pace, ease: [0.65, 0, 0.35, 1] } }
                  }
                >
                  1 comment deleted · matched “crypto”
                </motion.li>
              )}
            </LayoutGroup>
          </ul>
        </div>
      </div>

      <p className="border-t border-line px-5 py-3 text-[13px] leading-snug text-ink-soft md:px-6">
        Comment → DM is Instagram-only. Facebook and Threads get keyword reply and delete; Threads comments arrive on sync.
      </p>
    </div>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="mono rounded-full border border-line-strong px-2 py-[3px] text-[11px] leading-none tracking-normal text-ink normal-case" style={{ background: "var(--k-surface)" }}>
      {children}
    </span>
  );
}

/** The post the comments sit under: its photo, the brand as that network shows it, and the post type. */
function PostContext({ network, photo, author, kind }: { network: PlatformId; photo: PhotoId; author: string; kind: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 border-b border-line pb-4">
      <span className="relative h-[50px] w-10 shrink-0 overflow-hidden rounded-md bg-bg-alt" aria-hidden>
        <Photo id={photo} alt="" sizes="40px" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[13.5px] leading-tight font-medium">
          <PlatformIcon id={network} size={13} />
          <span className="truncate">{author}</span>
        </p>
        <p className="mono mt-1 truncate text-[11px] text-ink-soft">{kind}</p>
      </div>
    </div>
  );
}

/** A comment row. Threads shows @handles; Facebook shows people's names (`name`). */
function Comment({
  handle,
  name,
  children,
  reply = false,
}: {
  handle?: string;
  name?: string;
  children: ReactNode;
  reply?: boolean;
}) {
  const who = name ?? `@${handle ?? ""}`;
  return (
    <div className="flex gap-2.5">
      {reply ? (
        <BrandAvatar size={28} />
      ) : (
        <span
          className="mono grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-[11px] uppercase"
          aria-hidden
        >
          {(name ?? handle ?? "?")[0]}
        </span>
      )}
      <p className="min-w-0 pt-1 text-[14px] leading-snug break-words">
        <span className="font-semibold">{who}</span> {children}
      </p>
    </div>
  );
}
