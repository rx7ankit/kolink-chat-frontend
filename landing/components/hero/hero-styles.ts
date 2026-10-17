const left = ["instagram", "facebook", "messenger", "whatsapp"];
const right = ["threads", "x", "linkedin", "gmail"];
const sel = (ids: string[]) => ids.map((id) => `html[data-hero="interchange"] .kh-row[data-line="${id}"]`).join(",");

/**
 * Hero-only CSS: grid areas for the three layouts (no-JS safe, the boot script sets
 * html[data-hero] and html[data-headline] before paint), headline variants, and the few
 * loops (caret, kicker dot, typing dots, an occupied siding) that stop when paused.
 */
export const heroCss = `
.kh-titlewrap{container-type:inline-size}
.kh-title{line-height:.95;overflow-wrap:break-word;--kh-k:1}
html[data-font="blocks"] .kh-title{--kh-k:.78}
html[data-font="sticker"] .kh-title{--kh-k:.94}
.kh-hl{display:none}
html:not([data-headline]) .kh-hl[data-hl="a"],
html[data-headline="a"] .kh-hl[data-hl="a"],
html[data-headline="b"] .kh-hl[data-hl="b"],
html[data-headline="c"] .kh-hl[data-hl="c"],
html[data-headline="d"] .kh-hl[data-hl="d"]{display:block}
.kh-hl[data-hl="a"]{font-size:calc(min(48px,13.5cqi) * var(--kh-k))}
.kh-hl:not([data-hl="a"]){font-size:calc(min(42px,10.5cqi) * var(--kh-k))}
@media (min-width:48rem){
  .kh-hl[data-hl="a"]{font-size:calc(min(72px,15cqi) * var(--kh-k))}
  .kh-hl:not([data-hl="a"]){font-size:calc(min(60px,10cqi) * var(--kh-k))}
}
@media (min-width:75rem){
  .kh-title{line-height:.92}
  .kh-hl[data-hl="a"]{font-size:calc(min(92px,17cqi) * var(--kh-k))}
  .kh-hl:not([data-hl="a"]){font-size:calc(min(66px,10.5cqi) * var(--kh-k))}
  html[data-hero="interchange"] .kh-hl[data-hl="a"]{font-size:calc(min(92px,11cqi) * var(--kh-k))}
}

.kh-stage{position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"title" "sub" "rail" "drive" "board" "cta"}
.kh-a-title{grid-area:title}.kh-a-sub{grid-area:sub}.kh-a-rail{grid-area:rail}.kh-a-drive{grid-area:drive}
.kh-a-board{grid-area:board}.kh-a-cta{grid-area:cta}.kh-a-hub{grid-area:hub;display:none}.kh-a-pill{grid-area:pill;display:none}
.kh-a-title,.kh-a-sub,.kh-a-rail,.kh-a-drive,.kh-a-board,.kh-a-cta,.kh-a-hub,.kh-a-pill{position:relative;z-index:1}
.kh-grid{z-index:0;display:none;animation:kh-fade .3s ease-out both}
@media (min-width:75rem){html[data-grid="hero"] .kh-grid{display:grid}}
/* Rows are 40px on phones/tablets; the hit area reaches into the 4px gaps for a 44px target. */
.kh-row::before{content:"";position:absolute;inset:-2px 0}

@media (min-width:75rem){
  .kh-stage{
    min-height:clamp(720px,calc(100svh - 64px - 112px),940px);
    grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px;
    grid-template-rows:auto auto auto auto auto 1fr;
    /* The hub owns cols 6–7 above the composer; the INBOX pill sits under it on the trunk, so the
       composer can run on into col 6 (its send key feeds the trunk's corner under the hub). */
    grid-template-areas:
      "title title title title title hub hub board board board board board"
      "sub sub sub sub sub hub hub board board board board board"
      "rail rail rail rail rail pill pill board board board board board"
      "drive drive drive drive drive drive . board board board board board"
      "cta cta cta cta cta . . board board board board board"
      ". . . . . . . board board board board board";
  }
  .kh-a-hub{display:flex;justify-content:center;align-items:flex-start}
  .kh-a-pill{display:flex;justify-content:center;align-items:flex-end}
  html:not([data-hero="interchange"]) .kh-a-drive{margin-right:40px}
  .kh-a-board{align-self:start}

  /* ---------- Interchange (Studio › Hero style): centred hub, 4 + 4 station cards ---------- */
  html[data-hero="interchange"] .kh-stage{
    grid-template-rows:auto auto auto 38px 64px 36px 64px 96px 64px 36px 64px 24px auto auto auto auto 1fr;
    grid-template-areas:none;
  }
  html[data-hero="interchange"] .kh-a-title{grid-column:1/9;grid-row:1/3}
  html[data-hero="interchange"] .kh-a-sub{grid-column:9/13;grid-row:1/3;align-self:end;margin:0 0 72px}
  html[data-hero="interchange"] .kh-a-cta{grid-column:9/13;grid-row:1/3;align-self:end;margin-top:0}
  html[data-hero="interchange"] .kh-a-rail{grid-column:3/11;grid-row:3;justify-self:center;margin:44px 0 20px;max-width:none}
  html[data-hero="interchange"] .kh-a-hub{grid-column:6/8;grid-row:4/13;padding-top:${250 - 40 - 28}px!important}
  html[data-hero="interchange"] .kh-a-board,
  html[data-hero="interchange"] .kh-board,
  html[data-hero="interchange"] .kh-b-rows{display:contents}
  html[data-hero="interchange"] .kh-b-head{grid-column:5/9;grid-row:4/6;align-self:center;justify-self:center;flex-direction:column;height:auto;gap:6px;border:0;padding:0;text-align:center;z-index:1}
  html[data-hero="interchange"] .kh-b-div{display:none}
  /* 232px station cards: no room for a thumbnail beside the snippet and status. */
  html[data-hero="interchange"] .kh-thumb{display:none}
  /* Nor for the automation tag or the Agentic/Human pill: the status cell and the focus pane carry both. */
  html[data-hero="interchange"] .kh-tag,html[data-hero="interchange"] .kh-mode{display:none}
  html[data-hero="interchange"] .kh-row{height:64px;border:1px solid var(--k-line);border-radius:var(--k-r);z-index:1}
  html[data-hero="interchange"] .kh-row:not(:hover):not(:focus-visible):not([aria-pressed="true"]){background:var(--k-surface)}
  html[data-hero="interchange"] .kh-row[data-line="instagram"],html[data-hero="interchange"] .kh-row[data-line="threads"]{grid-row:5}
  html[data-hero="interchange"] .kh-row[data-line="facebook"],html[data-hero="interchange"] .kh-row[data-line="x"]{grid-row:7}
  html[data-hero="interchange"] .kh-row[data-line="messenger"],html[data-hero="interchange"] .kh-row[data-line="linkedin"]{grid-row:9}
  html[data-hero="interchange"] .kh-row[data-line="whatsapp"],html[data-hero="interchange"] .kh-row[data-line="gmail"]{grid-row:11}
  ${sel(left)}{grid-column:1/4;flex-direction:row-reverse;padding-left:12px;padding-right:0}
  ${sel(right)}{grid-column:10/13;padding-left:0;padding-right:12px}
  ${left.map((id) => `html[data-hero="interchange"] .kh-row[data-line="${id}"] .kh-roundel`).join(",")}{margin-left:0;margin-right:-15px}
  html[data-hero="interchange"] .kh-a-drive{grid-column:4/10;grid-row:13;margin-top:36px}
  html[data-hero="interchange"] .kh-drive{display:flex;flex-direction:column}
  html[data-hero="interchange"] .kh-barrow{order:1;margin-top:0}
  html[data-hero="interchange"] .kh-counter{order:2}
  html[data-hero="interchange"] .kh-labelrow{order:3;margin-top:10px;max-width:none}
  /* Interchange: the pill sits left of the composer bar, where the inbox line from the hub lands. */
  html[data-hero="interchange"] .kh-a-pill{grid-column:1/4;grid-row:13;justify-self:end;align-self:start;margin-top:50px}
  html[data-hero="interchange"] .kh-b-focus{grid-column:4/10;grid-row:14;margin-top:28px;border:1px solid var(--k-line);border-radius:var(--k-r);background:var(--k-surface);z-index:1}
  html[data-hero="interchange"] .kh-b-foot{grid-column:4/10;grid-row:15;border:0;justify-content:center;z-index:1}
  html[data-hero="interchange"] .kh-b-foot ul{justify-content:center}
}

/* ---------- loops: all stop when paused, offscreen or still ---------- */
@keyframes kh-fade{from{opacity:0}to{opacity:1}}
@keyframes kh-blink{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes kh-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes kh-dots{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes kh-march{to{stroke-dashoffset:-24}}
.kh-caret{animation:kh-blink 1.06s linear infinite}
.kh-pulse{animation:kh-pulse 1.6s ease-in-out infinite}
.kh-dot{animation:kh-dots .9s ease-in-out infinite}
.kh-march{animation:kh-march .9s linear infinite}
[data-paused="true"] .kh-loop{animation-play-state:paused}
html[data-motion="still"] .kh-loop,html[data-motion="still"] .kh-grid{animation:none}
@media (prefers-reduced-motion:reduce){.kh-loop,.kh-grid{animation:none}}
`;
