import {
  channelFilters,
  labelById,
  initialThreads,
  SCRIPT_REPLY,
  type ChannelFilter,
  type LabelId,
  type Status,
  type TeamId,
  type Thread,
} from "./data";

export type View = "all" | "comments" | "attention" | "unassigned" | "mine" | "primary" | "promotions" | `label:${LabelId}`;

export type InboxState = {
  threads: Thread[];
  channel: ChannelFilter;
  view: View;
  selected: string;
  /** Scripted beats: the row being worked on, and whose assignee menu is open. */
  highlight: string | null;
  menuFor: string | null;
  lifting: string | null;
  /** Monotonic activity clock: a reply or a new message moves its thread to the top. */
  clock: number;
};

export type Action =
  | { type: "channel"; channel: ChannelFilter }
  | { type: "view"; view: View }
  | { type: "select"; id: string }
  | { type: "highlight"; id: string | null }
  | { type: "menu"; id: string | null }
  | { type: "lift"; id: string | null }
  | { type: "assign"; id: string; to: TeamId | null }
  | { type: "reply"; id: string; msgId: string; by: TeamId; text: string; status: Status }
  | { type: "status"; id: string; msgId: string; status: Status }
  | { type: "done"; id: string; by: TeamId }
  | { type: "stopBot"; id: string }
  | { type: "resumeBot"; id: string }
  | { type: "nudge"; id: string }
  | { type: "tab"; id: string; tab: "primary" | "promotions" }
  | { type: "scriptEnd" };

export const initialState: InboxState = {
  threads: initialThreads,
  channel: "all",
  view: "all",
  selected: "mira",
  highlight: null,
  menuFor: null,
  lifting: null,
  clock: 0,
};

const patch = (s: InboxState, id: string, fn: (t: Thread) => Thread): InboxState => ({
  ...s,
  threads: s.threads.map((t) => (t.id === id ? fn(t) : t)),
});

export function reducer(s: InboxState, a: Action): InboxState {
  switch (a.type) {
    case "channel":
      return { ...s, channel: a.channel };
    case "view":
      return { ...s, view: a.view };
    case "select":
      return { ...s, selected: a.id };
    case "highlight":
      return { ...s, highlight: a.id };
    case "menu":
      return { ...s, menuFor: a.id };
    case "lift":
      return { ...s, lifting: a.id };
    case "assign":
      return patch(s, a.id, (t) => ({ ...t, assignee: a.to }));
    case "reply":
      return patch({ ...s, clock: s.clock + 1 }, a.id, (t) => ({
        ...t,
        ts: -(s.clock + 1),
        preview: `You: ${a.text}`,
        previewPhoto: undefined,
        messages: [...t.messages, { id: a.msgId, kind: "team", by: a.by, text: a.text, status: a.status }],
      }));
    case "status":
      return patch(s, a.id, (t) => ({
        ...t,
        messages: t.messages.map((m) => (m.id === a.msgId && (m.kind === "team" || m.kind === "agent") ? { ...m, status: a.status } : m)),
      }));
    case "done":
      return patch(s, a.id, (t) =>
        t.attention
          ? {
              ...t,
              attention: false,
              waiting: false,
              messages: [...t.messages, { id: `${t.id}-done-${t.messages.length}`, kind: "event", tone: "neutral", text: "Marked done by Asha" }],
            }
          : t,
      );
    case "stopBot":
      // Stopping the bot hands the thread to a person, which also raises Needs attention.
      return patch(s, a.id, (t) =>
        t.bot === "on"
          ? {
              ...t,
              bot: "human",
              attention: true,
              messages: [...t.messages, { id: `${t.id}-stop-${t.messages.length}`, kind: "event", tone: "neutral", text: "Bot stopped for this thread by Asha" }],
            }
          : t,
      );
    case "resumeBot":
      return patch(s, a.id, (t) =>
        t.bot === "human"
          ? {
              ...t,
              bot: "on",
              waiting: false,
              messages: [...t.messages, { id: `${t.id}-resume-${t.messages.length}`, kind: "event", tone: "neutral", text: "Bot resumed. Miss counters reset." }],
            }
          : t,
      );
    case "nudge":
      // A customer writes on a human-owned thread: the bot stays silent and the thread is flagged.
      return patch({ ...s, clock: s.clock + 1 }, a.id, (t) =>
        t.bot === "human" && !t.nudged
          ? {
              ...t,
              ts: -(s.clock + 1),
              nudged: true,
              waiting: true,
              attention: true,
              preview: "any update?",
              previewPhoto: undefined,
              messages: [...t.messages, { id: `${t.id}-nudge`, kind: "in", text: "any update?" }],
            }
          : t,
      );
    case "tab":
      return patch(s, a.id, (t) => ({ ...t, tab: a.tab }));
    case "scriptEnd":
      return scriptEnd(s);
  }
}

