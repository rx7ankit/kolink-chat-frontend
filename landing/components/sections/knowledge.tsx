"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { useStillLayout } from "@/components/sections/agent/hydrated";
import { ChatStepItem } from "@/components/sections/knowledge/chat-step";
import { chatSteps, type KnowledgeCard } from "@/components/sections/knowledge/data";
import { SourceDock } from "@/components/sections/knowledge/dock";
import { CardBody, ChannelRow, Library } from "@/components/sections/knowledge/library";
import { TravelLayer, type TravelSpec } from "@/components/sections/knowledge/travel";
import { Section, SectionHeader } from "@/components/ui/section";
import { useLook, useMotionPrefs } from "@/lib/studio/store";

const copy = {
  eyebrow: "§03 · KNOWLEDGE LIBRARY",
  lines: ["Teach it in a chat.", "*Seven questions.*"],
  body: ["Setup is a short guided chat.", "Each answer becomes knowledge the agent replies from."],
};

const cards = chatSteps.map((s) => s.card).filter((c): c is KnowledgeCard => c !== null);
/** Step index → card index (or -1 for the platform step). */
const cardIndexOf = chatSteps.map((s) => (s.card ? cards.indexOf(s.card) : -1));
const LAST = chatSteps.length - 1;

const setAt = (list: boolean[], i: number) => (list[i] ? list : list.map((v, j) => (j === i ? true : v)));

/**
 * §03. The onboarding chat scrolls; the library column is sticky. Each answer,
 * once in view, rises through its mask and sends its card along a short
 * connector to a library berth. Phones file the card under its answer instead.
 */
export function Knowledge() {
  const still = useStillLayout();
  const { pace } = useMotionPrefs();
  const { lines } = useLook();

  const [answered, setAnswered] = useState<boolean[]>(() => chatSteps.map(() => false));
  const [landed, setLanded] = useState<boolean[]>(() => cards.map(() => false));
  const [switched, setSwitched] = useState(false);
  const [travels, setTravels] = useState<TravelSpec[]>([]);

  const gridRef = useRef<HTMLDivElement>(null);
  const bubbles = useRef<(HTMLDivElement | null)[]>([]);
  const slots = useRef<(HTMLLIElement | null)[]>([]);
  const stickyRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const travelId = useRef(0);
  const filed = useRef(new Set<number>());

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const onView = useCallback(
    (i: number) => {
      // A fast scroll (or a jump link) can skip a question without it ever being in
      // view. File everything above it at once, so the library never shows a hole.
      for (let j = 0; j < i; j++) {
        if (filed.current.has(j)) continue;
        filed.current.add(j);
        setAnswered((a) => setAt(a, j));
        const skipped = cardIndexOf[j];
        if (skipped < 0) setSwitched(true);
        else setLanded((l) => setAt(l, skipped));
      }
      setAnswered((a) => setAt(a, i));
      if (filed.current.has(i)) return;
      filed.current.add(i);
      const card = cardIndexOf[i];
      if (still) {
        // End states only, but file it for real so leaving Still later doesn't empty the library.
        if (card < 0) setSwitched(true);
        else setLanded((l) => setAt(l, card));
        return;
      }
      // Wait for the answer to rise, then file it.
      const id = window.setTimeout(() => {
        if (card < 0) {
          setSwitched(true);
          return;
        }
        const grid = gridRef.current;
        const bubble = bubbles.current[i];
        const slot = slots.current[card];
        const lib = stickyRef.current;
        const box = lib?.parentElement;
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        if (!desktop || !grid || !bubble || !slot || !lib || !box) {
          setLanded((l) => setAt(l, card));
          return;
        }
        // Measure once. Afterwards the slot's position is derived from scrollY alone.
        const g = grid.getBoundingClientRect();
        const b = bubble.getBoundingClientRect();
        const s = slot.getBoundingClientRect();
        const bx = box.getBoundingClientRect();
        const lh = lib.getBoundingClientRect().height;
        const inset = parseFloat(getComputedStyle(lib).top) || 0;
        const scroll0 = window.scrollY;
        // Viewport top of the sticky library after scrolling `dy` px: rides with the page,
        // holds at its inset, then leaves with the bottom of its column.
        const libTop = (dy: number) => Math.min(Math.max(bx.top - dy, inset), bx.bottom - dy - lh);
        const base = libTop(0);
        const slotDy = (sy: number) => {
          const dy = sy - scroll0;
          return dy + libTop(dy) - base;
        };
        const from = { x: b.right - g.left + 8, y: b.top + b.height / 2 - g.top };
        const to = { x: s.left - g.left + 18, y: s.top + s.height / 2 - g.top };
        setTravels((list) => [...list, { id: travelId.current++, card, from, to, style: lines, slotDy }]);
      }, 480 * pace);
      timers.current.push(id);
    },
    [still, pace, lines],
  );

  const onArrive = useCallback((card: number) => setLanded((l) => setAt(l, card)), []);
  const onDone = useCallback((id: number) => setTravels((list) => list.filter((t) => t.id !== id)), []);

  const isAnswered = (i: number) => still || answered[i];
  const isLanded = (c: number) => still || landed[c];
  const isSwitched = still || switched;
  const done = isAnswered(LAST);

  return (
    <Section id="knowledge">
      {/* The library card carries the demo label ("Northwind Studio (demo)"), so no footnote here. */}
      <SectionHeader
        eyebrow={copy.eyebrow}
        lines={copy.lines}
        body={
          <p>
            {/* One sentence per line from tablet up; phones wrap naturally. */}
            {copy.body[0]}
            <br className="max-sm:hidden" /> {copy.body[1]}
          </p>
        }
      />

      <div ref={gridRef} className="relative mt-14 md:mt-20 lg:grid lg:grid-cols-12 lg:gap-x-6">
        {/* Left: the onboarding chat */}
        <div className="min-w-0 lg:col-span-6">
          <p className="eyebrow mb-8">Guided setup · no AI</p>
          <ol>
            {chatSteps.map((step, i) => {
              const card = cardIndexOf[i];
              return (
                <ChatStepItem
                  key={step.prompt}
                  step={step}
                  index={i}
                  total={chatSteps.length}
                  answered={isAnswered(i)}
                  onView={onView}
                  bubbleRef={(el) => {
                    bubbles.current[i] = el;
                  }}
                  below={
                    card >= 0 ? (
                      <InlineCard card={cards[card]} index={card} shown={isAnswered(i)} />
                    ) : (
                      <InlineChannels switched={isSwitched} shown={isAnswered(i)} />
                    )
                  }
                />
              );
            })}
          </ol>
          <DoneLine shown={done} />
        </div>

        {/* Right: the library (sticky) and, under it, the ways in */}
        <div className="mt-16 flex min-w-0 flex-col lg:col-span-5 lg:col-start-8 lg:mt-0">
          <div className="hidden flex-1 lg:block">
            <div ref={stickyRef} className="sticky top-24">
              <Library
                cards={cards}
                landed={cards.map((_, c) => isLanded(c))}
                switched={isSwitched}
                slotRef={(c) => (el) => {
                  slots.current[c] = el;
                }}
              />
            </div>
          </div>
          <SourceDock className="lg:mt-12" />
        </div>

        <TravelLayer travels={travels} onArrive={onArrive} onDone={onDone} />
      </div>
    </Section>
  );
}

