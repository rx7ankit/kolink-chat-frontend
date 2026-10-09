"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlatformPreview } from "@/components/broadcasts/preview";
import { BroadcastPostEngagement } from "@/components/broadcasts/post-engagement";
import { PlatformStatusList } from "@/components/broadcasts/platform-status";
import { CollapsibleCaption } from "@/components/collapsible-caption";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BroadcastAutomationsButton } from "@/components/ig-automations/broadcast-automations-button";
import { deleteBroadcast, duplicateBroadcast, getBroadcast, isDeletedBroadcast, isLiveSocialBroadcast, liveDeleteCopy, sendBroadcast, toUiBroadcast } from "@/lib/api/broadcasts";
import { listChannels } from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { useWorkspaceId } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import type { Broadcast } from "@/lib/mock";
import { overallBadgeVariant, statusLabel, type PublishPlatformId } from "@/lib/publish";

export default function BroadcastDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Broadcast | null>(null);
  const [preview, setPreview] = useState<PublishPlatformId>("instagram");
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const ws = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: channels = [] } = useQuery({
    queryKey: queryKeys.channels(ws),
    queryFn: listChannels,
    enabled: Boolean(ws),
  });

  useEffect(() => {
    void getBroadcast(params.id)
      .then((row) => {
        setItem(row);
        setPreview((row.platforms[0] as PublishPlatformId) || "instagram");
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Broadcast not found"));
  }, [params.id]);

  if (!item) {
    return <p className="page-shell text-sm text-muted-foreground">Loading…</p>;
  }

  const canPublish = ["draft", "scheduled", "failed", "partially_failed"].includes(item.status);
  const canDelete = item.status !== "deleted";
  const liveSocial = isLiveSocialBroadcast(item);
  const deleteCopy = liveDeleteCopy(item);

  return (
    <div className="page-shell mx-auto max-w-4xl">
      <PageHeader
        title={item.name}
        description={<CollapsibleCaption text={item.body || "No caption"} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/broadcasts">Back</Link>
            </Button>
            <BroadcastAutomationsButton item={item} />
            {canPublish ? (
              <Button variant="outline" asChild>
                <Link href={`/broadcasts/${item.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const copy = await duplicateBroadcast(item.id);
                  await queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts(ws) });
                  toast.success("Duplicated");
                  router.push(`/broadcasts/${copy.id}/edit`);
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.detail : "Duplicate failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Duplicate
            </Button>
            {canPublish ? (
              <Button
                disabled={busy || publishing}
                onClick={async () => {
                  setPublishing(true);
                  try {
                    const sent = await sendBroadcast(item.id);
                    setItem(toUiBroadcast(sent));
                    toast.success("Publish finished — see platform results below");
                  } catch (error) {
                    toast.error(error instanceof ApiError ? error.detail : "Publish failed");
                  } finally {
                    setPublishing(false);
                  }
                }}
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  "Publish now"
                )}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={overallBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
              <Badge variant="outline">{statusLabel(item.postMode)}</Badge>
              {item.postMode === "social_post" ? <Badge variant="muted">{item.postType}</Badge> : <Badge variant="muted">{item.audience}</Badge>}
              {item.origin === "imported" ? <Badge variant="muted">Imported</Badge> : null}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Platform results</p>
              <div className="mt-2">
                <PlatformStatusList platforms={item.platforms} statuses={item.platformStatuses} />
              </div>
            </div>
            {Object.keys(item.metrics || {}).length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(item.metrics).map(([platform, bucket]) => (
                  <div key={platform} className="rounded-xl bg-white/45 px-3 py-2 text-xs">
                    <p className="font-medium capitalize">{platform}</p>
                    <p className="mt-1 text-muted-foreground">
                      {Object.entries(bucket)
                        .map(([key, value]) => `${value} ${key}`)
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          <BroadcastPostEngagement
            item={item}
            onItem={setItem}
            preferred={preview}
            onPreferred={(platform) => setPreview(platform)}
          />
          <section className="glass rounded-2xl p-5">
            <CollapsibleCaption text={item.body || "No caption"} className="text-sm" />
          </section>
        </div>
        <aside className="glass rounded-2xl p-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {item.platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setPreview(platform as PublishPlatformId)}
                className={`rounded-full border px-2.5 py-1 text-xs ${preview === platform ? "border-primary/40 bg-white/70" : "border-white/50"}`}
              >
                {platform}
              </button>
            ))}
          </div>
          <PlatformPreview
            platform={preview}
            body={item.body}
            mediaUrls={item.mediaUrls}
            postType={item.postType}
            postMode={item.postMode}
            accountHandle={channels.find((c) => c.channel === preview)?.handle ?? undefined}
          />
          {canDelete ? (
          <Button
            className="mt-4 w-full"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              const ok = window.confirm(
                liveSocial
                  ? deleteCopy.confirm
                  : "Delete this broadcast from koLink? This cannot be undone.",
              );
              if (!ok) return;
              setBusy(true);
              try {
                const result = await deleteBroadcast(item.id);
                await queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts(ws) });
                if (isDeletedBroadcast(result)) {
                  setItem(toUiBroadcast(result));
                  toast.success(liveSocial ? deleteCopy.success : "Broadcast deleted");
                  if (liveSocial) router.push("/broadcasts?tab=unpublished");
                } else if (liveSocial) {
                  toast.error(deleteCopy.fail);
                } else {
                  toast.success("Broadcast deleted");
                  router.push("/broadcasts");
                }
              } catch (error) {
                toast.error(error instanceof ApiError ? error.detail : "Delete failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {liveSocial ? "Unpublish" : "Delete"}
          </Button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
