"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { motion, MotionConfig, useInView, type Variants } from "motion/react";

import { Roundel } from "@/components/transit/roundel";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";
import { useLook } from "@/lib/studio/store";

import { useMediaQuery, useSafeMotionPrefs } from "../inbox/hooks";
import { CampaignVignette, ContactsVignette, GmailVignette, LabelsVignette, RolesVignette, TemplateVignette } from "./vignettes";

type TicketSpec = {
  title: string;
  /** One line, twelve words at most: the vignette below shows the rest. */
  body: string;
  platforms?: PlatformId[];
  vignette: (play: boolean) => ReactNode;
};

const tickets: TicketSpec[] = [
  {
    title: "DM campaigns",
    // A non-breaking hyphen: "24-hour" never splits across lines.
    body: "Send now or schedule. Only people inside the 24\u2011hour window receive it.",
    platforms: ["instagram", "messenger"],
    vignette: (play) => <CampaignVignette play={play} />,
  },
  {
    title: "WhatsApp templates",
    body: "Build, preview and submit templates for Meta’s approval. Sending isn’t supported yet.",
    platforms: ["whatsapp"],
    vignette: (play) => <TemplateVignette play={play} />,
  },
  {
    title: "Labels & assignment",
    body: "Ten label colors, one assignee per thread, close and reopen.",
    vignette: (play) => <LabelsVignette play={play} />,
  },
  {
    title: "Team roles",
    body: "Five roles. Owners and Admins manage the team.",
    vignette: (play) => <RolesVignette play={play} />,
  },
  {
    title: "Contacts",
    body: "Everyone you talk to, with their channels, tags and notes.",
    platforms: ["instagram"],
    vignette: (play) => <ContactsVignette play={play} />,
  },
  {
    title: "Gmail, tidied",
    body: "Promotions sorted out of Primary. Only real people become contacts.",
    platforms: ["gmail"],
    vignette: (play) => <GmailVignette play={play} />,
  },
];

/** Deterministic sticker tilts (degrees): no Math.random, so server and client agree. */
const TILTS = [-2.2, 1.6, -1.1, 2.4, -2.7, 1.2];

