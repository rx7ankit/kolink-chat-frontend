"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Music2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DestinationPanel } from "@/components/broadcasts/destination-panel";
import { MediaCropDialog } from "@/components/broadcasts/media-crop-dialog";
import { PlatformPreview } from "@/components/broadcasts/preview";
import { ChannelIcon } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBroadcast,
  sendBroadcast,
  scheduleBroadcast,
  updateBroadcast,
  type ApiBroadcast,
} from "@/lib/api/broadcasts";
import { listChannels, type ApiChannel } from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { uploadInboxFile } from "@/lib/api/inbox";
import {
  aspectForPostType,
  ensurePublicMediaUrls,
  mediaWarningsForPost,
} from "@/lib/broadcast-media";
import { listSegments, type SegmentRow } from "@/lib/api/contacts";
import {
  POST_TYPES,
  audienceDmSupported,
  availablePostTypes,
  captionWarnings,
  detectMediaKind,
  sortPlatformsForSelector,
  threadsTextOnlyOk,
  type PostMode,
  type PostType,
  type PublishPlatformId,
} from "@/lib/publish";
import { cn } from "@/lib/utils";

const MAX_INLINE_BYTES = 1_800_000;

export type ComposerValue = {
  id?: string;
  name: string;
  platforms: PublishPlatformId[];
  postMode: PostMode;
  postType: PostType;
  audienceKey: string;
  body: string;
  mediaUrls: string[];
};

