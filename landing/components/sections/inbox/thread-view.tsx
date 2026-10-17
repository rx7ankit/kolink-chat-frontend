"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, UserRound, X as Close } from "lucide-react";

import { Photo } from "@/components/media/photo";
import { Glyph } from "@/components/transit/glyph";
import { Roundel } from "@/components/transit/roundel";
import { cn } from "@/lib/cn";
import { useSafeMotionPrefs } from "./hooks";

import { Avatar } from "./badge";
import { channelName, kindLabel, team, teamName, tint, type Msg, type TeamId, type Thread } from "./data";

const out = [0.22, 1, 0.36, 1] as const;

function StatusText({ status }: { status: string }) {
  return <span className={cn(status === "Not sent" && "text-ink font-semibold")}>{status}</span>;
}

function Message({ m }: { m: Msg }) {
  const { still, pace } = useSafeMotionPrefs();
  const enter = {
    initial: still ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: still ? 0.15 : 0.32 * pace, ease: out },
  };

  if (m.kind === "in") {
    return (
      <motion.li {...enter} className="flex max-w-[86%] flex-col items-start gap-1">
        {m.photo && (
          <figure className="relative aspect-square w-[min(128px,100%)] overflow-hidden rounded-[16px] bg-bg-alt">
            <Photo id={m.photo} sizes="128px" />
            {/* The hairline sits above the photo so light images keep their edge. */}
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--k-ink)_10%,transparent)]" />
            <figcaption className="sr-only">Shared a photo</figcaption>
          </figure>
        )}
        {m.text && (
          <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] leading-[1.45] text-ink">
            {m.subject && <p className="mb-1 font-semibold">{m.subject}</p>}
            {m.text}
          </div>
        )}
      </motion.li>
    );
  }
  if (m.kind === "agent" || m.kind === "team") {
    const agent = m.kind === "agent";
    return (
      <motion.li {...enter} className="ml-auto flex max-w-[86%] flex-col items-end">
        <div
          className="rounded-lg px-3 py-2 text-[13.5px] leading-[1.45] text-ink"
          style={{ background: agent ? tint("var(--k-pop2)", 22) : "var(--k-bg-alt)" }}
        >
          {m.text}
        </div>
        <p className="mono mt-1 flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-ink-soft uppercase">
          {agent ? <Glyph handler="agent" size={9} /> : <Avatar id={m.by} size={14} />}
          <span>{agent ? "Agent" : teamName(m.by)}</span>
          <span aria-hidden>·</span>
          <StatusText status={m.status} />
        </p>
        {agent && m.note && (
          <p className="mono mt-1 border-l border-dashed border-line-strong pl-2 text-[11px] text-ink-soft">
            <span aria-hidden>↳ </span>
            {m.note}
            <span className="sr-only"> (page note; customers don’t see it)</span>
          </p>
        )}
      </motion.li>
    );
  }
  if (m.kind === "handoff") {
    return (
      <motion.li
        {...enter}
        className="rounded-md border-l-[3px] border-pop-1-deep px-3 py-2.5 text-[12.5px] text-ink"
        style={{ background: tint("var(--k-pop1)", 22) }}
      >
        <p className="flex items-center gap-1.5 font-semibold">
          <Glyph handler="attention" size={11} />
          Handed to your team
        </p>
        <dl className="mono mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-[1.5]">
          <dt className="text-ink-soft">Asked:</dt>
          <dd>{m.asked}</dd>
          <dt className="text-ink-soft">Why:</dt>
          <dd>{m.why}</dd>
        </dl>
      </motion.li>
    );
  }
  return (
    <motion.li {...enter} className="mono flex items-center gap-2 py-0.5 text-[11px] tracking-[0.02em] text-ink-soft">
      <span aria-hidden className="h-px flex-1 bg-line" />
      {m.tone === "attention" && <Glyph handler="attention" size={9} />}
      <span className="max-w-[80%] text-center">{m.text}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </motion.li>
  );
}