function Ticket({ spec, index, sheetRef }: { spec: TicketSpec; index: number; sheetRef: RefObject<HTMLUListElement | null> }) {
  const look = useLook();
  const { still, pace } = useSafeMotionPrefs();
  const fine = useMediaQuery("(pointer: fine)");
  const ref = useRef<HTMLLIElement>(null);
  const play = useInView(ref, { once: true, amount: 0.45 });
  const [settled, setSettled] = useState(false);
  const sticker = look.card === "sticker";
  const tilt = TILTS[index % TILTS.length];

  // Roundels bloom while the vignette is "carrying traffic", then settle back to ink.
  useEffect(() => {
    if (!play) return;
    const id = window.setTimeout(() => setSettled(true), 2600 * (pace || 1));
    return () => window.clearTimeout(id);
  }, [play, pace]);

  // Every state names every key any entrance uses (y, scale, rotate, opacity). The Studio look
  // (and the hydration-safe motion prefs) settle after the first mount, so a card can mount with
  // one style's hidden state and finish with another's shown state; a key left out would stay
  // stuck, e.g. a hairline card parked at y 104% behind its mask once Still kicks in.
  // Sticker y is in px (hover lifts by -3px); the mask rise is in %. A card-style switch remounts.
  const rest = { opacity: 1, y: sticker ? 0 : "0%", scale: 1, rotate: sticker ? tilt : 0 };
  const delay = index * 0.07 * pace;
  const variants: Variants = still
    ? {
        hidden: { ...rest, opacity: 0 },
        shown: { ...rest, transition: { duration: 0.15, y: { duration: 0 }, scale: { duration: 0 }, rotate: { duration: 0 } } },
      }
    : sticker
      ? {
          hidden: { opacity: 0, y: 0, scale: 0.9, rotate: tilt + (index % 2 ? 12 : -12) },
          shown: {
            ...rest,
            transition: {
              type: "spring",
              stiffness: 420,
              damping: 18,
              delay,
              opacity: { duration: 0.2 * pace, delay },
            },
          },
        }
      : {
          hidden: { opacity: 1, y: "104%", scale: 1, rotate: 0 },
          shown: { ...rest, transition: { duration: 0.8 * pace, delay, ease: [0.22, 1, 0.36, 1] } },
        };

  const draggable = sticker && fine && !still;

  return (
    <motion.li
      ref={ref}
      // Each ticket spans two rows of the sheet's grid (head, stub) and passes them down as a
      // subgrid, so tear lines line up along a row at every width, whatever wraps where. The
      // sheet has no row gap (it would open between head and stub); margins space the rows.
      className={cn(
        "relative row-span-2 grid min-w-0 grid-rows-subgrid gap-y-0",
        sticker ? "mb-6 lg:mb-7" : "-mx-2 -mt-2 mb-4 overflow-hidden p-2 lg:mb-5",
      )}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.article
        variants={variants}
        drag={draggable}
        dragConstraints={sheetRef}
        dragElastic={0.2}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 420, bounceDamping: 26 }}
        whileDrag={draggable ? { scale: 1.03, rotate: tilt * 0.4 } : undefined}
        whileHover={draggable ? { y: -3, rotate: tilt * 0.6 } : undefined}
        className={cn("k-card row-span-2 grid grid-rows-subgrid gap-y-0 p-5 sm:p-6", draggable && "cursor-grab active:cursor-grabbing")}
        style={{ "--k-tilt": `${tilt}deg` } as CSSProperties}
      >
        <div>
          <div className="flex h-6 items-center justify-between gap-3">
            <span className="mono text-[11px] tracking-[0.08em] text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
            {spec.platforms && (
              <span className="flex gap-1">
                {spec.platforms.map((p) => (
                  <Roundel key={p} platform={p} size={22} active={play && !settled && !still} />
                ))}
              </span>
            )}
          </div>
          <h3 className="font-display mt-4 text-[22px] leading-[1.1] sm:text-[24px]">{spec.title}</h3>
          <p className="mt-2.5 text-[14.5px] leading-[1.6] text-ink-soft">{spec.body}</p>
        </div>

        <div className="flex flex-col pt-6">
          {/* Perforation: the tear line between the ticket and its stub. */}
          <div className="relative -mx-5 border-t-[1.5px] border-dashed border-line-strong sm:-mx-6" aria-hidden>
            <span className="absolute -top-[7px] -left-[7px] size-3.5 rounded-full bg-bg shadow-[inset_0_0_0_1px_var(--k-line)] [clip-path:inset(0_0_0_50%)]" />
            <span className="absolute -top-[7px] -right-[7px] size-3.5 rounded-full bg-bg shadow-[inset_0_0_0_1px_var(--k-line)] [clip-path:inset(0_50%_0_0)]" />
          </div>
          {/* Fills the row's stub track: shorter vignettes keep their footer at the bottom. */}
          <div className="mt-5 flex flex-1 flex-col" aria-hidden>
            {spec.vignette(play)}
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

/**
 * The ticket sheet: six .k-card tickets on the grid, each with a tiny working vignette
 * that plays once in view. Sticker mode tilts them deterministically and lets a fine
 * pointer drag them around the sheet; they spring back on release.
 */
export function TicketSheet() {
  const sheetRef = useRef<HTMLUListElement>(null);
  const { card } = useLook();
  return (
    // OS reduced motion: rises and peels become fades from the very first frame.
    <MotionConfig reducedMotion="user">
      <ul ref={sheetRef} className="mt-14 grid gap-x-6 gap-y-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-7">
        {tickets.map((t, i) => (
          // Remount on a card-style switch so the new style's entrance (mask rise or peel) plays.
          <Ticket key={`${t.title}-${card}`} spec={t} index={i} sheetRef={sheetRef} />
        ))}
      </ul>
    </MotionConfig>
  );
}