/** Phones: the filed card appears right under its answer. */
function InlineCard({ card, index, shown }: { card: KnowledgeCard; index: number; shown: boolean }) {
  const { still, pace } = useMotionPrefs();
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={still ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 34, delay: 0.5 * pace }}
      aria-hidden={!shown}
    >
      <div
        className="k-card flex items-center px-3.5 py-3"
        style={{ "--k-tilt": index % 2 ? "0.6deg" : "-0.6deg" } as CSSProperties}
      >
        <p className="sr-only">Filed as knowledge:</p>
        <CardBody card={card} index={index} active={shown} stacked statusDelay={1100} />
      </div>
    </motion.div>
  );
}

function InlineChannels({ switched, shown }: { switched: boolean; shown: boolean }) {
  const { still, pace } = useMotionPrefs();
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={still ? { duration: 0.15 } : { duration: 0.4 * pace, delay: 0.3 * pace, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="k-card flex flex-col gap-2.5 p-3.5" style={{ "--k-tilt": "0deg" } as CSSProperties}>
        <p className="eyebrow">Where it answers</p>
        <ChannelRow platform="instagram" name="Instagram DMs" mode={switched ? "agentic" : "off"} />
        <ChannelRow platform="messenger" name="Messenger DMs" mode={switched ? "menu" : "off"} />
      </div>
    </motion.div>
  );
}

function DoneLine({ shown }: { shown: boolean }) {
  const { still, pace } = useMotionPrefs();
  return (
    <motion.p
      className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-6 text-[17px] font-medium text-ink md:ml-[60px]"
      initial={false}
      animate={{ opacity: shown ? 1 : 0.35 }}
      transition={{ duration: still ? 0.15 : 0.5 * pace, delay: still ? 0 : 0.8 * pace }}
    >
      Your agent is ready.
      <a
        href="#agent-playground"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent-text underline decoration-[1.5px] underline-offset-4 hover:decoration-[2.5px]"
      >
        Try a customer question.
        <ArrowRight className="size-4" aria-hidden />
      </a>
    </motion.p>
  );
}
