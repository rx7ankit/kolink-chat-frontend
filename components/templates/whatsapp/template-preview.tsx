"use client";

import { ExternalLink, Phone, Reply } from "lucide-react";

import type { TemplateButton } from "@/lib/api/whatsapp-templates";
import { cn } from "@/lib/utils";

export type PreviewData = {
  header?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  samples?: string[];
};

/** Swap {{1}} placeholders for sample values so the bubble reads like a real message. */
export function fillVariables(text: string, samples: string[] = []) {
  return text.replace(/\{\{(\d+)\}\}/g, (match, index: string) => {
    const sample = samples[Number(index) - 1];
    return sample ? sample : match;
  });
}

function ButtonIcon({ type }: { type?: string }) {
  const kind = (type || "").toUpperCase();
  if (kind === "URL") return <ExternalLink className="h-3.5 w-3.5" />;
  if (kind === "PHONE_NUMBER" || kind === "VOICE_CALL") return <Phone className="h-3.5 w-3.5" />;
  return <Reply className="h-3.5 w-3.5" />;
}

export function TemplatePreview({
  data,
  className,
  title = "Template preview",
  compact = false,
}: {
  data: PreviewData;
  className?: string;
  title?: string;
  compact?: boolean;
}) {
  const body = fillVariables(data.body || "", data.samples);
  const header = fillVariables(data.header || "", data.samples);
  const buttons = data.buttons?.filter((button) => (button.text || "").trim()) ?? [];

  return (
    <div className={cn(!compact && "glass rounded-2xl p-5", className)}>
      {title && !compact ? <p className="text-sm font-medium">{title}</p> : null}
      <div className={cn("rounded-2xl bg-[#e9e3db]/70 p-3", !compact && "mt-4 p-4")}>
        <div className="max-w-[19rem] rounded-2xl rounded-tl-sm bg-white/95 p-3 shadow-sm">
          {header ? <p className="text-sm font-semibold leading-snug">{header}</p> : null}
          {body ? (
            <p className={cn("whitespace-pre-wrap text-sm leading-snug", header && "mt-2")}>{body}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Your message body appears here.</p>
          )}
          {data.footer ? (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{data.footer}</p>
          ) : null}
          <p className="mt-1.5 text-right text-[10px] text-muted-foreground">09:15</p>

          {buttons.length ? (
            <div className="-mx-3 mt-1 border-t border-black/5">
              {buttons.map((button, index) => (
                <div
                  key={`${button.text}-${index}`}
                  className="flex items-center justify-center gap-1.5 border-b border-black/5 py-2 text-sm font-medium text-[#0a7cff] last:border-b-0"
                >
                  <ButtonIcon type={button.type} />
                  {button.text}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
