"use client";

import { useRef, useState } from "react";
import { Download, FileIcon, Film, ImageIcon, Loader2, Music } from "lucide-react";

import { proxiedEmailSrc } from "@/lib/email-media";
import type { ChatMessage } from "@/lib/mock";
import { cn } from "@/lib/utils";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|bmp)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm)(\?|$)/i;
const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg)(\?|$)/i;
const URL_SPLIT = /(https?:\/\/[^\s<]+)/g;

export function inferMediaKind(contentType?: string, mediaUrl?: string) {
  const type = (contentType || "text").toLowerCase();
  const url = mediaUrl || "";

  if (url) {
    if (VIDEO_EXT.test(url)) return "video";
    if (AUDIO_EXT.test(url)) return "audio";
    if (IMAGE_EXT.test(url)) return "image";
    if (/\.(pdf|docx?|xlsx?|csv|zip)(\?|$)/i.test(url)) return "file";
    if (/fbcdn|cdninstagram|instagram|scontent/i.test(url)) {
      return /video|\.mp4/i.test(url) && !/t51\.2885-15/i.test(url) ? "video" : "image";
    }
  }

  if (["image", "sticker", "gif", "photo", "share"].includes(type)) return "image";
  if (type === "video" || type === "reel") return "video";
  if (type === "audio" || type === "voice") return "audio";
  if (type === "file" || type === "attachment") return "file";
  if (type === "text" && url) return "image";
  return type;
}

function isPlaceholderBody(text: string) {
  if (!text) return true;
  return /^\[[\w_]+\]$/i.test(text.trim());
}

export function formatEmailPlain(text: string) {
  return (text || "")
    .replace(/\[image:[^\]]*\]/gi, "")
    .replace(/<((?:https?|mailto):[^>\s]+)>/gi, "$1")
    .replace(/To view this content[^\n]*/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortLinkLabel(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (url.length <= 42) return url;
    return host;
  } catch {
    return url.length > 42 ? `${url.slice(0, 36)}…` : url;
  }
}

function EmailPlain({ text, className }: { text: string; className?: string }) {
  const cleaned = formatEmailPlain(text);
  const parts = cleaned.split(URL_SPLIT);
  return (
    <p className={cn("max-w-full overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere]", className)}>
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            title={part}
            className="break-all underline underline-offset-2"
          >
            {shortLinkLabel(part)}
          </a>
        ) : (
          <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
        ),
      )}
    </p>
  );
}

