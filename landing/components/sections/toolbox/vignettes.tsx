"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CornerUpLeft, Plus } from "lucide-react";

import { Photo } from "@/components/media/photo";
import { Counter } from "@/components/motion/counter";
import { Glyph } from "@/components/transit/glyph";
import { Roundel } from "@/components/transit/roundel";
import { FlapText } from "@/components/ui/flap-text";
import { Odometer } from "@/components/ui/odometer";
import { cn } from "@/lib/cn";
import { catalog, type PhotoId } from "@/lib/media";
import { useSafeMotionPrefs } from "../inbox/hooks";

import { tint } from "../inbox/data";

const out = [0.22, 1, 0.36, 1] as const;

/**
 * One-shot step clock for a vignette: 0 until `play`, then 1, 2, … at each scheduled ms.
 * Still motion (OS reduced motion or Studio "Still") jumps straight to the last step.
 */
function useSteps(play: boolean, schedule: readonly number[]) {
  const { still, pace } = useSafeMotionPrefs();
  const [step, setStep] = useState(0);
  const key = schedule.join(",");
  useEffect(() => {
    if (!play || still) return;
    const ids = key.split(",").map((ms, i) => window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), Number(ms) * pace));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [play, still, pace, key]);
  return still ? schedule.length : step;
}

function Initial({ letter, size = 20 }: { letter: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="mono inline-grid shrink-0 place-items-center rounded-[30%] bg-ink leading-none font-semibold text-bg"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.5)) }}
    >
      {letter}
    </span>
  );
}

function usePop() {
  const { still } = useSafeMotionPrefs();
  return {
    initial: still ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: still ? { duration: 0.15 } : { type: "spring" as const, stiffness: 520, damping: 28 },
  };
}

/* ---------------------------------------------------------------- 01 · DM campaigns */

type Window = "in" | "out" | "nodm";
const recipients: { name: string; w: Window }[] = [
  { name: "Mira S.", w: "in" },
  { name: "Kabir R.", w: "out" },
  { name: "Tara N.", w: "in" },
  { name: "Joel P.", w: "nodm" },
  { name: "Ines M.", w: "in" },
];
const windowLabel: Record<Window, string> = { in: "In 24h", out: "Outside window", nodm: "No DM" };
/** The campaign's product: a real catalog row, so name and price match the agent's cards. */
const offer = catalog.find((c) => c.id === "linen-shirt") ?? catalog[0];
const windowRank: Record<Window, number> = { in: 0, out: 1, nodm: 2 };