export function BroadcastComposer({ initial }: { initial?: ComposerValue }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "Untitled broadcast");
  const [platforms, setPlatforms] = useState<PublishPlatformId[]>(initial?.platforms || ["instagram"]);
  const [postMode, setPostMode] = useState<PostMode>(initial?.postMode || "social_post");
  const [postType, setPostType] = useState<PostType>(initial?.postType || "feed");
  const [audienceKey, setAudienceKey] = useState(initial?.audienceKey || "all");
  const [body, setBody] = useState(initial?.body || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(initial?.mediaUrls || []);
  const [mediaUrlDraft, setMediaUrlDraft] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<PublishPlatformId>(initial?.platforms?.[0] || "instagram");
  const [channels, setChannels] = useState<ApiChannel[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(18, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
  });

  useEffect(() => {
    void listChannels()
      .then(setChannels)
      .catch(() => setChannels([]));
    void listSegments()
      .then(setSegments)
      .catch(() => setSegments([]));
  }, []);

  const connected = useMemo(
    () => new Set(channels.filter((row) => row.connected).map((row) => row.channel)),
    [channels],
  );
  const ordered = sortPlatformsForSelector(connected);
  const postTypeOptions = useMemo(() => availablePostTypes(platforms), [platforms]);
  const warnings = captionWarnings(body, platforms);
  const typeMediaWarnings = postMode === "social_post" ? mediaWarningsForPost(postType, mediaUrls, platforms) : [];
  const blockingWarnings = [...warnings, ...typeMediaWarnings.filter((w) => !w.includes("Uploading media"))];
  const selectedMeta = ordered.filter((item) => platforms.includes(item.id));
  const channelByPlatform = useMemo(() => new Map(channels.map((row) => [row.channel, row])), [channels]);
  const previewHandle = channelByPlatform.get(previewPlatform)?.handle?.replace(/^@/, "");

  useEffect(() => {
    if (!platforms.includes(previewPlatform)) {
      setPreviewPlatform(platforms[0] || "instagram");
    }
  }, [platforms, previewPlatform]);

  useEffect(() => {
    if (!postTypeOptions.some((item) => item.id === postType)) {
      setPostType("feed");
    }
  }, [postType, postTypeOptions]);

  useEffect(() => {
    if (!audienceDmSupported(platforms) && postMode === "audience_dm") {
      setPostMode("social_post");
    }
  }, [platforms, postMode]);

  function togglePlatform(id: PublishPlatformId) {
    setPlatforms((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function addMediaUrl() {
    const url = mediaUrlDraft.trim();
    if (!url) return;
    setMediaUrls((current) => [...current, url]);
    setMediaUrlDraft("");
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setPublishing(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_INLINE_BYTES) {
          toast.error(`${file.name} is larger than 1.8MB`);
          continue;
        }
        const uploaded = await uploadInboxFile(file);
        next.push(uploaded.url);
      }
      if (next.length) setMediaUrls((current) => [...current, ...next]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Upload failed");
    } finally {
      setPublishing(false);
    }
  }

  async function persist(action: "draft" | "schedule" | "publish") {
    if (!name.trim()) {
      toast.error("Give this broadcast a name");
      return;
    }
    if (!platforms.length) {
      toast.error("Select at least one platform");
      return;
    }
    if (postMode === "audience_dm" && !body.trim()) {
      toast.error("Write a message for the audience");
      return;
    }
    if (
      (action === "publish" || action === "schedule") &&
      (platforms.includes("threads") || platforms.includes("x") || platforms.includes("linkedin")) &&
      !body.trim() &&
      !mediaUrls.length
    ) {
      toast.error(
        platforms.includes("linkedin") && !platforms.includes("threads") && !platforms.includes("x")
          ? "LinkedIn posts need a caption"
          : platforms.includes("x") && !platforms.includes("threads")
            ? "X posts need a caption or media"
            : "Threads posts need a caption or media",
      );
      return;
    }
    if (blockingWarnings.length && action !== "draft") {
      toast.error(blockingWarnings[0]);
      return;
    }
    const busy = action === "publish" ? setPublishing : setSaving;
    busy(true);
    try {
      let resolvedMedia = mediaUrls;
      if (action === "publish" || action === "schedule") {
        resolvedMedia = await ensurePublicMediaUrls(mediaUrls);
      }
      const payload = {
        name: name.trim(),
        platforms,
        post_mode: postMode,
        post_type: postType,
        audience_key: audienceKey,
        body: body.trim(),
        media_urls: resolvedMedia,
        save_draft: action === "draft",
      };
      let row: ApiBroadcast;
      if (initial?.id) {
        row = await updateBroadcast(initial.id, payload);
      } else {
        row = await createBroadcast(payload);
      }
      if (action === "publish") {
        const sent = await sendBroadcast(row.id);
        toast.success("Published — check platform results");
        router.push(`/broadcasts/${sent.id}`);
        return;
      } else if (action === "schedule") {
        await scheduleBroadcast(row.id, new Date(scheduleAt).toISOString());
        toast.success("Broadcast scheduled");
      } else {
        toast.success("Draft saved");
      }
      router.push("/broadcasts");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save broadcast");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  return (
    <div className="page-shell mx-auto max-w-6xl">
      <PageHeader
        title={initial?.id ? "Edit broadcast" : "New broadcast"}
        description="Compose once, then publish or schedule across connected platforms."
      />

      <div className="space-y-4">
        <section className="glass rounded-2xl p-5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Platforms</Label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {ordered.map((item) => {
              const isOn = platforms.includes(item.id);
              const isConnected = connected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePlatform(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                    isOn ? "border-primary/40 bg-white/70" : "border-white/50 bg-white/35 hover:bg-white/55",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox checked={isOn} className="pointer-events-none" />
                    <ChannelIcon channel={item.id} size={16} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      isConnected ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600",
                    )}
                  >
                    {isConnected ? "Connected" : "Not connected"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4">
            <section className="glass rounded-2xl p-5">
              <div className="flex rounded-xl bg-muted p-1">
                {(
                  [
                    ["social_post", "Public social post"],
                    ["audience_dm", "Audience DM"],
                  ] as const
                ).map(([id, label]) => {
                  const disabled = id === "audience_dm" && !audienceDmSupported(platforms);
                  return (
                  <button
                    key={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPostMode(id)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      postMode === id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-white/40",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {label}
                  </button>
                );
                })}
              </div>
              {platforms.includes("threads") ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Threads supports public feed posts (text, image, or video). Audience DMs are not available on Threads.
                </p>
              ) : null}
              {platforms.includes("x") ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  X posts are public tweets (280 characters). Mentions and DMs sync in Inbox after Connect.
                </p>
              ) : null}

              <div className="mt-4 space-y-2">
                <Label htmlFor="broadcast-name">Campaign name</Label>
                <Input id="broadcast-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              {postMode === "social_post" ? (
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">Post type</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {postTypeOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPostType(item.id)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                          postType === item.id
                            ? "scale-[1.03] border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-white/50 bg-white/30 text-foreground/80 hover:border-primary/30 hover:bg-white/55",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <Label>Audience</Label>
                  <div className="flex flex-wrap gap-2">
                    {(segments.length
                      ? segments.filter((seg) => ["all", "vip", "leads"].includes(seg.id))
                      : [
                          { id: "all", name: "All", count: 0 },
                          { id: "vip", name: "VIP", count: 0 },
                          { id: "leads", name: "Leads", count: 0 },
                        ]
                    ).map((seg) => (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setAudienceKey(seg.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            audienceKey === seg.id ? "border-primary/40 bg-white/70" : "border-white/50 bg-white/30",
                          )}
                        >
                          {seg.name} · {seg.count}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="caption">{postMode === "audience_dm" ? "Message" : "Caption"}</Label>
                  <span className="text-[11px] text-muted-foreground">{body.length} characters</span>
                </div>
                <Textarea
                  id="caption"
                  className="min-h-36"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={postMode === "audience_dm" ? "Write the message…" : "Write a caption…"}
                />
                {selectedMeta.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMeta.map((item) => {
                      const over = body.length > item.captionLimit;
                      return (
                        <span
                          key={item.id}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            over ? "bg-rose-100 text-rose-800" : "bg-white/50 text-muted-foreground",
                          )}
                        >
                          {item.label} {body.length.toLocaleString()}/{item.captionLimit.toLocaleString()}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                {warnings.map((warning) => (
                  <p key={warning} className="text-xs text-rose-700">
                    {warning}
                  </p>
                ))}
                {typeMediaWarnings.map((warning) => (
                  <p key={warning} className="text-xs text-amber-800">
                    {warning}
                  </p>
                ))}
                {postType === "reel" ? (
                  <div className="flex items-start gap-2 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-2 text-xs text-violet-900">
                    <Music2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Instagram&apos;s API cannot add licensed music to Reels. Upload your video with audio baked in, or
                      add music inside the Instagram app after publishing.
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="glass rounded-2xl p-5">
              <Label>Media</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {threadsTextOnlyOk(platforms) && platforms.length === 1
                  ? "Optional for Threads. Prefer Upload — we host the file so Meta can fetch it. Pasted stock-site URLs often fail."
                  : "Upload files (hosted on your API) or paste public URLs. Reels need video (.mp4)."}
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="https://…/image.jpg"
                  value={mediaUrlDraft}
                  onChange={(event) => setMediaUrlDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addMediaUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addMediaUrl}>
                  <Plus className="h-4 w-4" />
                  Add URL
                </Button>
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/50 bg-white/40 px-3 text-sm font-medium hover:bg-white/55">
                    <ImagePlus className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept={postType === "reel" ? "video/*" : "image/*,video/*"}
                      multiple={postType === "carousel"}
                      className="hidden"
                      disabled={publishing || saving}
                      onChange={(event) => {
                        void onPickFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                </label>
              </div>
              {mediaUrls.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {mediaUrls.map((url) => (
                    <div key={url} className="group relative overflow-hidden rounded-xl bg-white/50">
                      {detectMediaKind(url) === "video" ? (
                        <video src={url} className="h-24 w-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="h-24 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          if (detectMediaKind(url) !== "image") return;
                          setCropUrl(url);
                          setCropOpen(true);
                        }}
                      >
                        Crop
                      </button>
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-md bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setMediaUrls((current) => current.filter((item) => item !== url))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4">
            <DestinationPanel platforms={platforms} channels={channels} />
            <section className="glass rounded-2xl p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setPreviewPlatform(platform)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    previewPlatform === platform
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-white/50 bg-white/30 hover:bg-white/50",
                  )}
                >
                  <ChannelIcon channel={platform} size={12} />
                  {ordered.find((item) => item.id === platform)?.label || platform}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <PlatformPreview
                platform={previewPlatform}
                body={body}
                mediaUrls={mediaUrls}
                postType={postType}
                postMode={postMode}
                accountHandle={previewHandle}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Preview uses your connected account handle.</p>
          </section>
          </aside>
        </div>

        <div className="glass sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl p-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/broadcasts")}>
            Cancel
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void persist("draft")}>
            Save draft
          </Button>
          {scheduleOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} />
              <Button type="button" variant="outline" disabled={saving} onClick={() => void persist("schedule")}>
                Schedule
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(true)}>
              Schedule
            </Button>
          )}
          <Button type="button" disabled={saving || publishing} onClick={() => void persist("publish")}>
            {publishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish now"
            )}
          </Button>
        </div>
      </div>

      <MediaCropDialog
        open={cropOpen}
        imageUrl={cropUrl}
        defaultAspect={aspectForPostType(postType) === 9 / 16 ? "9:16" : "1:1"}
        onOpenChange={setCropOpen}
        onApply={(cropped) => {
          if (!cropUrl) return;
          setMediaUrls((current) => current.map((item) => (item === cropUrl ? cropped : item)));
          setCropUrl(null);
        }}
      />

      {(saving || publishing) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="glass-strong rounded-2xl px-10 py-8 text-center shadow-xl">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">
              {publishing ? "Publishing to your connected accounts…" : "Saving broadcast…"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">This may take up to a minute for video.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
