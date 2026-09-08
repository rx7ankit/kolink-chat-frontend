"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlatformPreview } from "@/components/broadcasts/preview";
import { PlatformStatusList } from "@/components/broadcasts/platform-status";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteBroadcast, duplicateBroadcast, getBroadcast, isDeletedBroadcast, isLiveInstagramBroadcast, sendBroadcast, toUiBroadcast } from "@/lib/api/broadcasts";
import { listChannels, type ApiChannel } from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import type { Broadcast } from "@/lib/mock";
import { overallBadgeVariant, statusLabel, type PublishPlatformId } from "@/lib/publish";

export default function BroadcastDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Broadcast | null>(null);
  const [preview, setPreview] = useState<PublishPlatformId>("instagram");
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [channels, setChannels] = useState<ApiChannel[]>([]);

  useEffect(() => {
    void listChannels().then(setChannels).catch(() => setChannels([]));
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
  const igLive = isLiveInstagramBroadcast(item);

  return (
    <div className="page-shell mx-auto max-w-4xl">
      <PageHeader
        title={item.name}
        description={item.body || "No caption"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/broadcasts">Back</Link>
            </Button>
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
          <section className="glass rounded-2xl p-5">
            <p className="text-sm whitespace-pre-wrap">{item.body || "No caption"}</p>
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
                igLive
                  ? "Remove this post from Instagram? It will stay in koLink marked as Deleted."
                  : "Delete this broadcast from koLink? This cannot be undone.",
              );
              if (!ok) return;
              setBusy(true);
              try {
                const result = await deleteBroadcast(item.id);
                if (isDeletedBroadcast(result)) {
                  setItem(toUiBroadcast(result));
                  toast.success("Removed from Instagram");
                } else if (igLive) {
                  toast.error("Could not remove the post from Instagram. The listing was left unchanged.");
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
            Delete
          </Button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
