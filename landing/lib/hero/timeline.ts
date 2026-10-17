import { platformById, type PlatformId } from "@/lib/platforms";

import { DRAFT_TITLE, initialBoard, reduceBoard, type Action, type BoardState, type RowGlyph } from "./board";
import { publishTags } from "./counters";
import type { PacketShape, Script, ScriptItem, ThreadLine } from "./types";

/**
 * A script becomes a flat list of beats. The driver plays them with real time and packets;
 * finalBoard() folds the same list instantly, so the reduced-motion end state can never
 * drift from what the animation shows.
 */

export type RouteRef =
  | { k: "post" }
  | { k: "branch"; id: PlatformId }
  | { k: "team" }
  | { k: "siding" }
  | { k: "reply"; id: PlatformId };

export type Launch = {
  route: RouteRef;
  shape: PacketShape;
  /** Multiplier on the base travel speed. */
  speed: number;
  /** Ride the route backwards (customer → hub). */
  reverse?: boolean;
  /** ms before launch (scaled by pace). */
  delay?: number;
  /** Comet trail (outbound capsules, desktop only). */
  trail?: boolean;
  onLaunch?: Action[];
  onArrive?: Action[];
};

export type Step =
  | { t: "wait"; ms: number }
  | { t: "do"; a: Action[] }
  | { t: "type"; text: string; speed: "post" | "reply" }
  | { t: "send" }
  | { t: "go"; launches: Launch[]; wait: boolean };

const upper = (p: PlatformId) => platformById[p].name.toUpperCase();

const sortGlyph: Record<ScriptItem["handler"], RowGlyph> = {
  automation: "automation",
  agent: "agent",
  attention: "agent",
  team: "team",
  sorted: "sorted",
};

/** Lines a hover/pin preview shows once an item is answered (no typing dots). */
const readable = (it: ScriptItem) => it.thread.filter((l) => l.k !== "typing");
const incoming = (it: ScriptItem) => it.thread.filter((l) => l.k === "them");