export function ContactSheet({ thread, className }: { thread: Thread; className?: string }) {
  const c = thread.contact;
  if (!c.person) {
    return (
      <div className={cn("text-[12.5px] leading-[1.55]", className)}>
        <p className="eyebrow text-[11px]">Contact</p>
        <p className="mt-3 font-semibold">{thread.name}</p>
        <p className="mt-2 text-ink-soft">Not a contact. Newsletters stay out of your list.</p>
      </div>
    );
  }
  // The telling few: what they want, where they are, who has them. Channel and last activity
  // are already on the row and in the thread header.
  const rows: [string, ReactNode][] = [];
  if (c.tags.length) rows.push(["Tags", c.tags.join(" · ")]);
  if (c.city) rows.push(["City", c.city]);
  rows.push([
    "Assignee",
    thread.assignee ? (
      <span className="inline-flex items-center gap-1.5">
        <Avatar id={thread.assignee} size={16} />
        {teamName(thread.assignee)}
      </span>
    ) : (
      "Unassigned"
    ),
  ]);

  return (
    // A container: in the narrow desktop column the details stack (label over value) instead
    // of squeezing values into a sliver beside long labels.
    <div className={cn("@container text-[12.5px]", className)}>
      <p className="eyebrow text-[11px]">Contact</p>
      <div className="mt-3 flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-[13px] font-semibold"
          style={{ boxShadow: "inset 0 0 0 1.5px var(--k-ink)" }}
        >
          {thread.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{thread.name}</p>
          {thread.handle && <p className="mono truncate text-[11px] text-ink-soft">{thread.handle}</p>}
        </div>
      </div>
      {c.ig && (
        <div className="mt-3.5 max-w-[340px]">
          {/* Profile card, as Instagram lays it out: the three latest posts over the counts. */}
          <div className="overflow-hidden rounded-[10px] bg-bg shadow-[inset_0_0_0_1px_var(--k-line)]">
            <ul aria-label="Latest Instagram posts" className="grid grid-cols-3 gap-[2px]">
              {c.ig.grid.map((id) => (
                <li key={id} className="aspect-[4/5] overflow-hidden bg-bg-alt">
                  <Photo id={id} sizes="(max-width: 1023px) 120px, 64px" />
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-3 px-1 pt-2 pb-2.5 text-center">
              {(
                [
                  ["posts", c.ig.posts],
                  ["followers", c.ig.followers],
                  ["following", c.ig.following],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-col">
                  <dt className="order-2 truncate text-[11px] leading-tight text-ink-soft">{k}</dt>
                  <dd className="order-1 mono text-[12.5px] leading-tight font-semibold tabular-nums">{v.toLocaleString("en-US")}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-2.5">
            <span className="rounded-full px-2 py-0.5 text-[11.5px] shadow-[inset_0_0_0_1px_var(--k-line-strong)]">
              {c.ig.followsYou ? "Follows you" : "Doesn’t follow you"}
            </span>
          </p>
        </div>
      )}
      <dl className="mt-4 grid gap-y-2.5 leading-[1.4] @[210px]:grid-cols-[auto_minmax(0,1fr)] @[210px]:gap-x-4 @[210px]:gap-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="@[210px]:contents">
            <dt className="mono text-[11px] leading-[1.6] tracking-[0.02em] text-ink-soft uppercase">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {c.note && <p className="mt-4 border-t border-line pt-3 text-ink-soft">{c.note}</p>}
    </div>
  );
}

function ControlButton({ onClick, children, primary = false }: { onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "k-btn h-11 px-3 text-[12.5px] lg:pointer-fine:h-8",
        primary ? "k-btn-accent" : "k-btn-ghost",
      )}
    >
      {children}
    </button>
  );
}

export type ThreadActions = {
  assign: (id: string, to: TeamId | null) => void;
  stopBot: (id: string) => void;
  resumeBot: (id: string) => void;
  done: (id: string) => void;
  reply: (id: string, text: string) => void;
};

/** The open thread: header with the human controls, messages, and the composer. */
export function ThreadView({
  thread,
  actions,
  variant,
  className,
  replaceLog,
}: {
  thread: Thread;
  actions: ThreadActions;
  /** "pane" is the desktop right pane; "sheet" is the mobile slide-over. */
  variant: "pane" | "sheet";
  className?: string;
  /** Shown in the conversation's place (the mobile sheet's Contact view); the composer stays. */
  replaceLog?: ReactNode;
}) {
  const inputId = useId();
  const selectId = useId();
  const popoverId = useId();
  const { still } = useSafeMotionPrefs();
  const logRef = useRef<HTMLOListElement>(null);
  const [draft, setDraft] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const count = thread.messages.length;
  const lastCount = useRef(count);
  const lastThread = useRef(thread.id);

  // A thread opens at its first message, so the story (and any shared photo) reads top-down;
  // new messages are followed smoothly, as in the app.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    if (lastThread.current !== thread.id || count < lastCount.current) {
      el.scrollTop = 0;
    } else if (count > lastCount.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: still ? "auto" : "smooth" });
    }
    lastThread.current = thread.id;
    lastCount.current = count;
  }, [count, thread.id, still]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    actions.reply(thread.id, text);
    setDraft("");
  };

  const botChannel = thread.bot !== null;
  const channel = channelName[thread.platform];

  return (
    <div
      className={cn("relative flex min-h-0 min-w-0 flex-col", className)}
      onKeyDown={(e) => {
        // Escape closes the contact popover whether focus is on its toggle or inside it.
        if (e.key === "Escape" && contactOpen) setContactOpen(false);
      }}
    >
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-start gap-3">
          <Roundel platform={thread.platform} size={30} active />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] leading-tight font-semibold">{thread.name}</h3>
            <p className="mono mt-1 truncate text-[11px] tracking-[0.02em] text-ink-soft">
              {thread.handle ? `${thread.handle} · ` : ""}
              {kindLabel(thread)}
            </p>
          </div>
          {variant === "pane" && (
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              aria-expanded={contactOpen}
              aria-controls={popoverId}
              className="k-btn k-btn-ghost h-8 px-2.5 text-[12px] xl:hidden"
            >
              <UserRound size={13} aria-hidden />
              Contact
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="sr-only">
            Assignee
          </label>
          {/* 16px on touch screens: iOS zooms the page into any smaller field on focus. */}
          <select
            id={selectId}
            value={thread.assignee ?? ""}
            onChange={(e) => actions.assign(thread.id, (e.target.value || null) as TeamId | null)}
            className="h-11 rounded-md bg-surface px-2 text-[16px] shadow-[inset_0_0_0_1.5px_var(--k-line-strong)] pointer-fine:text-[12.5px] lg:pointer-fine:h-8"
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.you ? " (you)" : ""}
              </option>
            ))}
          </select>
          {botChannel &&
            (thread.bot === "on" ? (
              <ControlButton onClick={() => actions.stopBot(thread.id)}>Stop bot for this thread</ControlButton>
            ) : (
              <ControlButton onClick={() => actions.resumeBot(thread.id)}>Resume bot</ControlButton>
            ))}
          {thread.attention && (
            <ControlButton primary onClick={() => actions.done(thread.id)}>
              Mark done
            </ControlButton>
          )}
        </div>
      </header>

      {replaceLog ? (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
          {replaceLog}
        </div>
      ) : (
        <ol
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label={`Conversation with ${thread.name}`}
          data-lenis-prevent
          // The soft bottom edge says "there is more below" instead of slicing a bubble in half;
          // the matching bottom padding keeps the last message clear of it once scrolled.
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-4 pb-7 [mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]"
        >
          {thread.messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
        </ol>
      )}

      <AnimatePresence initial={false}>
        {thread.waiting && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium text-ink"
            style={{ background: tint("var(--k-pop1)", 22) }}
          >
            <Glyph handler="attention" size={10} />
            Customer is waiting while this thread is human-owned.
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="border-t border-line px-4 pt-3 pb-3">
        <p className="mb-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-soft">
          {botChannel ? (
            thread.bot === "human" ? (
              <>
                <Glyph handler="team" size={9} className="mt-[3px]" />
                Bot is off for this contact only.
              </>
            ) : (
              <>
                <Glyph handler="agent" size={9} className="mt-[3px]" />
                The agent is answering. Stop it to take over.
              </>
            )
          ) : (
            <>
              <Glyph handler="team" size={9} className="mt-[3px]" />
              No agent on {channel}. Your team replies.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Reply to {thread.name} on {channel}
          </label>
          <input
            id={inputId}
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Reply on ${channel}…`}
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-md bg-bg px-3 text-[16px] text-ink shadow-[inset_0_0_0_1.5px_var(--k-line-strong)] placeholder:text-ink-soft pointer-fine:text-[14px]"
          />
          <button type="submit" className="k-btn k-btn-accent size-11 shrink-0" aria-label="Send reply (demo, nothing is sent)">
            <Send size={16} aria-hidden />
          </button>
        </div>
      </form>

      {variant === "pane" && contactOpen && (
        <div
          id={popoverId}
          role="group"
          aria-label={`Contact: ${thread.name}`}
          data-lenis-prevent
          className="absolute top-[64px] right-3 z-20 max-h-[calc(100%-76px)] w-[248px] overflow-y-auto overscroll-contain rounded-lg border border-line-strong bg-surface p-4 xl:hidden"
          style={{ boxShadow: "0 2px 0 0 var(--k-line)" }}
        >
          <button
            type="button"
            onClick={() => setContactOpen(false)}
            aria-label="Close contact"
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-md hover:bg-bg"
          >
            <Close size={14} aria-hidden />
          </button>
          <ContactSheet thread={thread} />
        </div>
      )}
    </div>
  );
}
