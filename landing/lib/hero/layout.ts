import { lineOrder } from "@/lib/capabilities";
import type { PlatformId } from "@/lib/platforms";
import { buildLut, link, polyline, toPath, type LineStyle, type Lut, type Pt, type Route } from "@/lib/transit/geometry";

/**
 * Hero route geometry. Desktop layouts are built from anchors measured once (mount,
 * ResizeObserver, fonts.ready); the mobile/tablet spine galley is computed from row indices.
 * Every route gets an arc-length LUT so packets never read the DOM while they travel.
 */

export type HeroLayout = "branch" | "interchange" | "spine";

export type Box = { x: number; y: number; w: number; h: number };

export type Anchors = {
  w: number;
  h: number;
  send: Box;
  pill: Box;
  badge: Box;
  hub: Box;
  roundels: Record<PlatformId, Box>;
};

export type RouteRec = { d: string; lut: Lut };

export type DrawnLine = {
  id: string;
  d: string;
  kind: "branch" | "trunk" | "siding" | "inbox" | "rail";
  platform?: PlatformId;
  /** Conversation-only line (Messenger, WhatsApp, Gmail): dashed until someone writes in. */
  conv?: boolean;
  /** Draw-in order for the first-load energize beat. */
  order: number;
};

export type Geometry = {
  layout: HeroLayout;
  w: number;
  h: number;
  lines: DrawnLine[];
  routes: {
    post: RouteRec;
    team: RouteRec;
    siding: RouteRec;
    branch: Record<PlatformId, RouteRec>;
    reply: Record<PlatformId, RouteRec>;
  };
  stations: Record<PlatformId, Pt>;
  /** Base packet speed in px/ms (storyboard: 0.8 desktop, 0.6 mobile). */
  speed: number;
  /** Packet glyph scale. */
  scale: number;
  /** Line stroke width. */
  stroke: number;
};

/* ---------------------------------------------------------------- spine metrics (shared with the galley CSS) */

export const SPINE = {
  rail: 18,
  hubY: 20,
  hubR: 14,
  header: 40,
  pad: 6,
  // 40px rows + 4px gaps: each row button plus its share of the gaps is a 44px touch target.
  row: 40,
  gap: 4,
  divider: 14,
  roundel: 46,
  roundelR: 11,
  focus: 216,
  pillW: 84,
  padR: 10,
} as const;

export function spineRowTop(i: number) {
  return SPINE.header + SPINE.pad + i * (SPINE.row + SPINE.gap) + (i >= 5 ? SPINE.divider + SPINE.gap : 0);
}

export const SPINE_ROWS_H = spineRowTop(7) + SPINE.row + SPINE.pad;
export const SPINE_H = SPINE_ROWS_H + SPINE.focus;

/* ---------------------------------------------------------------- desktop board metrics (shared with Board CSS) */

export const BOARD = {
  header: 40,
  pad: 8,
  row: 48,
  gap: 4,
  divider: 16,
  focus: 240,
  footer: 36,
} as const;

/** Centre of the row block, measured from the board's top edge (incl. its 1px border). */
export const BOARD_ROWS_CENTER =
  1 + BOARD.header + BOARD.pad + (8 * BOARD.row + 8 * BOARD.gap + BOARD.divider) / 2;

/* ---------------------------------------------------------------- helpers */

const conversation = new Set<PlatformId>(["messenger", "whatsapp", "gmail"]);
const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const rec = (r: Route): RouteRec => ({ d: r.d, lut: buildLut(r, 128) });
type Seg = Route["segs"][number];

export function concat(...routes: Route[]): Route {
  const segs: Seg[] = [];
  for (const r of routes) {
    if (!r.segs.length) continue;
    const last = segs[segs.length - 1];
    const first = r.segs[0];
    if (last && Math.hypot(last.b.x - first.a.x, last.b.y - first.a.y) > 0.5) segs.push({ k: "L", a: last.b, b: first.a });
    segs.push(...r.segs);
  }
  return { segs, d: toPath(segs) };
}

const onCircle = (c: Pt, r: number, deg: number): Pt => ({
  x: c.x + r * Math.cos((deg * Math.PI) / 180),
  y: c.y + r * Math.sin((deg * Math.PI) / 180),
});

/**
 * Octilinear way down from a hub-side point `e` to a target `t` below it:
 * a 45° diagonal, then vertical into the target. If there is not enough drop for the whole
 * diagonal, it diagonals as far as it can, runs horizontally, then drops the last 10px.
 */
