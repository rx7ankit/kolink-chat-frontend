"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { RotateCcw, SendHorizontal } from "lucide-react";

import { Glyph } from "@/components/transit/glyph";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/lib/studio/store";

import { Bubble, HandoffBanner, MarginNote, TypingDots } from "./bubbles";
import { demoKnowledge, playgroundSuggestions } from "./data";
import { answer, type Reply } from "./matcher";
import { ProductCard } from "./media-bits";

type MsgInput = { from: "customer"; text: string } | { from: "agent"; reply: Reply } | { from: "system"; text: string };
type Msg = MsgInput & { id: number };

const WAITING = "Customer is waiting while this thread is human-owned.";

/** The playground opens on one finished exchange, so it never starts as a blank box. */
const OPENER = "show me your products";
const openerReply = answer(OPENER);
const firstMsgs: Msg[] = openerReply
  ? [
      { id: 0, from: "customer", text: OPENER },
      { id: 1, from: "agent", reply: openerReply },
    ]
  : [];

/**
 * "Try a customer question": the agent pipeline in miniature, running on a demo
 * library in the browser. After a handoff the thread is human-owned and the bot
 * stays silent until you resume it, as it does in the real inbox.
 */
export function Playground({ className }: { className?: string }) {
  const { still, pace } = useMotionPrefs();
  const headingId = useId();
  const inputId = useId();
  const [msgs, setMsgs] = useState<Msg[]>(firstMsgs);
  const [typing, setTyping] = useState(false);
  const [human, setHuman] = useState(false);
  const [value, setValue] = useState("");
  const nextId = useRef(firstMsgs.length);
  const humanRef = useRef(false);
  const pending = useRef<{ timer: number; reply: Reply } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const push = (m: MsgInput) => {
    const id = nextId.current++;
    setMsgs((list) => [...list, { ...m, id }].slice(-14));
  };

  const deliver = (reply: Reply) => {
    pending.current = null;
    setTyping(false);
    push({ from: "agent", reply });
    if (reply.handoff) {
      humanRef.current = true;
      setHuman(true);
    }
  };

  const flush = () => {
    const p = pending.current;
    if (!p) return;
    window.clearTimeout(p.timer);
    deliver(p.reply);
  };

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    // A new question interrupts the typing indicator: the pending reply lands first.
    flush();
    push({ from: "customer", text });
    if (humanRef.current) {
      push({ from: "system", text: WAITING });
      return;
    }
    const reply = answer(text);
    if (!reply) return;
    if (still) {
      deliver(reply);
      return;
    }
    setTyping(true);
    pending.current = { reply, timer: window.setTimeout(() => deliver(reply), 400 * pace) };
  };

  const resume = () => {
    flush();
    humanRef.current = false;
    setHuman(false);
    push({ from: "system", text: "Bot resumed for this thread. Miss counter reset." });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ask(value);
    setValue("");
  };

  useEffect(() => {
    const p = pending;
    return () => {
      if (p.current) window.clearTimeout(p.current.timer);
    };
  }, []);

  // Keep the newest message in view inside the transcript (its own scroller). The
  // opener is already in place on load, so only scroll once the visitor adds to it.
  const touched = typing || msgs[msgs.length - 1]?.id !== firstMsgs[firstMsgs.length - 1]?.id;
  useEffect(() => {
    const el = listRef.current;
    if (!el || !touched) return;
    el.scrollTo({ top: el.scrollHeight, behavior: still ? "auto" : "smooth" });
  }, [msgs.length, typing, still, touched]);

  return (
    <section aria-labelledby={headingId} id="agent-playground" className={cn("scroll-mt-28", className)}>
      <div className="k-card overflow-hidden" style={{ "--k-tilt": "0deg" } as CSSProperties}>
        <header className="border-b border-line px-4 py-4 md:px-5">
          {/* Wraps the pill under the title on narrow phones instead of squeezing the title. */}
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
              <p className="eyebrow">Playground</p>
              <h3 id={headingId} className="mt-2 text-[20px] leading-tight font-semibold tracking-[-0.01em]">
                Try a customer question
              </h3>
              {/* The demo library it answers from, in one line. */}
              <p className="mono mt-1.5 text-[11px] text-ink-soft">Knows: {demoKnowledge.join(" · ")}</p>
            </div>
            <span
              className={cn(
                "mono flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] tracking-[0.06em] uppercase shadow-[inset_0_0_0_1px_var(--k-line-strong)]",
                human && "bg-pop-1/25",
              )}
            >
              <Glyph handler={human ? "team" : "agent"} size={9} />
              {human ? "Human" : "Agentic"}
            </span>
          </div>
        </header>

        <div
          ref={listRef}
          data-lenis-prevent
          className="h-[400px] overflow-y-auto overscroll-contain px-4 py-4 md:h-[436px] md:px-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Playground conversation"
        >
          <div className="flex flex-col gap-3">
            {msgs.map((m) => {
              // The opener renders finished; only what the visitor asks plays in.
              const play = !still && m.id >= firstMsgs.length;
              if (m.from === "customer") {
                return <Bubble key={m.id} beat={{ kind: "msg", from: "customer", lines: [m.text] }} play={play} />;
              }
              if (m.from === "system") {
                return (
                  <p key={m.id} className="mono self-center text-center text-[11px] leading-snug text-ink-soft">
                    {m.text}
                  </p>
                );
              }
              const r = m.reply;
              return (
                <div key={m.id} className="flex min-w-0 flex-col gap-2">
                  <Bubble
                    beat={{ kind: "msg", from: "agent", lines: r.lines, carousel: r.carousel, quick: r.carousel ? ["Next"] : undefined }}
                    play={play}
                  />
                  {r.item && <ProductCard item={r.item} className="w-[150px]" sizes="150px" />}
                  {r.note && <MarginNote text={r.note} className="pl-1" />}
                  {r.handoff && <HandoffBanner handoff={r.handoff} play={play} />}
                </div>
              );
            })}
            {typing && <TypingDots />}
          </div>
        </div>

        <div className="border-t border-line px-4 pt-3 pb-4 md:px-5">
          {/* Phones: one swipeable row of quick asks instead of four stacked pills. */}
          <ul
            className="flex gap-2 max-sm:-mx-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:[scrollbar-width:none] sm:flex-wrap"
            aria-label="Suggested questions"
          >
            {playgroundSuggestions.map((q) => (
              <li key={q} className="shrink-0">
                <button
                  type="button"
                  onClick={() => ask(q)}
                  className="inline-flex h-11 items-center rounded-full px-3.5 text-[13px] text-ink shadow-[inset_0_0_0_1px_var(--k-line-strong)] transition-colors hover:bg-bg-alt md:pointer-fine:h-9"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">
              Your question
            </label>
            <input
              id={inputId}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask like a customer would…"
              autoComplete="off"
              enterKeyHint="send"
              maxLength={160}
              className="h-11 min-w-0 flex-1 rounded-lg bg-surface px-3.5 text-[15px] text-ink shadow-[inset_0_0_0_1px_var(--k-line-strong)] placeholder:text-ink-soft focus-visible:outline-offset-1"
            />
            <button type="submit" className="k-btn k-btn-accent h-11 shrink-0 px-4 text-[14px]">
              <SendHorizontal className="size-4" aria-hidden />
              <span className="max-sm:sr-only">Send</span>
            </button>
          </form>
          {human && (
            <button
              type="button"
              onClick={resume}
              className="k-btn k-btn-ghost mt-3 h-11 px-3.5 text-[13px] md:pointer-fine:h-9"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Resume bot
            </button>
          )}
        </div>
      </div>
      <p className="mono mt-3 text-[11px] leading-relaxed text-ink-soft">Runs in your browser. Nothing is sent.</p>
    </section>
  );
}
