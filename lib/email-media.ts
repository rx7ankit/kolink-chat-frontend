import { API_URL } from "@/lib/api/url";

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export function rewriteEmailHtml(html: string) {
  if (!html) return html;
  return html.replace(
    /\b(src|background)\s*=\s*(["'])([^"']+)\2/gi,
    (_full, attr: string, quote: string, raw: string) => {
      const next = proxiedEmailSrc(raw);
      return `${attr}=${quote}${next}${quote}`;
    },
  );
}

export function proxiedEmailSrc(raw: string) {
  const src = (raw || "").trim();
  if (!src || src.startsWith("data:") || src.toLowerCase().startsWith("cid:")) return src;
  if (src.includes("/api/email-media?")) return src;

  let absolute = src;
  if (src.startsWith("//")) absolute = `https:${src}`;
  else if (src.startsWith("/")) absolute = `${API_ORIGIN}${src}`;
  else if (!/^https?:\/\//i.test(src)) return src;

  try {
    const parsed = new URL(absolute);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return src;
    return `/api/email-media?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return src;
  }
}
