"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function CollapsibleCaption({
  text,
  prefix,
  lines = 2,
  className,
  moreLabel = "more",
  lessLabel = "less",
}: {
  text: string;
  prefix?: ReactNode;
  lines?: 2 | 3 | 4;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const value = (text || "").trim() || "No caption";
  const clamp =
    lines === 4 ? "line-clamp-4" : lines === 3 ? "line-clamp-3" : "line-clamp-2";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, prefix, expanded, lines]);

  return (
    <div className={cn("min-w-0", className)}>
      <p
        ref={ref}
        className={cn("whitespace-pre-wrap break-words", !expanded && clamp)}
      >
        {prefix}
        {value}
      </p>
      {overflows || expanded ? (
        <button
          type="button"
          className="mt-0.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  );
}