/** The finished state of the §06 entry script, used for reduced motion and as the script's last word. */
export function scriptEnd(s: InboxState): InboxState {
  const ms = s.threads.find((t) => t.id === "ms");
  let next = s;
  if (ms && !ms.assignee) next = reducer(next, { type: "assign", id: "ms", to: "A" });
  if (ms && !ms.messages.some((m) => m.id === "ms-script")) {
    next = reducer(next, { type: "reply", id: "ms", msgId: "ms-script", by: "A", text: SCRIPT_REPLY, status: "Sent" });
  } else {
    next = reducer(next, { type: "status", id: "ms", msgId: "ms-script", status: "Sent" });
  }
  next = reducer(next, { type: "done", id: "ms", by: "A" });
  next = reducer(next, { type: "tab", id: "promo", tab: "promotions" });
  return { ...next, highlight: null, menuFor: null, lifting: null };
}

export function matchesView(t: Thread, view: View) {
  if (view === "promotions") return t.tab === "promotions";
  if (t.tab === "promotions") return false;
  switch (view) {
    case "all":
      return true;
    case "comments":
      return t.kind === "comment";
    case "attention":
      return t.attention;
    case "unassigned":
      return !t.assignee;
    case "mine":
      return t.assignee === "A";
    case "primary":
      return t.platform === "gmail" && t.tab === "primary";
    default:
      return t.label === view.slice(6);
  }
}

export function visibleThreads(s: InboxState): Thread[] {
  const platforms = channelFilters.find((c) => c.id === s.channel)?.platforms ?? [];
  return s.threads
    .filter((t) => matchesView(t, s.view))
    .filter((t) => s.channel === "all" || platforms.includes(t.platform))
    .sort((a, b) => a.ts - b.ts);
}

export function counts(s: InboxState) {
  const live = s.threads.filter((t) => t.tab !== "promotions");
  return {
    attention: live.filter((t) => t.attention).length,
    unassigned: live.filter((t) => !t.assignee).length,
    mine: live.filter((t) => t.assignee === "A").length,
    bellIg: live.filter((t) => t.attention && t.platform === "instagram").length,
    bellMs: live.filter((t) => t.attention && t.platform === "messenger").length,
    primary: s.threads.filter((t) => t.platform === "gmail" && t.tab === "primary").length,
    promotions: s.threads.filter((t) => t.tab === "promotions").length,
  };
}

export const viewTitle = (v: View) => {
  switch (v) {
    case "all":
      return "All chats";
    case "comments":
      return "Comments";
    case "attention":
      return "Needs attention";
    case "unassigned":
      return "Unassigned";
    case "mine":
      return "Assigned to me";
    case "primary":
      return "Gmail · Primary";
    case "promotions":
      return "Gmail · Promotions";
    default:
      return `Label · ${labelById[v.slice(6) as LabelId]?.name ?? v.slice(6)}`;
  }
};