function bendDown(e: Pt, t: Pt): Pt[] {
  const dx = Math.abs(t.x - e.x);
  const dy = t.y - e.y;
  const dir = Math.sign(t.x - e.x) || 1;
  if (dy <= 0) return [e, t];
  if (dy - 10 >= dx) return [e, { x: t.x, y: e.y + dx }, t];
  const k = Math.max(0, dy - 10);
  const d = { x: e.x + dir * k, y: e.y + k };
  return [e, d, { x: t.x, y: d.y }, t];
}

/** Orthogonal version: horizontal out of the hub side, then vertical down. */
function elbowDown(e: Pt, t: Pt): Pt[] {
  return [e, { x: t.x, y: e.y }, t];
}

/* ---------------------------------------------------------------- branch (desktop default) */

function branchFan(hub: Pt, r: number, ends: Record<PlatformId, Pt>, style: LineStyle): Record<PlatformId, Route> {
  const ids = lineOrder;
  const n = ids.length;
  const starts = ids.map((_, i) => ({ x: hub.x + r * 0.45, y: hub.y + (i - (n - 1) / 2) * 8 }));
  const minEnd = Math.min(...ids.map((id) => ends[id].x));
  const gapStart = hub.x + r + 4;
  const gapEnd = minEnd - 18;
  const budget = gapEnd - gapStart;

  const withIdx = ids.map((id, i) => ({ id, i }));
  const ups = withIdx.filter(({ id, i }) => ends[id].y < starts[i].y - 0.5).sort((a, b) => ends[a.id].y - ends[b.id].y);
  const downs = withIdx.filter(({ id, i }) => ends[id].y > starts[i].y + 0.5).sort((a, b) => ends[b.id].y - ends[a.id].y);
  const rank = new Map<PlatformId, number>();
  ups.forEach((u, k) => rank.set(u.id, k));
  downs.forEach((u, k) => rank.set(u.id, k));
  const maxRank = Math.max(ups.length, downs.length, 1) - 1;

  let d = 14;
  let sp = 8;
  const need = () => 4 + 2 * d + maxRank * sp;
  while (need() > budget && (d > 6 || sp > 4)) {
    if (d > 8) d -= 1;
    else if (sp > 4) sp -= 0.5;
    else d -= 1;
  }

  const out = {} as Record<PlatformId, Route>;
  ids.forEach((id, i) => {
    const a = starts[i];
    const b = ends[id];
    if (style === "cord") {
      out[id] = link(a, b, "cord", { sag: 0.08 });
      return;
    }
    const dy = b.y - a.y;
    const ady = Math.abs(dy);
    const sy = Math.sign(dy);
    if (ady < 0.5) {
      out[id] = polyline([a, { x: b.x, y: a.y }]);
      return;
    }
    const xv = gapStart + 2 + d + (rank.get(id) ?? 0) * sp;
    if (style === "orthogonal") {
      out[id] = polyline([a, { x: xv, y: a.y }, { x: xv, y: b.y }, b], 10);
      return;
    }
    if (ady <= 2 * d) {
      const half = ady / 2;
      out[id] = polyline([a, { x: xv - half, y: a.y }, { x: xv + half, y: b.y }, b], 8);
      return;
    }
    out[id] = polyline(
      [a, { x: xv - d, y: a.y }, { x: xv, y: a.y + sy * d }, { x: xv, y: b.y - sy * d }, { x: xv + d, y: b.y }, b],
      8,
    );
  });
  return out;
}

function branchGeometry(a: Anchors, style: LineStyle): Geometry {
  const hub = center(a.hub);
  const r = a.hub.w / 2;
  const send = center(a.send);
  const pill = center(a.pill);
  const sy = send.y;
  // The INBOX pill sits straight under the hub (both centred in the hub columns): the trunk runs
  // right from the send key, turns up under the hub, passes through the pill and enters the hub.
  const X = hub.x;
  const badgeTop = { x: center(a.badge).x, y: a.badge.y + 2 };

  let post: Route;
  let team: Route;
  let siding: Route;
  if (style === "cord") {
    const lead = { x: X - 28, y: sy };
    post = concat(polyline([send, lead]), link(lead, hub, "cord", { sag: 0.1 }));
    team = link(hub, pill, "cord", { sag: 0.04 });
    siding = link(hub, badgeTop, "cord", { sag: 0.08 });
  } else {
    post = polyline([send, { x: X, y: sy }, hub], 14);
    team = polyline([hub, { x: X, y: pill.y }]);
    // The dashed siding leaves the hub's lower right and drops, parallel to the trunk, onto the ▲ badge.
    siding = polyline([hub, ...bendDown(onCircle(hub, r, 55), badgeTop)], 10);
  }

  const ends = Object.fromEntries(lineOrder.map((id) => [id, center(a.roundels[id])])) as Record<PlatformId, Pt>;
  const fan = branchFan(hub, r, ends, style);
  return assemble("branch", a.w, a.h, { post, team, siding, trunkDrawn: post, sidingDrawn: siding, fan, hub, ends, speed: 0.8, scale: 1, stroke: 4 });
}

