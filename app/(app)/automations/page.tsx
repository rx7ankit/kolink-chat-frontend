"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Loader2, MoreHorizontal, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { PostPicker } from "@/components/ig-automations/post-picker";
import { PostThumb } from "@/components/ig-automations/post-thumb";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  deleteIgAutomation,
  duplicateIgAutomation,
  isReel,
  listIgAutomations,
  updateIgAutomation,
  type IgAutomation,
  type IgMediaItem,
} from "@/lib/api/ig-automations";
import { useI18n } from "@/lib/i18n/provider";

function postedLabel(row: IgAutomation) {
  const value = row.posted_at || row.created_at;
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AutomationsPage() {
  return (
    <Suspense fallback={<p className="page-shell text-sm text-muted-foreground">Loading…</p>}>
      <AutomationsPageInner />
    </Suspense>
  );
}

function AutomationsPageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<IgAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<IgAutomation | null>(null);
  const [duplicateMedia, setDuplicateMedia] = useState<IgMediaItem | null>(null);
  const [deleting, setDeleting] = useState<IgAutomation | null>(null);
  const [promptCreate, setPromptCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPromptCreate(searchParams.get("create") === "1");
  }, [searchParams]);

  useEffect(() => {
    void listIgAutomations()
      .then(setRows)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load automations"))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(row: IgAutomation, enabled: boolean) {
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, enabled } : item)));
    try {
      await updateIgAutomation(row.id, { enabled });
      toast.success(enabled ? "Automation turned on" : "Automation turned off");
    } catch (error) {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, enabled: !enabled } : item)));
      toast.error(error instanceof ApiError ? error.detail : "Could not update");
    }
  }

  async function confirmDuplicate() {
    if (!duplicating || !duplicateMedia) return;
    setBusy(true);
    try {
      const created = await duplicateIgAutomation(duplicating.id, duplicateMedia.id);
      toast.success("Automation copied to the new post");
      setDuplicating(null);
      setDuplicateMedia(null);
      router.push(`/automations/ig/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not duplicate");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteIgAutomation(deleting.id);
      setRows((current) => current.filter((item) => item.id !== deleting.id));
      toast.success("Automation deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={t("automations.title")}
        description="Instagram comment automations, newest post first"
        actions={
          <Button asChild>
            <Link href="/automations/new">
              <Plus className="mr-1 h-4 w-4" /> New automation
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !rows.length ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
          <p className="font-medium">No automations yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Pick a post or reel, choose trigger keywords, and koLink replies to the comment and DMs each commenter
            what you promised.
          </p>
          <Button asChild>
            <Link href="/automations/new">Set up your first automation</Link>
          </Button>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Keywords</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Results</th>
                <th className="px-4 py-3 font-medium">On</th>
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-white/40">
                  <td className="px-4 py-3">
                    <Link href={`/automations/ig/${row.id}`} className="flex items-center gap-3">
                      <PostThumb src={row.thumbnail_url} reel={isReel(row)} className="h-14 w-14" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium hover:text-primary">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{postedLabel(row)}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="rose">{isReel(row) ? "Reel" : "Post"}</Badge>
                          {row.follow_required ? (
                            <Badge variant="sky" className="gap-1">
                              <UserCheck className="h-3 w-3" /> Followers only
                            </Badge>
                          ) : null}
                          {row.from_broadcast ? <Badge variant="muted">koLink broadcast</Badge> : null}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {row.keywords.slice(0, 4).map((keyword) => (
                        <Badge key={keyword} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                      {row.keywords.length > 4 ? (
                        <Badge variant="muted">+{row.keywords.length - 4}</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    <p>
                      <span className="font-medium text-foreground">{row.stats.matched}</span> matched ·{" "}
                      <span className="font-medium text-foreground">{row.stats.delivered}</span> delivered
                    </p>
                    {row.stats.waiting_follow ? <p>{row.stats.waiting_follow} waiting to follow</p> : null}
                    {row.stats.failed ? <p className="text-destructive">{row.stats.failed} failed</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={row.enabled} onCheckedChange={(value) => void toggle(row, value)} />
                  </td>
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/automations/ig/${row.id}`}>Open</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setDuplicating(row)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate to another post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(row)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!duplicating}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicating(null);
            setDuplicateMedia(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[90svh] max-w-4xl flex-col overflow-hidden p-0">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-6 pb-3 pt-6 pr-14">
            <DialogHeader className="space-y-1.5">
              <DialogTitle>Duplicate to another post</DialogTitle>
              <DialogDescription>
                Same keywords, follow check, and messages — pick the post or reel for the copy.
              </DialogDescription>
            </DialogHeader>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" onClick={() => setDuplicating(null)}>
                Cancel
              </Button>
              <Button disabled={!duplicateMedia || busy} onClick={() => void confirmDuplicate()}>
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Duplicate
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {duplicating ? (
              <PostPicker
                selectedId={duplicateMedia?.id ?? null}
                onSelect={setDuplicateMedia}
                disabledIds={[duplicating.media_id]}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={promptCreate}
        onOpenChange={(open) => {
          setPromptCreate(open);
          if (!open) router.replace("/automations");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a comment automation</DialogTitle>
            <DialogDescription>
              Instagram comment automations reply to matching comments and DM the commenter. Pick a post or reel, set
              keywords, and follow the same setup as New automation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.replace("/automations")}>
              Not now
            </Button>
            <Button asChild>
              <Link href="/automations/new">Set up automation</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete automation?</DialogTitle>
            <DialogDescription>
              New comments on “{deleting?.name}” will no longer get replies or DMs. Its activity history is removed
              too.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
