"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { ImportPostDialog } from "@/components/broadcasts/import-post-dialog";
import { BroadcastListPreview, listingPlatform } from "@/components/broadcasts/list-preview";
import { PlatformStatusList } from "@/components/broadcasts/platform-status";
import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { TablePagination, usePagination } from "@/components/table-pagination";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteBroadcast,
  duplicateBroadcast,
  isDeletedBroadcast,
  isLiveSocialBroadcast,
  liveDeleteCopy,
  listBroadcasts,
  toUiBroadcast,
  type ImportablePlatform,
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";
import type { Broadcast } from "@/lib/mock";
import { PUBLISH_PLATFORMS, asChannelId, overallBadgeVariant, statusLabel, type PublishPlatformId } from "@/lib/publish";
import { formatRelativeTime } from "@/lib/utils";

type BroadcastTab = "all" | "unpublished" | PublishPlatformId;

function isImportableTab(tab: BroadcastTab): tab is ImportablePlatform {
  return tab === "instagram" || tab === "facebook" || tab === "threads";
}

const TABS: { id: BroadcastTab; label: string }[] = [
  { id: "all", label: "All" },
  ...PUBLISH_PLATFORMS.map((item) => ({
    id: item.id,
    label: item.id === "x" ? "X" : item.label.replace(" Page", ""),
  })),
  { id: "unpublished", label: "Unpublished" },
];

function isUnpublishedListing(item: Broadcast) {
  if (item.status === "deleted") return true;
  const platform = listingPlatform(item);
  return item.platformStatuses?.[platform]?.status === "deleted";
}

function metricsLabel(item: Broadcast) {
  if (item.postMode === "audience_dm") {
    return item.sent ? `${item.delivered}/${item.sent} delivered` : "—";
  }
  const platform = listingPlatform(item);
  const bucket = item.metrics?.[platform] || {};
  const likes = bucket.likes || 0;
  const comments = bucket.comments || 0;
  const shares = bucket.shares || 0;
  if (!likes && !comments && !shares) return "—";
  return `${likes} likes · ${comments} comments · ${shares} shares`;
}

export default function BroadcastsPage() {
  return (
    <Suspense fallback={<p className="page-shell text-sm text-muted-foreground">Loading…</p>}>
      <BroadcastsPageInner />
    </Suspense>
  );
}

function BroadcastsPageInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Broadcast[]>([]);
  const [tab, setTab] = useState<BroadcastTab>("all");
  const [pendingDelete, setPendingDelete] = useState<Broadcast | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const liveRows = useMemo(() => rows.filter((row) => !isUnpublishedListing(row)), [rows]);
  const unpublishedRows = useMemo(() => rows.filter(isUnpublishedListing), [rows]);

  const listings = useMemo(() => {
    if (tab === "unpublished") return unpublishedRows;
    if (tab === "all") return liveRows;
    return liveRows.filter((row) => listingPlatform(row) === tab);
  }, [liveRows, unpublishedRows, tab]);

  const pager = usePagination(listings, 6);

  useEffect(() => {
    pager.setPage(1);
    setImportOpen(false);
  }, [tab, pager.setPage]);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: liveRows.length, unpublished: unpublishedRows.length };
    for (const item of PUBLISH_PLATFORMS) next[item.id] = 0;
    for (const row of liveRows) {
      const platform = listingPlatform(row);
      next[platform] = (next[platform] || 0) + 1;
    }
    return next;
  }, [liveRows, unpublishedRows]);

  const reload = useCallback(async () => {
    try {
      setRows(await listBroadcasts());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Failed to load broadcasts");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (!requested) return;
    if (requested === "unpublished" || requested === "all" || PUBLISH_PLATFORMS.some((item) => item.id === requested)) {
      setTab(requested as BroadcastTab);
    }
  }, [searchParams]);

  const emptyCopy =
    tab === "unpublished"
      ? "No unpublished posts. Unpublish a live post and it will show up here."
      : tab === "all"
        ? "No live broadcasts yet. Create your first post from New broadcast."
        : `No live ${TABS.find((item) => item.id === tab)?.label || tab} posts yet.`;

  return (
    <div className="page-shell">
      <PageHeader
        title={t("broadcasts.title")}
        description="Compose once, then each network is its own listing. Unpublished posts leave All and the network tabs."
        actions={
          <div className="flex flex-wrap gap-2">
            {isImportableTab(tab) ? (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                Import post
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/broadcasts/new">New broadcast</Link>
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as BroadcastTab)}>
        <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto">
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="gap-1.5">
              {item.label}
              <span className="rounded-full bg-white/50 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                {counts[item.id] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="glass overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="hidden md:table-cell">Metrics</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!pager.slice.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                  {emptyCopy}
                </TableCell>
              </TableRow>
            ) : null}
            {pager.slice.map((item) => {
              const platform = listingPlatform(item);
              return (
                <TableRow key={item.id} className={item.status === "deleted" ? "opacity-70" : undefined}>
                  <TableCell>
                    <Link href={`/broadcasts/${item.id}`} className="flex items-center gap-3">
                      <BroadcastListPreview item={item} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="block font-medium">{item.name}</span>
                          {item.origin === "imported" ? (
                            <Badge variant="muted" className="shrink-0">
                              Imported
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.body || "No caption"} · {formatRelativeTime(item.at)}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={asChannelId(platform)} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-1">
                      <Badge variant={overallBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                      <PlatformStatusList platforms={[platform]} statuses={item.platformStatuses} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusLabel(item.postMode)}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {metricsLabel(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/broadcasts/${item.id}`}>View details</Link>
                        </DropdownMenuItem>
                        {item.status === "draft" || item.status === "failed" || item.status === "partially_failed" ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/broadcasts/${item.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const copy = await duplicateBroadcast(item.id);
                              setRows((current) => [toUiBroadcast(copy), ...current]);
                              toast.success("Broadcast duplicated");
                            } catch (error) {
                              toast.error(error instanceof ApiError ? error.detail : "Duplicate failed");
                            }
                          }}
                        >
                          Duplicate
                        </DropdownMenuItem>
                        {item.status !== "deleted" ? (
                          <DropdownMenuItem onClick={() => setPendingDelete(item)}>
                            {isLiveSocialBroadcast(item) ? "Unpublish" : "Delete"}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          page={pager.page}
          pageCount={pager.pageCount}
          total={pager.total}
          pageSize={pager.pageSize}
          onPageChange={pager.setPage}
        />
      </div>

      {isImportableTab(tab) ? (
        <ImportPostDialog
          open={importOpen}
          platform={tab}
          onOpenChange={setImportOpen}
          onImported={() => void reload()}
        />
      ) : null}

      <Dialog open={!!pendingDelete} onOpenChange={() => !busy && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingDelete && isLiveSocialBroadcast(pendingDelete) ? "Unpublish post" : "Delete broadcast"}</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? isLiveSocialBroadcast(pendingDelete)
                  ? liveDeleteCopy(pendingDelete).dialog
                  : `Delete “${pendingDelete.name}”? This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!pendingDelete) return;
                setBusy(true);
                try {
                  const result = await deleteBroadcast(pendingDelete.id);
                  if (isDeletedBroadcast(result)) {
                    const mapped = toUiBroadcast(result);
                    setRows((current) => current.map((row) => (row.id === mapped.id ? mapped : row)));
                    toast.success(
                      isLiveSocialBroadcast(pendingDelete)
                        ? liveDeleteCopy(pendingDelete).success
                        : "Broadcast deleted",
                    );
                    if (isLiveSocialBroadcast(pendingDelete)) setTab("unpublished");
                  } else if (isLiveSocialBroadcast(pendingDelete)) {
                    toast.error(liveDeleteCopy(pendingDelete).fail);
                    await reload();
                  } else {
                    setRows((current) => current.filter((row) => row.id !== pendingDelete.id));
                    toast.success("Broadcast deleted");
                  }
                  setPendingDelete(null);
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.detail : "Delete failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {pendingDelete && isLiveSocialBroadcast(pendingDelete) ? "Unpublish" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
