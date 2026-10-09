"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PostThumb } from "@/components/ig-automations/post-thumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importNativePost,
  listImportablePosts,
  type ImportablePlatform,
  type ImportablePost,
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const LABELS: Record<ImportablePlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ImportPostDialog({
  open,
  platform,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  platform: ImportablePlatform;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ImportablePost[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ImportablePost | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchPage = useCallback(
    (after: string | null) => {
      return listImportablePosts(platform, after)
        .then((page) => {
          setItems((current) => (after ? [...current, ...page.items] : page.items));
          setNext(page.next);
        })
        .catch((err) => setError(err instanceof ApiError ? err.detail : "Could not load posts from this account"))
        .finally(() => setLoading(false));
    },
    [platform],
  );

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setNext(null);
    setSelected(null);
    setError(null);
    setLoading(true);
    void fetchPage(null);
  }, [open, fetchPage]);

  async function importSelected() {
    if (!selected) return;
    setBusy(true);
    try {
      const row = await importNativePost(platform, selected.id);
      toast.success("Post imported into Broadcasts");
      onOpenChange(false);
      onImported?.();
      router.push(`/broadcasts/${row.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not import that post");
    } finally {
      setBusy(false);
    }
  }

  const label = LABELS[platform];

  return (
    <Dialog open={open} onOpenChange={(value) => !busy && onOpenChange(value)}>
      <DialogContent className="flex max-h-[90svh] max-w-4xl flex-col overflow-hidden p-0">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-6 pb-3 pt-6 pr-14">
          <DialogHeader className="space-y-1.5">
            <DialogTitle>Import a {label} post</DialogTitle>
            <DialogDescription>
              Posts already listed in Broadcasts are hidden. Importing does not republish — it just adds the native post
              so you can manage comments and automations here.
            </DialogDescription>
          </DialogHeader>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button disabled={!selected || busy} onClick={() => void importSelected()}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Import post
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">

        {error ? (
          <div className="rounded-2xl border bg-white/70 p-4 text-sm text-destructive">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => {
                setError(null);
                setLoading(true);
                void fetchPage(null);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const isSelected = selected?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white/70 text-left transition",
                  isSelected ? "ring-2 ring-primary" : "hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <PostThumb
                  src={item.thumbnail_url}
                  reel={item.post_type === "reel"}
                  className="aspect-square w-full rounded-none"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-8">
                  <p className="line-clamp-1 text-[11px] font-medium text-white">{item.caption || "No caption"}</p>
                  <p className="mt-0.5 text-[10px] text-white/80">{formatDate(item.posted_at)}</p>
                </div>
                {isSelected ? (
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
        {!loading && !error && !items.length ? (
          <p className="rounded-2xl border bg-white/70 p-6 text-sm text-muted-foreground">
            No {label} posts left to import. Native posts already in Broadcasts stay hidden here.
          </p>
        ) : null}
        {next && !loading ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                void fetchPage(next);
              }}
            >
              Load more
            </Button>
          </div>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