function words(text = "") {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Reading time per focus-pane line, before pace. */
function gap(line: ThreadLine) {
  switch (line.k) {
    case "typing":
      return 320;
    case "them":
      return 440;
    case "us":
      return (line.reveal === "words" ? words(line.text) * 24 + 420 : 380) + (line.cards ? 320 : 0);
    case "tap":
      return 320;
    case "note":
      return 280;
    case "handoff":
      return 700;
    default:
      return 300;
  }
}

export function buildTimeline(s: Script, o: { typed: boolean }): Step[] {
  const out: Step[] = [];
  const wait = (ms: number) => out.push({ t: "wait", ms });
  const act = (...a: Action[]) => out.push({ t: "do", a });
  const go = (launches: Launch[], all = true) => out.push({ t: "go", launches, wait: all });

  const tags = publishTags(s.post, s.media);
  const live = tags.filter((t) => !t.warn);
  const published: ThreadLine = { k: "published", text: s.post, tags, note: s.visitor?.keywordNote ?? s.visitor?.hint };
  const cur = { focused: null as PlatformId | null };

  const scene = (p: PlatformId) => {
    const it = s.items[p];
    act({ t: "focus", title: `NOW ARRIVING · ${upper(p)}`, platform: p });
    cur.focused = p;
    for (const line of it.thread) {
      if (line.k === "handoff") continue; // the hand-off note lands with the ▲ packet (beat 08)
      act({ t: "say", line });
      wait(gap(line));
    }
  };

  // 01 · Compose
  act(
    { t: "set", patch: { step: 1, hub: "READY", chips: "idle", composer: { mode: "compose" }, hint: null, siding: false, post: s.post } },
    { t: "focus", title: DRAFT_TITLE, platform: null },
  );
  if (o.typed) out.push({ t: "type", text: s.post, speed: "post" });
  act({ t: "set", patch: { chips: "lit" } });
  wait(180);

  // 02 · Send → hub → split
  out.push({ t: "send" });
  go([
    {
      route: { k: "post" },
      shape: "post",
      speed: 1,
      trail: true,
      onArrive: [{ t: "hubTurn" }, { t: "set", patch: { hub: `PUBLISHING · ${live.length}` } }],
    },
  ]);

  // 03 · Fan-out on the publish lines only
  act(
    { t: "set", patch: { step: 2 } },
    ...tags
      .filter((t) => t.warn)
      .map((t): Action => ({ t: "row", id: t.platform, patch: { status: "OVER LIMIT", glyph: null, thread: [published] }, snippet: t.label })),
  );
  go(
    tags.flatMap((tag, i): Launch[] =>
      tag.warn
        ? []
        : [
            {
              route: { k: "branch", id: tag.platform },
              shape: "post",
              speed: 1,
              delay: i * 30,
              trail: true,
              onLaunch: [{ t: "row", id: tag.platform, patch: { active: true } }],
              onArrive: [
                {
                  t: "row",
                  id: tag.platform,
                  // LinkedIn publishing is text-only: its row shows a text tile, never the photo.
                  patch: { status: "PUBLISHED", glyph: "post", thread: [published], thumb: tag.platform === "linkedin" || !s.media ? "text" : "media" },
                  snippet: tag.label,
                },
              ],
            },
          ],
    ),
  );
  // Same pane surface as the draft: the draft's media morphs into the Instagram card of the fan.
  act(
    { t: "focus", title: `PUBLISHED · ${live.length} ${live.length === 1 ? "NETWORK" : "NETWORKS"}`, platform: null, keep: true },
    { t: "say", line: published },
  );
  wait(260);
  if (s.automations.length) {
    act(
      ...s.automations.map(
        (a): Action => ({
          t: "row",
          id: a.platform,
          patch: { tag: `${a.type === "dm" ? "Keyword → DM" : "Keyword → reply"} · ${a.keyword}` },
        }),
      ),
    );
    wait(280);
  }
  if (s.visitor?.hint) act({ t: "set", patch: { hint: s.visitor.hint } });

  // 04 · All eight lines write back
  act({ t: "set", patch: { step: 3 } });
  go(
    s.inboundOrder.map((p, i) => {
      const it = s.items[p];
      return {
        route: { k: "branch", id: p },
        shape: "incoming",
        reverse: true,
        speed: 1.15,
        delay: i * 70,
        onLaunch: [
          { t: "row", id: p, patch: { status: "IN", glyph: "incoming", active: true, carried: true, thread: incoming(it) }, snippet: it.arrives },
        ],
        onArrive: [{ t: "count", key: "in", by: 1 }],
      };
    }),
  );
  act({ t: "set", patch: { hub: `IN · ${s.inboundOrder.length}` } });
  wait(220);

  // 05 · Sort: who should answer?
  act({ t: "set", patch: { hub: "SORTING" } });
  const list = s.inboundOrder.map((p) => s.items[p]);
  const groups: ScriptItem[][] = [
    list.filter((it) => it.handler === "automation"),
    list.filter((it) => it.handler === "agent" || it.handler === "attention"),
    list.filter((it) => it.handler === "team" || it.handler === "sorted"),
  ];
  for (const g of groups) {
    if (!g.length) continue;
    act(
      { t: "switch" },
      ...g.map(
        (it): Action => ({
          t: "row",
          id: it.platform,
          patch: {
            status: it.status,
            glyph: sortGlyph[it.handler],
            mode: it.handler === "agent" || it.handler === "attention" ? "Agentic" : null,
          },
        }),
      ),
    );
    wait(100);
  }
  act(
    ...list
      .filter((it) => it.handler === "sorted")
      .map((it): Action => ({ t: "row", id: it.platform, patch: { active: false, thread: readable(it) }, snippet: it.outcome })),
  );

  // 06 · First answers go out; the featured thread plays in the focus pane
  const answers: Launch[] = [];
  list.forEach((it, i) => {
    const p = it.platform;
    const done: Action = { t: "row", id: p, patch: { thread: readable(it) }, snippet: it.outcome };
    if (it.handler === "automation") {
      answers.push({ route: { k: "branch", id: p }, shape: "automation", speed: 1.2, delay: i * 40, onArrive: [{ t: "count", key: "auto", by: 1 }, done] });
    } else if (it.handler === "agent") {
      answers.push({ route: { k: "branch", id: p }, shape: "agent", speed: 1.2, delay: i * 40, onArrive: [{ t: "count", key: "agent", by: 1 }, done] });
    } else if (it.handler === "team") {
      answers.push({
        route: { k: "team" },
        shape: "team",
        speed: 1.2,
        delay: 140 + i * 60,
        onArrive: [{ t: "count", key: "team", by: 1 }, { t: "inbox", by: 1 }, { ...done, patch: { ...done.patch, active: false } }],
      });
    }
  });
  go(answers, false);
  scene(s.scenes.first);

  // 07 · The agent, up close
  if (s.scenes.agent && s.scenes.agent !== s.scenes.first) scene(s.scenes.agent);

  // 08 · Hand-off: ▲ down the dashed siding to the inbox pill
  const h = s.scenes.handoff;
  if (h) {
    const it = s.items[h];
    if (cur.focused !== h) scene(h);
    go([
      {
        route: { k: "siding" },
        shape: "attention",
        speed: 0.9,
        onLaunch: [
          { t: "set", patch: { siding: true } },
          { t: "row", id: h, patch: { status: "NEEDS ATTENTION", glyph: "attention", mode: "Human", ring: true } },
        ],
        onArrive: [
          { t: "set", patch: { siding: false, bell: `IG ${h === "instagram" ? 1 : 0} · Messenger ${h === "messenger" ? 1 : 0}` } },
          { t: "attention", by: 1 },
          { t: "inbox", by: 1 },
          { t: "row", id: h, patch: { thread: readable(it) }, snippet: it.outcome },
        ],
      },
    ]);
    const note = it.thread.find((l) => l.k === "handoff");
    if (note) act({ t: "say", line: { ...note, status: "NEEDS ATTENTION" } });
    wait(gap(note ?? { k: "note" }));
  } else {
    wait(250);
  }

  // 09 · Your team replies from the same bar, on that thread's own channel
  const r = s.reply;
  const rit = s.items[r.platform];
  act({ t: "set", patch: { composer: { mode: "reply", platform: r.platform, label: r.mode }, chips: "lit" } });
  if (cur.focused !== r.platform) {
    act({ t: "focus", title: `NOW ARRIVING · ${upper(r.platform)}`, platform: r.platform }, ...incoming(rit).map((line): Action => ({ t: "say", line })));
    cur.focused = r.platform;
  }
  wait(260);
  out.push({ t: "type", text: r.text, speed: "reply" });
  out.push({ t: "send" });
  const teamLine: ThreadLine = { k: "us", by: "team", via: "From the composer", text: r.text };
  const replyThread = [...readable(rit).filter((l) => l.k !== "note"), teamLine];
  go([
    {
      route: { k: "reply", id: r.platform },
      shape: "team",
      speed: 1,
      onLaunch: [{ t: "row", id: r.platform, patch: { active: true } }],
      onArrive: [
        {
          t: "row",
          id: r.platform,
          patch: { status: r.markDone ? "DONE" : "REPLIED", glyph: "team", ring: false, done: !!r.markDone, thread: replyThread },
          snippet: r.outcome,
        },
        ...(r.markDone ? ([{ t: "attention", by: -1 }, { t: "set", patch: { bell: "IG 0 · Messenger 0" } }] as Action[]) : []),
      ],
    },
  ]);
  act({ t: "say", line: { ...teamLine, status: r.markDone ? undefined : "SENT" } });
  if (r.markDone) {
    wait(260);
    act({ t: "say", line: { k: "note", text: "↳ Mark done ✓ · attention cleared", status: "DONE" } });
  }
  wait(520);
  act({ t: "set", patch: { composer: { mode: "compose" }, chips: "idle" } });

  // 10 · Ledger (the driver holds and clears)
  act({ t: "set", patch: { ledger: s.ledger, hub: "READY" } }, { t: "rows", patch: { active: false } });
  return out;
}

/** The board after a full run, computed instantly (reduced motion, Studio "Still"). */
export function finalBoard(s: Script): BoardState {
  let st = initialBoard();
  const apply = (a: Action) => {
    st = reduceBoard(st, a);
  };
  for (const step of buildTimeline(s, { typed: true })) {
    if (step.t === "do") step.a.forEach(apply);
    else if (step.t === "go")
      for (const l of step.launches) {
        l.onLaunch?.forEach(apply);
        l.onArrive?.forEach(apply);
      }
  }
  return st;
}