function EmailHtml({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><base target="_blank"/><style>
    html,body{margin:0;padding:0;background:#fff;color:#202124;font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow-x:hidden;word-break:break-word;overflow-wrap:anywhere}
    img{max-width:100% !important;height:auto !important;border:0;display:block}
    a{color:#1a73e8;overflow-wrap:anywhere;word-break:break-word}
    table{border-collapse:collapse;max-width:100% !important}
    td,th{vertical-align:top}
  </style></head><body>${html}</body></html>`;

  function fitFrame() {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc?.body) return;
    frame.style.height = `${Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 120) + 12}px`;
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <iframe
        ref={frameRef}
        title="Email"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        className="block w-full max-w-full border-0 bg-white"
        style={{ minHeight: 160, width: "100%" }}
        onLoad={() => {
          fitFrame();
          const doc = frameRef.current?.contentDocument;
          doc?.querySelectorAll("img").forEach((img) => {
            img.addEventListener("load", fitFrame);
            img.addEventListener("error", () => {
              if (img.dataset.proxied) {
                fitFrame();
                return;
              }
              img.dataset.proxied = "1";
              img.src = proxiedEmailSrc(img.getAttribute("src") || "");
              fitFrame();
            });
          });
        }}
      />
    </div>
  );
}

export function messagePreview(
  message: Pick<ChatMessage, "text" | "contentType" | "mediaUrl" | "subject" | "htmlBody">,
) {
  const kind = inferMediaKind(message.contentType, message.mediaUrl);
  if (message.mediaUrl || isPlaceholderBody(message.text)) {
    if (kind === "image") return "📷 Photo";
    if (kind === "video") return "🎬 Video";
    if (kind === "audio") return "🎵 Audio";
    if (kind !== "text") return "📎 Attachment";
  }
  const text = formatEmailPlain(message.text || "").trim();
  if (text.startsWith("[") && text.endsWith("]") && text.length < 24) {
    return messagePreview({ text: "", contentType: text.slice(1, -1), mediaUrl: message.mediaUrl });
  }
  if (message.subject && text && !text.toLowerCase().startsWith(message.subject.toLowerCase())) {
    return `${message.subject} — ${text}`;
  }
  return text || message.subject || message.text;
}

export function MessageContent({
  message,
  className,
  onLoaded,
  isEmail,
}: {
  message: Pick<ChatMessage, "text" | "contentType" | "mediaUrl" | "status" | "subject" | "htmlBody">;
  className?: string;
  onLoaded?: () => void;
  isEmail?: boolean;
}) {
  const kind = inferMediaKind(message.contentType, message.mediaUrl);
  const showText = Boolean(message.text && !isPlaceholderBody(message.text));
  const busy = message.status === "uploading" || message.status === "sending";
  const [open, setOpen] = useState(false);

  if (isEmail && (message.htmlBody || message.subject || showText) && !message.mediaUrl) {
    return (
      <div className={cn("w-full min-w-0 max-w-full overflow-x-hidden space-y-3", className)}>
        {message.htmlBody ? <EmailHtml html={message.htmlBody} /> : <EmailPlain text={message.text} />}
      </div>
    );
  }

  if (message.mediaUrl && (kind === "image" || kind === "sticker" || kind === "gif")) {
    return (
      <div className={cn("space-y-2", className)}>
        <button
          type="button"
          className="relative block overflow-hidden rounded-2xl"
          onClick={() => setOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.mediaUrl}
            alt={showText ? message.text : "Shared photo"}
            className="max-h-72 max-w-[min(18rem,70vw)] rounded-2xl object-cover"
            loading="lazy"
            onLoad={onLoaded}
          />
          {busy ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </span>
          ) : null}
        </button>
        {showText ? (
          isEmail ? (
            <EmailPlain text={message.text} />
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )
        ) : null}
        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            onClick={() => setOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.mediaUrl} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
          </button>
        ) : null}
      </div>
    );
  }

  if (message.mediaUrl && kind === "video") {
    return (
      <div className={cn("relative space-y-2", className)}>
        <video
          src={message.mediaUrl}
          controls
          className="max-h-72 max-w-[min(18rem,70vw)] rounded-2xl"
          onLoadedData={onLoaded}
        />
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </span>
        ) : null}
        {showText ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
      </div>
    );
  }

  if (message.mediaUrl && kind === "audio") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Music className="h-4 w-4" />
          Audio
        </div>
        <audio src={message.mediaUrl} controls className="max-w-full" onLoadedData={onLoaded} />
        {showText ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
      </div>
    );
  }

  if (message.mediaUrl) {
    return (
      <div className={cn("space-y-2", className)}>
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white/40 px-3 py-2 text-sm"
        >
          <FileIcon className="h-4 w-4" />
          Open file
          <Download className="h-3.5 w-3.5 opacity-70" />
        </a>
        {showText ? (
          isEmail ? (
            <EmailPlain text={message.text} />
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )
        ) : null}
      </div>
    );
  }

  if (isPlaceholderBody(message.text) && kind !== "text" && !message.mediaUrl) {
    const Icon = kind === "video" ? Film : kind === "audio" ? Music : ImageIcon;
    return (
      <p className={cn("inline-flex items-center gap-2 text-sm opacity-80", className)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        {kind === "image" ? "Photo" : kind === "video" ? "Video" : kind === "audio" ? "Audio" : "Attachment"}
      </p>
    );
  }

  if (isEmail) {
    return <EmailPlain text={message.text} className={className} />;
  }

  return <p className={cn("whitespace-pre-wrap break-words", className)}>{message.text}</p>;
}
