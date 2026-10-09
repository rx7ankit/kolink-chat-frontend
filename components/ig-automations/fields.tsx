"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Plus, Type, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadInboxFile } from "@/lib/api/inbox";
import type { IgResponse } from "@/lib/api/ig-automations";
import { publicMediaUrl } from "@/lib/broadcast-media";
import {
  MAX_KEYWORD_LENGTH,
  MAX_KEYWORDS,
  MAX_VARIATIONS,
  MIN_KEYWORDS,
  matchKeyword,
  shortKeywords,
} from "@/lib/ig-keywords";
import { cn } from "@/lib/utils";

export function KeywordInput({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [sample, setSample] = useState("");
  const full = value.length >= MAX_KEYWORDS;

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((part) => part.trim().slice(0, MAX_KEYWORD_LENGTH))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      if (next.length >= MAX_KEYWORDS) break;
      if (!next.includes(part)) next.push(part);
    }
    onChange(next);
    setDraft("");
  }

  const short = shortKeywords(value);
  const matched = sample.trim() ? matchKeyword(sample, value) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white/60 p-2">
        {value.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-sm text-primary"
          >
            {keyword}
            <button
              type="button"
              aria-label={`Remove ${keyword}`}
              className="rounded-full p-0.5 hover:bg-primary/15"
              onClick={() => onChange(value.filter((item) => item !== keyword))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          disabled={full}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          placeholder={full ? "Maximum reached" : "Type a keyword and press Enter"}
          className="min-w-[180px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_KEYWORDS} · at least {MIN_KEYWORDS} variations (e.g. link, linkk, LINK, 🔗). Matching
        ignores case, spaces, and punctuation. Keywords of 3+ characters still match inside a comment
        (“linkplease” triggers “link”). Shorter ones only match that exact comment, so “hi” will not fire on
        “this” or “his”.
      </p>
      {short.length ? (
        <p className="text-xs text-amber-700">
          {short.map((word) => `“${word}”`).join(", ")} only match that exact comment, not inside other words.
          Add extra variations if you want those too.
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Try a comment</Label>
        <div className="flex items-center gap-2">
          <Input value={sample} onChange={(event) => setSample(event.target.value)} placeholder="e.g. linkplease 🙏" />
          {sample.trim() ? (
            <Badge variant={matched ? "mint" : "muted"} className="shrink-0">
              {matched ? `Triggers “${matched}”` : "No match"}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function VariationsInput({
  value,
  onChange,
  placeholder,
  max = MAX_VARIATIONS,
  addLabel = "Add variation",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  max?: number;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <Textarea
            value={item}
            rows={2}
            maxLength={300}
            placeholder={placeholder}
            onChange={(event) => onChange(value.map((v, i) => (i === index ? event.target.value : v)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove variation"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {value.length < max ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
          <Plus className="mr-1 h-4 w-4" />
          {addLabel}
        </Button>
      ) : null}
      {value.length > 1 ? (
        <p className="text-xs text-muted-foreground">One variation is picked at random each time.</p>
      ) : null}
    </div>
  );
}

export function ResponseEditor({ value, onChange }: { value: IgResponse; onChange: (next: IgResponse) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLink, setShowLink] = useState(Boolean(value.link_url));

  async function upload(file: File) {
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
    if (!kind) {
      toast.error("Choose an image or a video");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadInboxFile(file);
      onChange({ ...value, media_url: uploaded.url, media_type: kind });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const mediaSrc = publicMediaUrl(value.media_url);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" /> Message
        </Label>
        <Textarea
          rows={3}
          maxLength={1000}
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          placeholder="Here's the guide I mentioned in the reel 🎁"
        />
      </div>

      {showLink ? (
        <div className="grid gap-3 rounded-xl border bg-white/50 p-3 sm:grid-cols-[1fr_160px]">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Link
            </Label>
            <Input
              value={value.link_url ?? ""}
              onChange={(event) => onChange({ ...value, link_url: event.target.value || null })}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Button label</Label>
            <Input
              value={value.link_title}
              maxLength={20}
              onChange={(event) => onChange({ ...value, link_title: event.target.value })}
              placeholder="Open link"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={() => {
              setShowLink(false);
              onChange({ ...value, link_url: null });
            }}
          >
            Remove link
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowLink(true)}>
          <Link2 className="mr-1 h-4 w-4" /> Add link
        </Button>
      )}

      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
        {value.media_url ? (
          <div className="flex items-center gap-3 rounded-xl border bg-white/50 p-2">
            {value.media_type === "video" ? (
              <video src={mediaSrc} className="h-16 w-16 rounded-lg bg-black object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaSrc} alt="" className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium capitalize">{value.media_type}</p>
              <p className="truncate text-xs text-muted-foreground">Sent before the message</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...value, media_url: null, media_type: null })}
            >
              Remove
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
            Add image or video
          </Button>
        )}
      </div>
    </div>
  );
}

export function responseProblems(value: IgResponse): string[] {
  const problems: string[] = [];
  if (!value.text.trim() && !value.link_url && !value.media_url) {
    problems.push("Add a message, a link, or media to send");
  }
  if (value.link_url && !/^https?:\/\//i.test(value.link_url.trim())) {
    problems.push("Links must start with http:// or https://");
  }
  return problems;
}

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}
