"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, MessageCircle, Radio } from "lucide-react";

import { PostThumb } from "@/components/ig-automations/post-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { isReel, listIgMedia, type IgMediaItem } from "@/lib/api/ig-automations";
import { cn } from "@/lib/utils";

type Filter = "all" | "reels" | "posts";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PostPicker({
  selectedId,
  onSelect,
  disabledIds = [],
}: {
  selectedId: string | null;
  onSelect: (item: IgMediaItem) => void;
  /** Extra media ids to block (e.g. the source post when duplicating). */
  disabledIds?: string[];
}) {
  const [items, setItems] = useState<IgMediaItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchPage = useCallback((after: string | null) => {
    return listIgMedia(after)
      .then((page) => {
        setItems((current) => (after ? [...current, ...page.items] : page.items));
        setNext(page.next);
      })
      .catch((err) => setError(err instanceof ApiError ? err.detail : "Could not load your Instagram posts"))
      .finally(() => setLoading(false));
  }, []);

  function load(after: string | null) {
    setLoading(true);
    setError(null);
    void fetchPage(after);
  }

  useEffect(() => {
    void fetchPage(null);
  }, [fetchPage]);

  const visible = useMemo(
    () =>
      items.filter((item) => (filter === "all" ? true : filter === "reels" ? isReel(item) : !isReel(item))),
    [filter, items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border bg-white/60 p-1 text-sm">
          {(["all", "reels", "posts"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-lg px-3 py-1 capitalize transition",
                filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Stories and lives can’t have comment automations.</p>
      </div>

      {error ? (
        <div className="glass rounded-2xl p-6 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => void load(null)}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((item) => {
          const taken = Boolean(item.automation_id) || disabledIds.includes(item.id);
          const selected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={taken}
              onClick={() => onSelect(item)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white/70 text-left transition",
                selected ? "ring-2 ring-primary" : "hover:-translate-y-0.5 hover:shadow-md",
                taken && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none",
              )}
            >
              <PostThumb src={item.preview_url} reel={isReel(item)} className="aspect-square w-full rounded-none" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-8">
                <p className="line-clamp-1 text-[11px] font-medium text-white">{item.caption || "No caption"}</p>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/80">
                  <span>{formatDate(item.timestamp)}</span>
                  {item.comments_count != null ? (
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {item.comments_count}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {item.automation_id ? <Badge variant="muted">Has automation</Badge> : null}
                {item.broadcast_id ? (
                  <Badge variant="sky" className="gap-1">
                    <Radio className="h-3 w-3" /> koLink
                  </Badge>
                ) : null}
              </div>
              {selected ? (
                <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
      {!loading && !error && !visible.length ? (
        <p className="glass rounded-2xl p-6 text-sm text-muted-foreground">
          No {filter === "all" ? "posts or reels" : filter} found on this Instagram account yet.
        </p>
      ) : null}
      {next && !loading ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void load(next)}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
