"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { PlatformIconRow, PlatformStatusList } from "@/components/broadcasts/platform-status";
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
import {
  deleteBroadcast,
  duplicateBroadcast,
  isDeletedBroadcast,
  listBroadcasts,
  toUiBroadcast,
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/provider";
import type { Broadcast } from "@/lib/mock";
import { detectMediaKind, overallBadgeVariant, statusLabel } from "@/lib/publish";
import { formatRelativeTime } from "@/lib/utils";

function thumbnail(item: Broadcast) {
  const url = item.mediaUrls[0];
  if (!url) return null;
  if (detectMediaKind(url) === "video") {
    return <video src={url} className="h-10 w-10 rounded-lg object-cover" muted />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-10 w-10 rounded-lg object-cover" />
  );
}

function metricsLabel(item: Broadcast) {
  if (item.postMode === "audience_dm") {
    return item.sent ? `${item.delivered}/${item.sent} delivered` : "—";
  }
  const buckets = Object.values(item.metrics || {});
  const likes = buckets.reduce((sum, row) => sum + (row.likes || 0), 0);
  const comments = buckets.reduce((sum, row) => sum + (row.comments || 0), 0);
  const shares = buckets.reduce((sum, row) => sum + (row.shares || 0), 0);
  if (!likes && !comments && !shares) return "—";
  return `${likes} likes · ${comments} comments · ${shares} shares`;
}

export default function BroadcastsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Broadcast[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Broadcast | null>(null);
  const [busy, setBusy] = useState(false);
  const pager = usePagination(rows, 6);

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

  return (
    <div className="page-shell">
      <PageHeader
        title={t("broadcasts.title")}
        description="One table for every platform — publish, schedule, and track each result independently."
        actions={
          <Button asChild>
            <Link href="/broadcasts/new">New broadcast</Link>
          </Button>
        }
      />
      <div className="glass overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead className="hidden lg:table-cell">Platform status</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="hidden md:table-cell">Metrics</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!pager.slice.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                  No broadcasts yet. Create your first post to Instagram or other connected channels.
                </TableCell>
              </TableRow>
            ) : null}
            {pager.slice.map((item) => (
              <TableRow key={item.id} className={item.status === "deleted" ? "opacity-70" : undefined}>
                <TableCell>
                  <Link href={`/broadcasts/${item.id}`} className="flex items-center gap-3">
                    {thumbnail(item) || (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 text-[10px] text-muted-foreground">
                        Post
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.body || "No caption"} · {formatRelativeTime(item.at)}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <PlatformIconRow platforms={item.platforms} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="space-y-1">
                    <Badge variant={overallBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                    <PlatformStatusList platforms={item.platforms} statuses={item.platformStatuses} />
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
            ))}
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
                ? pendingDelete.platformStatuses.instagram?.status === "published"
                  ? `Remove “${pendingDelete.name}” from Instagram? It will stay in koLink marked as Deleted.`
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
                    toast.success("Removed from Instagram");
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
