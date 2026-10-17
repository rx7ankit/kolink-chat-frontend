"use client";

import { Fragment, type ReactNode, type Ref } from "react";

import { Glyph, type Handler } from "@/components/transit/glyph";
import { Odometer } from "@/components/ui/odometer";
import { lineOrder } from "@/lib/capabilities";
import type { BoardState } from "@/lib/hero/board";
import type { Media, ThreadLine } from "@/lib/hero/types";
import type { PlatformId } from "@/lib/platforms";

import { FocusPane } from "./focus-pane";
import { MiniHub } from "./hub";
import { InboxPill } from "./inbox-pill";
import { StationRow } from "./station-row";

function Counters({ c }: { c: BoardState["counters"] }) {
  const cells = [
    ["In", c.in],
    ["Auto", c.auto],
    ["Agent", c.agent],
    ["Team", c.team],
  ] as const;
  // 11px on every width: phones drop the separators (gaps instead) so the line fits beside the pill.
  return (
    <p className="mono flex min-w-0 items-center gap-2 overflow-hidden text-[11px] text-ink uppercase md:shrink-0 md:gap-1.5">
      {cells.map(([label, v], i) => (
        <Fragment key={label}>
          {i > 0 && (
            <span aria-hidden className="hidden text-ink-soft md:inline">
              ·
            </span>
          )}
          <span className="inline-flex items-center gap-[0.35em] whitespace-nowrap">
            {label}
            <span aria-hidden className="inline-flex">
              <Odometer value={v} />
            </span>
            <span className="sr-only">{v}</span>
          </span>
        </Fragment>
      ))}
    </p>
  );
}

/**
 * The map's key, one line in the board's footer: who answers (the rows spell out each status too).
 * The post capsule needs no key: it visibly leaves the composer.
 */
const KEY: [Handler, string, string][] = [
  ["incoming", "Incoming", "In"],
  ["automation", "Automation", "Auto"],
  ["agent", "AI agent", "Agent"],
  ["team", "Team", "Team"],
  ["attention", "Needs you", "Needs you"],
];

/**
 * THE BOARD: header with counters, eight fixed station rows (publish lines, then
 * conversation lines), the focus pane and the key. On mobile and tablet the same markup is
 * the "spine galley"; its route and packet layers are passed in. The run summary is spoken
 * once per run (aria-live), never printed: the counters already show it.
 */
export function Board({
  view,
  media,
  pinned,
  preview,
  still,
  onPin,
  onPeek,
  onResume,
  galleyRef,
  routes,
  packets,
}: {
  view: BoardState;
  /** The current post's attachment: row thumbnails and focus-pane mockups. */
  media: Media | null;
  pinned: PlatformId | null;
  preview: { title: string; lines: ThreadLine[]; pinned: boolean; platform: PlatformId } | null;
  still: boolean;
  onPin: (id: PlatformId) => void;
  onPeek: (id: PlatformId | null) => void;
  onResume: () => void;
  galleyRef: Ref<HTMLDivElement>;
  routes?: ReactNode;
  packets?: ReactNode;
}) {
  const row = (id: PlatformId) => {
    const i = lineOrder.indexOf(id);
    return (
      <StationRow
        key={id}
        id={id}
        index={i}
        row={view.rows[id]}
        media={media}
        pinned={pinned === id}
        still={still}
        onPin={onPin}
        onPeek={onPeek}
      />
    );
  };
  return (
    <div className="kh-a-board mt-8 min-w-0 min-[75rem]:mt-0" data-hx-watch>
      <div ref={galleyRef} className="kh-board k-card relative">
        {routes}
        <div className="kh-b-head relative flex h-10 items-center justify-between gap-2 border-b border-line pr-2.5 pl-10 min-[75rem]:px-4">
          <span className="absolute top-1.5 left-1 min-[75rem]:hidden">
            <MiniHub />
          </span>
          <p className="mono hidden min-w-0 truncate text-[11px] tracking-[0.06em] text-ink-soft uppercase md:block">Demo workspace</p>
          <Counters c={view.counters} />
          <InboxPill
            inbox={view.inbox}
            attention={view.attention}
            still={still}
            className="h-7 w-[84px] justify-center gap-1 px-2 tracking-[0.02em] min-[75rem]:hidden"
          />
        </div>
        <div className="kh-b-rows flex flex-col gap-1 py-1.5 min-[75rem]:py-2">
          {lineOrder.slice(0, 5).map(row)}
          <p
            aria-hidden
            className="kh-b-div mono flex h-[14px] shrink-0 items-center gap-2 pr-3 pl-[35px] text-[11px] leading-none tracking-[0.08em] text-ink-soft uppercase min-[75rem]:h-4 min-[75rem]:pl-6"
          >
            Conversation lines <span className="h-px flex-1 bg-line" />
          </p>
          {lineOrder.slice(5).map(row)}
        </div>
        <FocusPane
          title={view.focus.title}
          status={view.focus.status}
          lines={view.focus.lines}
          onPost={view.focus.onPost}
          post={view.post}
          layer={view.focus.layer}
          platform={view.focus.platform}
          media={media}
          preview={preview}
          hint={view.hint}
          still={still}
          onResume={onResume}
        />
        <div className="kh-b-foot flex min-h-10 items-center border-t border-line px-3 py-2 min-[75rem]:px-4">
          <ul className="mono flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-[0.02em] text-ink-soft uppercase" aria-label="Key">
            {/* Phones use the counters' own short words, so the key stays on one line. */}
            {KEY.map(([h, label, short]) => (
              <li key={h} className="flex items-center gap-1.5 whitespace-nowrap">
                <Glyph handler={h} size={9} />
                <span className="md:hidden">{short}</span>
                <span className="hidden md:inline">{label}</span>
              </li>
            ))}
          </ul>
          <p className="sr-only" aria-live="polite">
            {view.ledger}
          </p>
        </div>
        {packets}
      </div>
    </div>
  );
}
