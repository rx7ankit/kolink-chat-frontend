"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { motion, useInView } from "motion/react";
import { FileSpreadsheet, Link2 } from "lucide-react";

import { Photo } from "@/components/media/photo";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

import type { Answer, ChatStep } from "./data";

const easeOut = [0.22, 1, 0.36, 1] as const;

function AnswerContent({ answer }: { answer: Answer }) {
  switch (answer.type) {
    case "text":
      return <p className="text-[15px] leading-[1.5] text-ink">{answer.text}</p>;
    case "link":
      return (
        <p className="mono flex min-w-0 items-center gap-2 text-[13px] text-ink">
          <Link2 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {/* Phones drop the scheme so the link stays on one line instead of breaking mid-word. */}
          <span className="min-w-0 truncate">
            <span className="max-md:hidden">{answer.text.match(/^https?:\/\//)?.[0]}</span>
            {answer.text.replace(/^https?:\/\//, "")}
          </span>
        </p>
      );
    case "file":
      return (
        <div className={cn("min-w-0", answer.rows && "w-[300px] max-w-full")}>
          <p className="flex items-center gap-2.5 text-[14px] text-ink">
            <FileSpreadsheet className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="font-semibold">{answer.name}</span>
            <span className="mono text-[11px] text-ink-soft">{answer.meta}</span>
          </p>
          {answer.rows && (
            <>
              <ul className="mt-3 flex flex-col border-t border-line" aria-label={`First rows of ${answer.name}`}>
                {answer.rows.map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-2"
                  >
                    <span className="size-9 overflow-hidden rounded-md bg-bg-alt ring-1 ring-line">
                      <Photo id={row.photo} alt="" sizes="72px" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] leading-tight font-medium text-ink">{row.name}</span>
                      <span className="mono mt-0.5 block truncate text-[11px] text-ink-soft">{row.note}</span>
                    </span>
                    <span className="mono text-[12px] text-ink">{row.price}</span>
                  </li>
                ))}
              </ul>
              {answer.more && <p className="mono mt-2 text-[11px] text-ink-soft">+ {answer.more}</p>}
            </>
          )}
        </div>
      );
    case "platforms":
      return (
        <ul className="flex flex-wrap gap-2" aria-label="Channels">
          <li className="flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] shadow-[inset_0_0_0_1px_var(--k-line-strong)]" data-active="true">
            <PlatformIcon id="instagram" size={15} />
            Instagram
            <span className="mono flex items-center gap-1 text-[11px] text-ink-soft">
              <Glyph handler="agent" size={8} /> Agentic
            </span>
          </li>
          <li className="flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] shadow-[inset_0_0_0_1px_var(--k-line-strong)]" data-active="true">
            <PlatformIcon id="messenger" size={15} />
            Messenger
            <span className="mono flex items-center gap-1 text-[11px] text-ink-soft">
              <Glyph handler="automation" size={8} /> Menu
            </span>
          </li>
        </ul>
      );
  }
}

/**
 * One onboarding exchange: koLink's prompt in plain text, the owner's answer in an
 * accent-outlined bubble that rises through a mask once the step is in view.
 */
export function ChatStepItem({
  step,
  index,
  total,
  answered,
  onView,
  bubbleRef,
  below,
}: {
  step: ChatStep;
  index: number;
  total: number;
  answered: boolean;
  onView: (index: number) => void;
  bubbleRef: Ref<HTMLDivElement>;
  /** Phone-only content under the answer (the filed card). */
  below?: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.6, once: true });
  const { still, pace } = useMotionPrefs();

  useEffect(() => {
    if (inView) onView(index);
  }, [inView, index, onView]);

  const n = index + 1;
  const isLast = n === total;
  return (
    <li ref={ref} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-4 md:grid-cols-[40px_minmax(0,1fr)] md:gap-x-5">
      {/* The chat's own line: a station per question */}
      <div aria-hidden className="relative flex justify-center">
        <span className={cn("absolute top-0 w-[2px] bg-line", isLast ? "h-4" : "bottom-0")} />
        <span
          className={cn(
            "mono relative mt-0.5 grid size-8 place-items-center rounded-full text-[11px] tabular-nums transition-colors duration-500 md:size-9",
            answered ? "bg-ink text-bg" : "bg-surface text-ink-soft shadow-[inset_0_0_0_2px_var(--k-line-strong)]",
          )}
        >
          {n}
        </span>
      </div>

      <div className={cn("min-w-0", isLast ? "pb-2" : "pb-14 md:pb-20")}>
        {/* koLink asks beside its numbered stop; the owner answers on the right. */}
        <p className="max-w-[40ch] pt-1 text-[17px] leading-[1.5] text-ink md:text-[19px]">{step.prompt}</p>

        <div className="mt-5 flex flex-col items-end">
          <div ref={bubbleRef} className="max-w-[88%] overflow-hidden p-[2px] md:max-w-[80%]">
            <motion.div
              initial={false}
              animate={{ y: answered ? "0%" : "112%" }}
              transition={{ duration: still ? 0 : 0.5 * pace, ease: easeOut }}
              className="rounded-2xl rounded-br-sm bg-surface px-4 py-3 shadow-[inset_0_0_0_1.5px_var(--k-accent-text)]"
            >
              <AnswerContent answer={step.answer} />
            </motion.div>
          </div>
        </div>

        {below && <div className="mt-4 lg:hidden">{below}</div>}
      </div>
    </li>
  );
}
