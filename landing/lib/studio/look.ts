import { platforms } from "../platforms";
import { accentTextFor, contrast, derivedTokens, inkFor, isHex } from "./color";
import { defaultFontId, fontPairings } from "./font-pairings";
import { defaultPaletteId, palettes } from "./palettes";
import { lookOptions, tokenKeys, type Look, type LookOptionKey } from "./types";

// Bumped when defaults change so looks saved under the old design are discarded.
export const STORAGE_KEY = "kolink-look-v3";
export const URL_PARAM = "look";

export const defaultLook: Look = {
  palette: defaultPaletteId,
  font: defaultFontId,
  accent: null,
  emphasis: "serif",
  radius: "round",
  card: "hairline",
  motion: "lively",
  grain: "off",
  grid: "off",
  icons: "brand",
  lineColor: "ink",
  lines: "octilinear",
  rhythm: "hairlines",
  headline: "a",
  script: "rotate",
  hero: "branch",
};

const optionKeys = Object.keys(lookOptions) as LookOptionKey[];
const paletteIds = palettes.map((p) => p.id);
const fontIds = fontPairings.map((f) => f.id);

/** Coerce anything (storage, URL, clipboard) into a valid Look. */
export function sanitizeLook(input: unknown): Look {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const look = { ...defaultLook } as Record<string, unknown>;
  if (paletteIds.includes(raw.palette as string)) look.palette = raw.palette;
  if (fontIds.includes(raw.font as string)) look.font = raw.font;
  look.accent = isHex(raw.accent) ? raw.accent.toUpperCase() : null;
  for (const key of optionKeys) {
    if ((lookOptions[key] as readonly string[]).includes(raw[key] as string)) look[key] = raw[key];
  }
  return look as Look;
}

/** Compact share-link form: palette.font.<options in lookOptions order>[.accent] */
export function encodeLook(look: Look) {
  const parts = [look.palette, look.font, ...optionKeys.map((k) => look[k])];
  if (look.accent) parts.push(look.accent.slice(1).toLowerCase());
  return parts.join(".");
}

export function decodeLook(value: string | null | undefined): Look | null {
  if (!value) return null;
  const parts = value.split(".");
  if (!parts[0]) return null;
  const raw: Record<string, unknown> = { palette: parts[0], font: parts[1] };
  optionKeys.forEach((k, i) => (raw[k] = parts[i + 2]));
  const accent = parts[optionKeys.length + 2];
  raw.accent = accent ? `#${accent}` : null;
  return sanitizeLook(raw);
}

const attrName = (key: string) => `data-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/** Attributes mirrored onto <html>; CSS keys every Studio option off these. */
export function lookAttributes(look: Look): Record<string, string> {
  const attrs: Record<string, string> = { "data-palette": look.palette, "data-font": look.font };
  for (const key of optionKeys) attrs[attrName(key)] = look[key];
  return attrs;
}

export function accentOverride(
  look: Look,
): { accent: string; accentInk: string; accentText: string; accentEdge: string } | null {
  if (!look.accent) return null;
  const { bg, ink } = (palettes.find((p) => p.id === look.palette) ?? palettes[0]).tokens;
  return {
    accent: look.accent,
    accentInk: inkFor(look.accent),
    accentText: accentTextFor(look.accent, bg, ink),
    accentEdge: contrast(look.accent, bg) < 3 ? ink : "transparent",
  };
}

const cssVar = (key: string) => `--k-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/** Every palette, font pairing and line-color mode as attribute-scoped custom properties. */
export function buildStudioCss() {
  const paletteCss = palettes
    .map((p) => {
      const decls = tokenKeys.map((k) => `${cssVar(k)}:${p.tokens[k]}`);
      for (const [k, v] of Object.entries(derivedTokens(p.tokens))) decls.push(`${cssVar(k)}:${v}`);
      return `html[data-palette="${p.id}"]{${decls.join(";")}}`;
    })
    .join("\n");
  const fontCss = fontPairings
    .map(
      (f) =>
        `html[data-font="${f.id}"]{--k-font-display:var(${f.display});--k-font-body:var(${f.body});--k-font-mono:var(${f.mono});--k-display-tracking:${f.displayTracking};--k-display-weight:${f.displayWeight}}`,
    )
    .join("\n");
  // Route colors per platform: ink (default), true brand color, or palette tints.
  const tints = ["var(--k-pop1)", "var(--k-pop2)", "var(--k-pop3)", "var(--k-accent)"];
  const lineCss = [
    `html{${platforms.map((p) => `--line-${p.id}:var(--k-ink)`).join(";")}}`,
    `html[data-line-color="brand"]{${platforms.map((p) => `--line-${p.id}:${p.color}`).join(";")}}`,
    `html[data-line-color="tints"]{${platforms
      .map((p, i) => `--line-${p.id}:color-mix(in oklab, ${tints[i % tints.length]} ${i < 4 ? 88 : 62}%, var(--k-ink))`)
      .join(";")}}`,
  ].join("\n");
  return `${paletteCss}\n${fontCss}\n${lineCss}`;
}

/**
 * Runs before first paint: restores the saved or shared look so the page never
 * flashes the default palette. Kept dependency-free on purpose.
 */
export function buildBootScript() {
  const config = {
    key: STORAGE_KEY,
    param: URL_PARAM,
    palettes: paletteIds,
    fonts: fontIds,
    opts: optionKeys.map((k) => [k, attrName(k), lookOptions[k]]),
  };
  return `document.documentElement.classList.add("js");(function(){try{var c=${JSON.stringify(config)};var l=null;var q=new URLSearchParams(location.search).get(c.param);if(q){var p=q.split(".");l={palette:p[0],font:p[1]};c.opts.forEach(function(o,i){l[o[0]]=p[i+2]});var a=p[c.opts.length+2];l.accent=a?"#"+a:null;}else{var s=localStorage.getItem(c.key);if(s)l=JSON.parse(s);}if(!l)return;var h=document.documentElement;if(c.palettes.indexOf(l.palette)>-1)h.setAttribute("data-palette",l.palette);if(c.fonts.indexOf(l.font)>-1)h.setAttribute("data-font",l.font);c.opts.forEach(function(o){if(o[2].indexOf(l[o[0]])>-1)h.setAttribute(o[1],l[o[0]])});if(l.accent&&/^#[0-9a-f]{6}$/i.test(l.accent)){var n=parseInt(l.accent.slice(1),16);function ch(x){x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)}var L=0.2126*ch(n>>16&255)+0.7152*ch(n>>8&255)+0.0722*ch(n&255);h.style.setProperty("--k-accent",l.accent);h.style.setProperty("--k-accent-ink",(L+0.05)/0.0556>=1.05/(L+0.05)?"#111111":"#FFFFFF");h.style.setProperty("--k-accent-text","color-mix(in oklab, "+l.accent+" 60%, var(--k-ink))");}}catch(e){}})();`;
}