export function CampaignVignette({ play }: { play: boolean }) {
  const { still, pace } = useSafeMotionPrefs();
  const step = useSteps(play, [250, 1100, 1700, 2600]);
  const pop = usePop();
  const rows = step >= 2 ? [...recipients].sort((a, b) => windowRank[a.w] - windowRank[b.w]) : recipients;
  const status = step >= 4 ? "Sent 3 · skipped 2" : step >= 3 ? "3 in window" : "5 selected";

  return (
    <div className="flex flex-1 flex-col">
      {/* The message being sent. Campaigns are text-only in the app today, so no image here. */}
      <div className="flex items-center gap-3 rounded-lg bg-bg-alt px-3 py-2">
        <span className="min-w-0">
          <span className="mono block text-[11px] tracking-[0.03em] text-ink-soft uppercase">Instagram DM</span>
          <span className="mt-0.5 block text-[12.5px] leading-[1.4] text-ink">
            The {offer.name.toLowerCase()} is back, {offer.price}. Reply SIZE to hold one.
          </span>
        </span>
      </div>
      <ul className="mt-2">
        {rows.map((r) => {
          const skipped = step >= 4 && r.w !== "in";
          return (
            <motion.li
              key={r.name}
              layout={still ? false : "position"}
              transition={{ duration: 0.45 * (pace || 1), ease: [0.65, 0, 0.35, 1] }}
              className="flex h-6 items-center justify-between gap-2 border-b border-line text-[12.5px]"
            >
              <span className={cn("truncate transition-opacity", skipped && "text-ink-soft line-through decoration-line-strong")}>{r.name}</span>
              {step >= 1 ? (
                <motion.span
                  {...pop}
                  className={cn(
                    "mono shrink-0 rounded-sm px-1.5 py-px text-[11px] tracking-[0.02em] text-ink uppercase",
                    r.w === "nodm" && "text-ink-soft shadow-[inset_0_0_0_1px_var(--k-line-strong)]",
                    r.w === "out" && "bg-bg-alt text-ink-soft",
                  )}
                  // Accent (the legend's outbound "post" colour), not pop2: pop2 means the AI agent everywhere else.
                  style={r.w === "in" ? { background: tint("var(--k-accent)", 30) } : undefined}
                >
                  {windowLabel[r.w]}
                </motion.span>
              ) : (
                // Window check in flight: an empty dashed pill, the verdict pops in over it.
                <span aria-hidden className="h-[15px] w-12 rounded-sm shadow-[inset_0_0_0_1px_var(--k-line-strong)] [mask-image:repeating-linear-gradient(90deg,black_0_4px,transparent_4px_6px)]" />
              )}
            </motion.li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
          <Glyph handler="post" size={9} />
          <FlapText text={status} className="text-[12px]" />
        </p>
        <span className="mono flex overflow-hidden rounded-full text-[11px] tracking-[0.03em] text-ink-soft uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-bg">Send now</span>
          <span className="px-2.5 py-0.5">Schedule</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 02 · WhatsApp templates */

export function TemplateVignette({ play }: { play: boolean }) {
  const { still, pace } = useSafeMotionPrefs();
  const step = useSteps(play, [500, 1200, 2300]);
  const status = step >= 3 ? "Approved" : step >= 2 ? "In review" : "Draft";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="mono flex overflow-hidden rounded-full text-[11px] tracking-[0.03em] uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
          <span className="px-2.5 py-0.5 text-ink-soft">Marketing</span>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-bg">Utility</span>
        </span>
        <span
          className={cn(
            "mono rounded-sm px-1.5 py-0.5 text-[11px] tracking-[0.03em] uppercase transition-colors duration-300",
            step >= 3 ? "bg-ink text-bg" : "bg-bg-alt text-ink",
          )}
        >
          <FlapText text={status} />
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-bg-alt p-3">
        <Roundel platform="whatsapp" size={20} active={play && step < 3} />
        {/* Live preview, as the wizard builds it: text header, body with {{1}}, footer, quick reply. */}
        <div className="mt-2 max-w-[92%] rounded-md bg-surface px-3 py-2 text-[13px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--k-line)]">
          <p className="mb-0.5 text-[12.5px] font-semibold">Order update</p>
          Hi{" "}
          {step >= 1 ? (
            <motion.span
              key="sam"
              initial={still ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: still ? 0.15 : 0.3 * pace, ease: out }}
              className="inline-block font-semibold"
            >
              Sam
            </motion.span>
          ) : (
            <span className="mono inline-block rounded-sm bg-bg-alt px-1 text-[11.5px]">{"{{1}}"}</span>
          )}
          , your order is on its way
          <p className="mt-1 text-[11px] text-ink-soft">Northwind Studio</p>
        </div>
        <span className="mt-1.5 flex max-w-[92%] items-center justify-center rounded-md bg-surface py-1.5 text-[12px] font-semibold text-ink shadow-[inset_0_0_0_1px_var(--k-line)]">
          Track order
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 03 · Labels & assignment */

const swatches = [
  "var(--k-pop1)",
  "var(--k-pop2)",
  "var(--k-pop3)",
  "var(--k-accent)",
  "var(--k-ink-soft)",
  "color-mix(in oklab, var(--k-pop1) 55%, var(--k-pop2))",
  "color-mix(in oklab, var(--k-pop2) 50%, var(--k-pop3))",
  "color-mix(in oklab, var(--k-pop3) 55%, var(--k-accent))",
  "color-mix(in oklab, var(--k-accent) 50%, var(--k-pop1))",
  "color-mix(in oklab, var(--k-ink) 40%, var(--k-pop3))",
];
const PICK = 6;
const WORD = "Wholesale";

export function LabelsVignette({ play }: { play: boolean }) {
  const { still } = useSafeMotionPrefs();
  const step = useSteps(play, [300, 1350, 1900, 2800]);
  const typed = useSteps(step >= 1, Array.from({ length: WORD.length }, (_, k) => 120 + k * 70));
  const tone = swatches[PICK];

  return (
    // Editor, then the thread it labels, top-aligned: spare row height falls below, not between them.
    <div className="flex flex-1 flex-col gap-3">
      <div className="rounded-lg bg-bg-alt p-3">
        {step === 0 ? (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface px-3 text-[12px] font-semibold shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
            <Plus size={13} aria-hidden />
            Create label
          </span>
        ) : (
          <div>
            <div className="flex h-7 items-center rounded-md bg-surface px-2.5 text-[12.5px] shadow-[inset_0_0_0_1.5px_var(--k-line-strong)]">
              {WORD.slice(0, typed)}
              {typed < WORD.length && !still && <span aria-hidden className="ml-px h-3.5 w-px bg-ink" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Ten label colors">
              {swatches.map((s, i) => (
                <span
                  key={s}
                  className="size-4 rounded-full transition-shadow duration-300"
                  style={{
                    background: s,
                    boxShadow:
                      step >= 2 && i === PICK
                        ? "inset 0 0 0 1px var(--k-ink), 0 0 0 2px var(--k-surface), 0 0 0 3.5px var(--k-ink)"
                        : "inset 0 0 0 1px var(--k-ink)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="@container rounded-lg border border-line px-3 py-2.5">
        {/* Closing dims the conversation, not the controls: Reopen stays crisp. */}
        <div className={cn("transition-opacity duration-500", step >= 4 && "opacity-55")}>
          <div className="flex h-5 items-center gap-2 text-[12.5px]">
            <span className="mono text-[11px] font-semibold">IG</span>
            <span className="truncate font-semibold">Mira Shah</span>
            <AnimatePresence>
              {step >= 3 && (
                <motion.span
                  initial={still ? { opacity: 0 } : { opacity: 0, y: -56, scale: 1.12 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={still ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 26 }}
                  className="mono shrink-0 rounded-sm px-1.5 py-px text-[11px] tracking-[0.02em] text-ink uppercase"
                  style={{ background: tint(tone, 34) }}
                >
                  {WORD}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="mono ml-auto shrink-0 text-[11px] tracking-[0.03em] text-ink-soft uppercase">
              <FlapText text={step >= 4 ? "Closed" : "Open"} />
            </span>
          </div>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-ink-soft">
            <span className="relative size-4 shrink-0 overflow-hidden rounded-[4px] bg-bg-alt">
              <Photo id="linenStack" sizes="16px" alt="" />
            </span>
            <span className="truncate">Do you ship this set wholesale?</span>
          </p>
        </div>
        {/* Every thread has an assignee: the picker, with Asha holding this one. */}
        <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
          <span className="mono text-[11px] tracking-[0.03em] text-ink-soft uppercase">Assignee</span>
          <span className="flex items-center gap-1.5">
            {["A", "R", "D"].map((l) =>
              l === "A" ? (
                <span key={l} className="rounded-[30%] shadow-[0_0_0_1.5px_var(--k-surface),0_0_0_3px_var(--k-ink)]">
                  <Initial letter={l} size={18} />
                </span>
              ) : (
                <span
                  key={l}
                  aria-hidden
                  className="mono inline-grid size-[18px] place-items-center rounded-[30%] text-[11px] leading-none font-semibold text-ink-soft shadow-[inset_0_0_0_1px_var(--k-line-strong)]"
                >
                  {l}
                </span>
              ),
            )}
          </span>
          <span className="mono ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.03em] uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
            <FlapText text={step >= 4 ? "Reopen" : "Close"} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 04 · Team roles */

/** The ticket's body says who manages the team; the list just shows the five roles and who holds them. */
const roles: { role: string; people: string[]; note?: string }[] = [
  { role: "Owner", people: ["A"] },
  { role: "Admin", people: ["R"] },
  { role: "Editor", people: ["D"] },
  { role: "Inbox Agent", people: ["K", "M"], note: "Default" },
  { role: "Viewer", people: ["J"] },
];

export function RolesVignette({ play }: { play: boolean }) {
  const { still, pace } = useSafeMotionPrefs();
  const drawn = play || still;
  return (
    <div className="flex flex-1 flex-col gap-3">
      <ul>
        {roles.map((r, i) => (
          <li key={r.role} className="grid h-[34px] grid-cols-[auto_minmax(12px,1fr)_auto] items-center gap-2 text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">{r.role}</span>
              {r.note && (
                <span className="mono rounded-sm px-1 py-px text-[11px] tracking-[0.02em] text-ink-soft uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
                  {r.note}
                </span>
              )}
            </span>
            <motion.span
              aria-hidden
              className="h-0 border-b-2 border-dotted border-line-strong"
              initial={{ clipPath: still ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
              animate={{ clipPath: drawn ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
              transition={{ duration: still ? 0 : 0.6 * pace, delay: still ? 0 : i * 0.09 * pace, ease: [0.65, 0, 0.35, 1] }}
            />
            <span className="flex -space-x-1">
              {r.people.map((p) => (
                <span key={p} className="rounded-[30%] shadow-[0_0_0_2px_var(--k-surface)]">
                  <Initial letter={p} size={20} />
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- 05 · Contacts */

const posts: PhotoId[] = ["linenDrop", "greenLinen", "planters"];

export function ContactsVignette({ play }: { play: boolean }) {
  const { still, pace } = useSafeMotionPrefs();
  const step = useSteps(play, [200, 420, 640, 1080]);
  const field = (n: number) => ({
    initial: false as const,
    animate: step >= n ? { opacity: 1, y: 0 } : { opacity: 0, y: still ? 0 : 6 },
    transition: { duration: still ? 0.15 : 0.35 * pace, ease: out },
  });
  const fields: [string, string][] = [
    ["Tags", "wholesale · linen"],
    ["City", "Pune"],
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-[12.5px] font-semibold"
          style={{ boxShadow: "inset 0 0 0 1.5px var(--k-ink)" }}
        >
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">Mira Shah</p>
          <p className="mono truncate text-[11px] text-ink-soft">@mira.home</p>
        </div>
        <span className="flex gap-1">
          <Roundel platform="instagram" size={20} active={play && step < 4} />
          <Roundel platform="messenger" size={20} />
          <Roundel platform="gmail" size={20} />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-md bg-bg-alt p-2">
        {/* Her three latest Instagram posts, as the contact sheet shows them (read-only). */}
        <ul className="grid w-[150px] shrink-0 grid-cols-3 gap-[3px] overflow-hidden rounded-[6px]">
          {posts.map((id, i) => (
            <motion.li
              key={id}
              className="aspect-[4/5] overflow-hidden bg-surface"
              initial={false}
              animate={play || still ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
              transition={{ duration: still ? 0 : 0.5 * pace, delay: still ? 0 : 0.08 * i * pace, ease: out }}
            >
              <Photo id={id} sizes="48px" alt="" />
            </motion.li>
          ))}
        </ul>
        <dl className="min-w-0 flex-1 space-y-0.5">
          {(
            [
              ["posts", 128],
              ["followers", 2340],
              ["following", 412],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex min-w-0 items-baseline gap-1.5">
              <dt className="mono order-2 truncate text-[11px] tracking-[0.02em] text-ink-soft uppercase">{k}</dt>
              <dd className="mono order-1 text-[13px] font-semibold tabular-nums">
                <Counter to={v} duration={1.2 * (pace || 1)} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <dl className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12px]">
        {fields.map(([k, v], i) => (
          <div key={k} className="contents">
            <motion.dt className="mono text-[11px] leading-[18px] tracking-[0.02em] text-ink-soft uppercase" {...field(i + 1)}>
              {k}
            </motion.dt>
            <motion.dd className="truncate leading-[18px]" {...field(i + 1)}>
              {v}
            </motion.dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto pt-3">
        <motion.p className="truncate border-t border-line pt-2 text-[12px] text-ink-soft" {...field(3)}>
          Wants 40 sets. Quote sent.
        </motion.p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- 06 · Gmail, tidied */

const mail = [
  { id: "nikhil", from: "Nikhil Mehta", subject: "Re: Bulk order: 300 queen sets", person: true },
  { id: "promo", from: "Loomcraft Weekly", subject: "Spring edit: 30% off linen", person: false },
  { id: "ana", from: "Ana Ruiz", subject: "Wholesale catalog?", person: true },
];

export function GmailVignette({ play }: { play: boolean }) {
  const { still, pace } = useSafeMotionPrefs();
  const step = useSteps(play, [600, 1400, 2100]);
  const pop = usePop();
  const rows = step >= 1 ? mail.filter((m) => m.person) : mail;

  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-bg-alt p-1 text-[12px]">
        <span className="flex items-center justify-center gap-1.5 rounded-sm bg-surface py-1 font-semibold shadow-[inset_0_0_0_1px_var(--k-line)]">
          Primary <Odometer value={step >= 1 ? 2 : 3} className="text-[11px]" />
        </span>
        <span className="flex items-center justify-center gap-1.5 py-1 text-ink-soft">
          Promotions <Odometer value={step >= 1 ? 4 : 3} className="text-[11px]" />
        </span>
      </div>
      <ul className="relative mt-2">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((m) => (
            <motion.li
              key={m.id}
              layout={still ? false : "position"}
              exit={still ? { opacity: 0 } : { opacity: 0, x: 60, y: -28, transition: { duration: 0.48 * pace, ease: [0.65, 0, 0.35, 1] } }}
              transition={{ duration: 0.4 * (pace || 1), ease: out }}
              className="border-b border-line py-1.5"
            >
              <p className="truncate text-[12.5px] font-semibold">{m.from}</p>
              <p className="truncate text-[11.5px] text-ink-soft">{m.subject}</p>
              {/* Its own line: the promo has left by now, so there is room, and the name keeps its width. */}
              {m.id === "nikhil" && step >= 2 && (
                <motion.p
                  initial={still ? { opacity: 0, x: 0 } : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: still ? 0.15 : 0.3 * pace, ease: out }}
                  className="mono mt-0.5 flex items-center gap-1 text-[11px] tracking-[0.02em] text-ink-soft uppercase"
                >
                  <CornerUpLeft size={11} aria-hidden /> Replied in thread
                </motion.p>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {/* The two people join Contacts; the newsletter never does. */}
      <div className="mt-auto flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[12px]">
        <span className="mono text-[11px] tracking-[0.03em] text-ink-soft uppercase">Contacts</span>
        <AnimatePresence initial={false}>
          {step >= 3 &&
            ["Nikhil Mehta", "Ana Ruiz"].map((n, i) => (
              <motion.span
                key={n}
                {...pop}
                transition={still ? { duration: 0.15 } : { ...pop.transition, delay: i * 0.08 * pace }}
                className="rounded-sm px-1.5 py-px shadow-[inset_0_0_0_1px_var(--k-line-strong)]"
              >
                + {n}
              </motion.span>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
