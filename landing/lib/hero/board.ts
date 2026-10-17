import { lineOrder } from "@/lib/capabilities";
import type { PlatformId } from "@/lib/platforms";

import type { PacketShape, ThreadLine } from "./types";

/** Everything the board, hub, step rail, pill and focus pane render. Pure data; one reducer. */

export type RowGlyph = PacketShape | "sorted" | null;

export type RowState = {
  /** Split-flap status: "" (idle) / PUBLISHED / IN / AUTOMATION / AGENT / INBOX / NEEDS ATTENTION / SORTED / REPLIED / OVER LIMIT */
  status: string;
  glyph: RowGlyph;
  snippet: string;
  /** Bumps whenever the snippet changes so it can reveal through its mask. */
  rev: number;
  /** Small tag after the line name, e.g. "Keyword → DM · LINK". */
  tag: string | null;
  /** Agentic → Human mode pill for hand-offs. */
  mode: string | null;
  /** Line carries traffic: roundel blooms to brand color, the route brightens. */
  active: boolean;
  /** Conversation lines turn from dashed to solid once someone writes in. */
  carried: boolean;
  /** Pencil ring: needs attention. */
  ring: boolean;
  /** Team marked it done. */
  done: boolean;
  /** Latest readable exchange for hover / pin previews. */
  thread: ThreadLine[];
  /** Native preview once the post lands on this publish line: the media, or a text-only tile (LinkedIn). */
  thumb: "media" | "text" | null;
};

export type FocusLine = ThreadLine & { id: number };

export type ComposerMode = { mode: "compose" } | { mode: "reply"; platform: PlatformId; label: string };

export type BoardState = {
  rows: Record<PlatformId, RowState>;
  step: 0 | 1 | 2 | 3;
  hub: string;
  hubTurn: number;
  switchTurn: number;
  counters: { in: number; auto: number; agent: number; team: number };
  inbox: number;
  attention: number;
  bell: string | null;
  /**
   * `scene` bumps on every focus switch. `layer` is the pane's surface: it bumps when a new scene
   * should slide in over the old one, and holds when the same surface carries on (the draft becomes
   * the published fan in place, so its media can morph instead of cutting).
   * `onPost`: the scene is a comment thread under the published post (stays true after its first line scrolls off).
   */
  focus: { title: string; platform: PlatformId | null; lines: FocusLine[]; status: string | null; scene: number; layer: number; onPost: boolean };
  ledger: string;
  chips: "idle" | "lit";
  composer: ComposerMode;
  siding: boolean;
  /** Visitor run: hint chip and keyword note. */
  hint: string | null;
  /** The caption of the post this run published (comment scenes show it above the thread). */
  post: string;
  seq: number;
};

export type Action =
  | { t: "reset" }
  | { t: "set"; patch: Partial<Pick<BoardState, "step" | "hub" | "ledger" | "chips" | "composer" | "siding" | "bell" | "hint" | "post">> }
  | { t: "row"; id: PlatformId; patch?: Partial<Omit<RowState, "snippet" | "rev">>; snippet?: string }
  | { t: "rows"; patch: Partial<Omit<RowState, "snippet" | "rev" | "thread">> }
  | { t: "count"; key: keyof BoardState["counters"]; by: number }
  | { t: "inbox"; by: number }
  | { t: "attention"; by: number }
  | { t: "hubTurn" }
  | { t: "switch" }
  /** `keep`: stay on the same pane surface (draft → published morph). */
  | { t: "focus"; title: string; platform: PlatformId | null; keep?: boolean }
  | { t: "say"; line: ThreadLine }
  | { t: "focusStatus"; status: string | null };

/** The run summary is read out once per run (aria-live); nothing is announced before the first run ends. */
export const READY_LEDGER = "";

/** Focus-pane title while a post is being written (the pane previews the draft). */
export const DRAFT_TITLE = "DRAFT · 5 NETWORKS";

function idleRow(): RowState {
  return {
    status: "",
    glyph: null,
    snippet: "",
    rev: 0,
    tag: null,
    mode: null,
    active: false,
    carried: false,
    ring: false,
    done: false,
    thread: [],
    thumb: null,
  };
}