/* ---------------------------------------------------------------- interchange (Studio variant, desktop) */

function interchangeGeometry(a: Anchors, style: LineStyle): Geometry {
  const hub = center(a.hub);
  const r = a.hub.w / 2;
  const send = center(a.send);
  const pill = center(a.pill);
  const badgeTop = { x: center(a.badge).x, y: a.badge.y + 2 };
  const ends = Object.fromEntries(lineOrder.map((id) => [id, center(a.roundels[id])])) as Record<PlatformId, Pt>;

  const fan = {} as Record<PlatformId, Route>;
  for (const dir of [-1, 1] as const) {
    const side = lineOrder.filter((id) => (ends[id].x < hub.x ? -1 : 1) === dir).sort((p, q) => ends[p].y - ends[q].y);
    const n = side.length;
    const starts = side.map((_, k) => ({ x: hub.x + dir * r * 0.45, y: hub.y + (k - (n - 1) / 2) * 8 }));
    const ups = side.filter((id, k) => ends[id].y < starts[k].y).sort((p, q) => ends[p].y - ends[q].y);
    const downs = side.filter((id, k) => ends[id].y >= starts[k].y).sort((p, q) => ends[q].y - ends[p].y);
    const rank = new Map<PlatformId, number>();
    ups.forEach((id, k) => rank.set(id, k));
    downs.forEach((id, k) => rank.set(id, k));
    side.forEach((id, k) => {
      const s = starts[k];
      const e = ends[id];
      if (style === "cord") {
        fan[id] = link(s, e, "cord", { sag: 0.1 });
        return;
      }
      const ady = Math.abs(e.y - s.y);
      let x0 = hub.x + dir * (r + 14 + (rank.get(id) ?? 0) * 6);
      if (style === "orthogonal") {
        fan[id] = polyline([s, { x: x0, y: s.y }, { x: x0, y: e.y }, e], 12);
        return;
      }
      const tail = 18;
      if ((e.x - (x0 + dir * ady)) * dir < tail) x0 = e.x - dir * (tail + ady);
      if ((x0 - s.x) * dir < r) {
        fan[id] = link(s, e, "octilinear", { r: 12 });
        return;
      }
      fan[id] = polyline([s, { x: x0, y: s.y }, { x: x0 + dir * ady, y: e.y }, e], 12);
    });
  }

  let post: Route;
  let team: Route;
  let siding: Route;
  if (style === "cord") {
    post = link(send, hub, "cord", { sag: 0.12 });
    team = link(hub, pill, "cord", { sag: 0.12 });
    siding = link(hub, badgeTop, "cord", { sag: 0.16 });
  } else if (style === "orthogonal") {
    post = polyline([send, ...elbowDown(onCircle(hub, r, 0), send).reverse().slice(1), hub], 14);
    team = polyline([hub, ...elbowDown(onCircle(hub, r, 180), pill)], 14);
    siding = polyline([hub, ...elbowDown(onCircle(hub, r, 150), badgeTop)], 12);
  } else {
    post = polyline([...bendDown(onCircle(hub, r, 45), send)].reverse().concat([hub]), 14);
    team = polyline([hub, ...bendDown(onCircle(hub, r, 135), pill)], 14);
    siding = polyline([hub, ...bendDown(onCircle(hub, r, 112), badgeTop)], 12);
  }

  return assemble("interchange", a.w, a.h, {
    post,
    team,
    siding,
    trunkDrawn: post,
    sidingDrawn: siding,
    inboxDrawn: team,
    fan,
    hub,
    ends,
    speed: 0.8,
    scale: 1,
    stroke: 4,
  });
}

/* ---------------------------------------------------------------- spine galley (mobile + tablet) */

