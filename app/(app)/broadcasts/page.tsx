"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

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
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";
import type { Broadcast } from "@/lib/mock";
import { PUBLISH_PLATFORMS, asChannelId, overallBadgeVariant, statusLabel, type PublishPlatformId } from "@/lib/publish";
import { formatRelativeTime } from "@/lib/utils";

const TABS: { id: "all" | PublishPlatformId; label: string }[] = [
  { id: "all", label: "All" },
  ...PUBLISH_PLATFORMS.map((item) => ({ id: item.id, label: item.id === "x" ? "X" : item.label.replace(" Page", "") })),
];

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
  const { t } = useI18n();
  const [rows, setRows] = useState<Broadcast[]>([]);
  const [tab, setTab] = useState<"all" | PublishPlatformId>("all");
  const [pendingDelete, setPendingDelete] = useState<Broadcast | null>(null);
  const [busy, setBusy] = useState(false);

  const listings = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((row) => listingPlatform(row) === tab);
  }, [rows, tab]);

  const pager = usePagination(listings, 6);

  useEffect(() => {
    pager.setPage(1);
  }, [tab, pager.setPage]);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: rows.length };
    for (const item of PUBLISH_PLATFORMS) next[item.id] = 0;
    for (const row of rows) {
      const platform = listingPlatform(row);
      next[platform] = (next[platform] || 0) + 1;
    }
    return next;
  }, [rows]);

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

  const emptyCopy =
    tab === "all"
      ? "No broadcasts yet. Create your first post from New broadcast."
      : `No ${TABS.find((item) => item.id === tab)?.label || tab} posts yet.`;

  return (
    <div className="page-shell">
      <PageHeader
        title={t("broadcasts.title")}
        description="Compose once, then each network is its own listing — publish, schedule, and delete independently."
        actions={
          <Button asChild>
            <Link href="/broadcasts/new">New broadcast</Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | PublishPlatformId)}>
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
                        <span className="block font-medium">{item.name}</span>
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
                          <DropdownMenuItem onClick={() => setPendingDelete(item)}>Delete</DropdownMenuItem>
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

      <Dialog open={!!pendingDelete} onOpenChange={() => !busy && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete broadcast</DialogTitle>
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
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