export function initialBoard(): BoardState {
  return {
    rows: Object.fromEntries(lineOrder.map((id) => [id, idleRow()])) as Record<PlatformId, RowState>,
    step: 0,
    hub: "READY",
    hubTurn: 0,
    switchTurn: 0,
    counters: { in: 0, auto: 0, agent: 0, team: 0 },
    inbox: 0,
    attention: 0,
    bell: null,
    focus: { title: DRAFT_TITLE, platform: null, lines: [], status: null, scene: 0, layer: 0, onPost: false },
    ledger: READY_LEDGER,
    chips: "idle",
    composer: { mode: "compose" },
    siding: false,
    hint: null,
    post: "",
    seq: 0,
  };
}

const KEEP_LINES = 5;

/** The pane already shows an empty draft: switching to it again must not slide the same picture over itself. */
const onDraft = (f: BoardState["focus"]) => f.title === DRAFT_TITLE && f.platform === null && f.lines.length === 0;

export function reduceBoard(s: BoardState, a: Action): BoardState {
  switch (a.t) {
    case "reset": {
      // The ledger keeps the last run's sentence so the aria-live footer speaks once per run.
      const fresh = initialBoard();
      return {
        ...fresh,
        ledger: s.ledger,
        hubTurn: s.hubTurn,
        seq: s.seq,
        focus: { ...fresh.focus, scene: s.focus.scene + 1, layer: s.focus.layer + (onDraft(s.focus) ? 0 : 1) },
        rows: Object.fromEntries(
          lineOrder.map((id) => [id, { ...fresh.rows[id], rev: s.rows[id].rev + (s.rows[id].snippet ? 1 : 0) }]),
        ) as Record<PlatformId, RowState>,
      };
    }
    case "set":
      return { ...s, ...a.patch };
    case "row": {
      const prev = s.rows[a.id];
      const next: RowState = { ...prev, ...a.patch };
      if (a.snippet !== undefined && a.snippet !== prev.snippet) {
        next.snippet = a.snippet;
        next.rev = prev.rev + 1;
      }
      return { ...s, rows: { ...s.rows, [a.id]: next } };
    }
    case "rows":
      return {
        ...s,
        rows: Object.fromEntries(lineOrder.map((id) => [id, { ...s.rows[id], ...a.patch }])) as Record<PlatformId, RowState>,
      };
    case "count":
      return { ...s, counters: { ...s.counters, [a.key]: s.counters[a.key] + a.by } };
    case "inbox":
      return { ...s, inbox: Math.max(0, s.inbox + a.by) };
    case "attention":
      return { ...s, attention: Math.max(0, s.attention + a.by) };
    case "hubTurn":
      return { ...s, hubTurn: s.hubTurn + 1 };
    case "switch":
      return { ...s, switchTurn: s.switchTurn + 1 };
    case "focus": {
      const same = a.keep || (a.title === DRAFT_TITLE && a.platform === null && onDraft(s.focus));
      return {
        ...s,
        focus: {
          title: a.title,
          platform: a.platform,
          lines: [],
          status: null,
          scene: s.focus.scene + 1,
          layer: s.focus.layer + (same ? 0 : 1),
          onPost: false,
        },
      };
    }
    case "say": {
      const seq = s.seq + 1;
      // A reply replaces the typing dots it follows, in the same slot (same id), so nothing jumps.
      const dots = s.focus.lines.find((l) => l.k === "typing");
      const kept = s.focus.lines.filter((l) => l.k !== "typing");
      const id = dots && a.line.k !== "typing" ? dots.id : seq;
      const lines = [...kept, { ...a.line, id }].slice(-KEEP_LINES);
      return {
        ...s,
        seq,
        focus: { ...s.focus, lines, status: a.line.status ?? s.focus.status, onPost: s.focus.onPost || !!a.line.onPost },
      };
    }
    case "focusStatus":
      return { ...s, focus: { ...s.focus, status: a.status } };
  }
}
