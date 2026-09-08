"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { BroadcastComposer } from "@/components/broadcasts/composer";
import { getBroadcast } from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import type { PublishPlatformId } from "@/lib/publish";

export default function EditBroadcastPage() {
  const params = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<{
    id: string;
    name: string;
    platforms: PublishPlatformId[];
    postMode: "social_post" | "audience_dm";
    postType: "feed" | "reel" | "story" | "carousel";
    audienceKey: string;
    body: string;
    mediaUrls: string[];
  } | null>(null);

  useEffect(() => {
    void getBroadcast(params.id)
      .then((row) => {
        setInitial({
          id: row.id,
          name: row.name,
          platforms: row.platforms,
          postMode: row.postMode,
          postType: row.postType,
          audienceKey: row.audienceKey,
          body: row.body,
          mediaUrls: row.mediaUrls,
        });
        setReady(true);
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Broadcast not found");
        setReady(true);
      });
  }, [params.id]);

  if (!ready) return <p className="page-shell text-sm text-muted-foreground">Loading…</p>;
  if (!initial) return <p className="page-shell text-sm text-destructive">Broadcast not found.</p>;
  return <BroadcastComposer initial={initial} />;
}
