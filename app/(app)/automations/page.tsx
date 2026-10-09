"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, MoreHorizontal, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { PostPicker } from "@/components/ig-automations/post-picker";
import { PostThumb } from "@/components/ig-automations/post-thumb";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AUTOMATION_PLATFORMS,
  KIND_BADGE,
  KIND_LABELS,
  isAutomationKind,
  isAutomationPlatform,
  newAutomationHref,
  platformLabel,
  type AutomationPlatform,
} from "@/lib/comment-automations";
import { useI18n } from "@/lib/i18n/provider";
import { useWorkspaceId } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";

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
  const tabParam = searchParams.get("platform");
  const tab: AutomationPlatform = isAutomationPlatform(tabParam) ? tabParam : "instagram";
  const ws = useWorkspaceId();
  const queryClient = useQueryClient();
  const listKey = queryKeys.igAutomations(ws, tab);
  const { data: rows = [], isPending: loading, error } = useQuery({
    queryKey: listKey,
    queryFn: () => listIgAutomations(tab),
    enabled: Boolean(ws),
  });
  const [duplicating, setDuplicating] = useState<IgAutomation | null>(null);
  const [duplicateMedia, setDuplicateMedia] = useState<IgMediaItem | null>(null);
  const [deleting, setDeleting] = useState<IgAutomation | null>(null);
  const [promptCreate, setPromptCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const createHref = newAutomationHref({ platform: tab });

  useEffect(() => {
    setPromptCreate(searchParams.get("create") === "1");
  }, [searchParams]);

  useEffect(() => {
    if (!error) return;
    toast.error(error instanceof ApiError ? error.detail : "Failed to load automations");
  }, [error]);

  async function toggle(row: IgAutomation, enabled: boolean) {
    queryClient.setQueryData<IgAutomation[]>(listKey, (current) =>
      (current ?? []).map((item) => (item.id === row.id ? { ...item, enabled } : item)),
    );
    try {
      await updateIgAutomation(row.id, { enabled });
      toast.success(enabled ? "Automation turned on" : "Automation turned off");
    } catch (error) {
      queryClient.setQueryData<IgAutomation[]>(listKey, (current) =>
        (current ?? []).map((item) => (item.id === row.id ? { ...item, enabled: !enabled } : item)),
      );
      toast.error(error instanceof ApiError ? error.detail : "Could not update");
    }
  }

  async function confirmDuplicate() {
    if (!duplicating || !duplicateMedia) return;
    setBusy(true);
    try {
      const created = await duplicateIgAutomation(duplicating.id, duplicateMedia.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.igAutomations(ws, tab) });
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
      await queryClient.invalidateQueries({ queryKey: listKey });
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
        description={`${platformLabel(tab)} comment automations, newest post first`}
        actions={
          <Button asChild>
            <Link href={createHref}>
              <Plus className="mr-1 h-4 w-4" /> New automation
            </Link>
          </Button>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isAutomationPlatform(value)) router.replace(`/automations?platform=${value}`);
        }}
        className="mb-4"
      >
        <TabsList>
          {AUTOMATION_PLATFORMS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !rows.length ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
          <p className="font-medium">No automations yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Pick a post, choose trigger keywords, and koLink can reply, DM, or delete matching comments on{" "}
            {platformLabel(tab)}.
          </p>
          <Button asChild>
            <Link href={createHref}>Set up your first automation</Link>
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
                          <Badge variant={KIND_BADGE[isAutomationKind(row.kind) ? row.kind : "keyword_dm"]}>
                            {KIND_LABELS[isAutomationKind(row.kind) ? row.kind : "keyword_dm"]}
                          </Badge>
                          <Badge variant="rose">{isReel(row) ? "Reel" : "Post"}</Badge>
                          {(row.kind || "keyword_dm") === "keyword_dm" && row.follow_required ? (
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
                      <span className="font-medium text-foreground">{row.stats.matched}</span> matched
                      {row.kind === "keyword_delete" ? (
                        <>
                          {" · "}
                          <span className="font-medium text-foreground">{row.stats.deleted ?? 0}</span> deleted
                        </>
                      ) : row.kind === "keyword_reply" ? (
                        <>
                          {" · "}
                          <span className="font-medium text-foreground">{row.stats.comment_replies}</span> replies
                        </>
                      ) : (
                        <>
                          {" · "}
                          <span className="font-medium text-foreground">{row.stats.delivered}</span> delivered
                        </>
                      )}
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
                platform={duplicating.platform || tab}
                kind={duplicating.kind}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={promptCreate}
        onOpenChange={(open) => {
          setPromptCreate(open);
          if (!open) router.replace(`/automations?platform=${tab}`);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a comment automation</DialogTitle>
            <DialogDescription>
              Choose an automation type for {platformLabel(tab)}, pick a post, and set trigger keywords.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.replace(`/automations?platform=${tab}`)}>
              Not now
            </Button>
            <Button asChild>
              <Link href={createHref}>Set up automation</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete automation?</DialogTitle>
            <DialogDescription>
              Matching comments on “{deleting?.name}” will stop triggering this automation. You can create the same
              type again on that post. Its activity history is removed too.
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