function spineGeometry(width: number, style: LineStyle): Geometry {
  const hub = { x: SPINE.rail, y: SPINE.hubY };
  const ends = Object.fromEntries(
    lineOrder.map((id, i) => [id, { x: SPINE.roundel, y: spineRowTop(i) + SPINE.row / 2 }]),
  ) as Record<PlatformId, Pt>;
  const fan = {} as Record<PlatformId, Route>;
  for (const id of lineOrder) {
    const e = ends[id];
    fan[id] = style === "cord" ? link(hub, e, "cord", { sag: 0.05 }) : polyline([hub, { x: SPINE.rail, y: e.y }, e], style === "orthogonal" ? 4 : 8);
  }
  const pillX = width - SPINE.padR - SPINE.pillW / 2;
  const base = SPINE.header;
  const entry = { x: SPINE.rail, y: -26 };
  const post = polyline([entry, hub]);
  const team = polyline([hub, { x: SPINE.rail, y: base }, { x: pillX, y: base }, { x: pillX, y: SPINE.hubY + 12 }], 6);

  const lines: DrawnLine[] = [
    { id: "trunk", kind: "trunk", d: polyline([entry, { x: SPINE.rail, y: SPINE.hubY - SPINE.hubR }]).d, order: 0 },
    { id: "rail", kind: "rail", d: polyline([{ x: SPINE.rail, y: SPINE.hubY + SPINE.hubR }, { x: SPINE.rail, y: ends.gmail.y }]).d, order: 1 },
    { id: "siding", kind: "siding", d: polyline([{ x: SPINE.rail + SPINE.hubR, y: base }, { x: pillX, y: base }]).d, order: 10 },
    ...lineOrder.map(
      (id, i): DrawnLine => ({
        id,
        kind: "branch",
        platform: id,
        conv: conversation.has(id),
        d: polyline([{ x: SPINE.rail, y: ends[id].y }, { x: SPINE.roundel - SPINE.roundelR, y: ends[id].y }]).d,
        order: 2 + i,
      }),
    ),
  ];

  return {
    layout: "spine",
    w: width,
    h: SPINE_H,
    lines,
    routes: {
      post: rec(post),
      team: rec(team),
      siding: rec(team),
      branch: Object.fromEntries(lineOrder.map((id) => [id, rec(fan[id])])) as Record<PlatformId, RouteRec>,
      reply: Object.fromEntries(lineOrder.map((id) => [id, rec(concat(post, fan[id]))])) as Record<PlatformId, RouteRec>,
    },
    stations: ends,
    speed: 0.6,
    scale: 0.78,
    stroke: 3,
  };
}

/* ---------------------------------------------------------------- assembly */

function assemble(
  layout: HeroLayout,
  w: number,
  h: number,
  p: {
    post: Route;
    team: Route;
    siding: Route;
    trunkDrawn: Route;
    sidingDrawn: Route;
    inboxDrawn?: Route;
    fan: Record<PlatformId, Route>;
    hub: Pt;
    ends: Record<PlatformId, Pt>;
    speed: number;
    scale: number;
    stroke: number;
  },
): Geometry {
  const lines: DrawnLine[] = [
    { id: "trunk", kind: "trunk", d: p.trunkDrawn.d, order: 0 },
    ...(p.inboxDrawn ? [{ id: "inbox", kind: "inbox", d: p.inboxDrawn.d, order: 0 } as DrawnLine] : []),
    { id: "siding", kind: "siding", d: p.sidingDrawn.d, order: 9 },
    ...lineOrder.map(
      (id, i): DrawnLine => ({ id, kind: "branch", platform: id, conv: conversation.has(id), d: p.fan[id].d, order: 1 + i }),
    ),
  ];
  return {
    layout,
    w,
    h,
    lines,
    routes: {
      post: rec(p.post),
      team: rec(p.team),
      siding: rec(p.siding),
      branch: Object.fromEntries(lineOrder.map((id) => [id, rec(p.fan[id])])) as Record<PlatformId, RouteRec>,
      reply: Object.fromEntries(lineOrder.map((id) => [id, rec(concat(p.post, p.fan[id]))])) as Record<PlatformId, RouteRec>,
    },
    stations: p.ends,
    speed: p.speed,
    scale: p.scale,
    stroke: p.stroke,
  };
}

export type GeometryInput = { layout: "spine"; width: number } | { layout: "branch" | "interchange"; anchors: Anchors };

export function buildGeometry(input: GeometryInput, style: LineStyle): Geometry {
  if (input.layout === "spine") return spineGeometry(input.width, style);
  if (input.layout === "interchange") return interchangeGeometry(input.anchors, style);
  return branchGeometry(input.anchors, style);
}
