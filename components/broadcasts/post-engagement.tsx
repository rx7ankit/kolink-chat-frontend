"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EyeOff, ExternalLink, Heart, Loader2, Pencil, RefreshCw, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createBroadcastComment,
  deleteBroadcastComment,
  editBroadcastComment,
  hideBroadcastComment,
  listBroadcastComments,
  setBroadcastCommentLike,
  setBroadcastPostLike,
  type BroadcastEngagementPlatform,
  type FacebookBroadcastComment,
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import type { Broadcast } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Caps = {
  likePost: boolean;
  likeComment: boolean;
  editComment: boolean;
  hideComment: boolean;
  deleteAny: boolean;
};

const PLATFORM_COPY: Record<
  BroadcastEngagementPlatform,
  {
    label: string;
    you: string;
    hint: string;
    empty: string;
    commentPlaceholder: string;
    replyPlaceholder: string;
    commentVerb: string;
    replyVerb: string;
    posted: string;
    replied: string;
    edited: string;
    deleted: string;
    deleteConfirm: string;
    hideConfirm: string;
    likedPost: string;
    unlikedPost: string;
    loadError: string;
    openLabel: string;
    caps: Caps;
  }
> = {
  facebook: {
    label: "Facebook",
    you: "Your Page",
    hint: "Like this Page post, then reply, like, edit, or delete comments.",
    empty: "No comments yet. When someone comments on this Facebook post, they show here.",
    commentPlaceholder: "Write a comment as the Page…",
    replyPlaceholder: "Write a reply as the Page…",
    commentVerb: "Comment",
    replyVerb: "Reply",
    posted: "Comment published on the Page",
    replied: "Reply published on the Page",
    edited: "Comment updated on Facebook",
    deleted: "Comment deleted on Facebook",
    deleteConfirm: "Delete this comment on Facebook?",
    hideConfirm: "",
    likedPost: "Page liked this post",
    unlikedPost: "Like removed",
    loadError: "Could not load Facebook comments",
    openLabel: "Open on Facebook",
    caps: { likePost: true, likeComment: true, editComment: true, hideComment: false, deleteAny: true },
  },
  instagram: {
    label: "Instagram",
    you: "Your account",
    hint: "Like this post, then reply, like, hide, or delete comments.",
    empty: "No comments yet. When someone comments on this Instagram post, they show here.",
    commentPlaceholder: "Write a comment as this Instagram account…",
    replyPlaceholder: "Write a reply as this Instagram account…",
    commentVerb: "Comment",
    replyVerb: "Reply",
    posted: "Comment published on Instagram",
    replied: "Reply published on Instagram",
    edited: "",
    deleted: "Comment deleted on Instagram",
    deleteConfirm: "Delete this comment on Instagram?",
    hideConfirm: "Hide this comment on Instagram? The person who wrote it can still see it.",
    likedPost: "Liked this Instagram post",
    unlikedPost: "Like removed",
    loadError: "Could not load Instagram comments",
    openLabel: "Open on Instagram",
    caps: { likePost: true, likeComment: true, editComment: false, hideComment: true, deleteAny: true },
  },
  threads: {
    label: "Threads",
    you: "Your account",
    hint: "Reply to this Threads post. You can delete your own replies.",
    empty: "No replies yet. When someone replies to this Threads post, they show here.",
    commentPlaceholder: "Write a reply as this Threads account…",
    replyPlaceholder: "Write a reply as this Threads account…",
    commentVerb: "Reply",
    replyVerb: "Reply",
    posted: "Reply published on Threads",
    replied: "Reply published on Threads",
    edited: "",
    deleted: "Reply deleted on Threads",
    deleteConfirm: "Delete your reply on Threads?",
    hideConfirm: "",
    likedPost: "",
    unlikedPost: "",
    loadError: "Could not load Threads replies",
    openLabel: "Open on Threads",
    caps: { likePost: false, likeComment: false, editComment: false, hideComment: false, deleteAny: false },
  },
};

const PLATFORM_ORDER: BroadcastEngagementPlatform[] = ["instagram", "facebook", "threads"];

export function platformPublished(item: Broadcast, platform: BroadcastEngagementPlatform) {
  const row = item.platformStatuses[platform];
  const status = (row?.status || "").toLowerCase();
  return Boolean(row?.external_id) && (status === "published" || status === "sent");
}

function livePlatforms(item: Broadcast) {
  return PLATFORM_ORDER.filter((platform) => platformPublished(item, platform));
}

function insertReply(rows: FacebookBroadcastComment[], created: FacebookBroadcastComment) {
  const parentId = created.parent_id;
  if (!parentId) return [...rows, created];
  const parentIndex = rows.findIndex((row) => row.id === parentId);
  if (parentIndex < 0) return [...rows, created];
  let insertAt = parentIndex + 1;
  while (insertAt < rows.length && rows[insertAt].parent_id === parentId) insertAt += 1;
  return [...rows.slice(0, insertAt), created, ...rows.slice(insertAt)];
}

function replyParentId(row: FacebookBroadcastComment) {
  return row.parent_id || row.id;
}

function PlatformEngagementPanel({
  item,
  platform,
  onItem,
}: {
  item: Broadcast;
  platform: BroadcastEngagementPlatform;
  onItem: (next: Broadcast) => void;
}) {
  const copy = PLATFORM_COPY[platform];
  const [comments, setComments] = useState<FacebookBroadcastComment[]>([]);
  const [permalink, setPermalink] = useState(item.platformStatuses[platform]?.permalink || "");
  const [postLiked, setPostLiked] = useState(Boolean(item.platformStatuses[platform]?.liked));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [postLiking, setPostLiking] = useState(false);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState<FacebookBroadcastComment | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const likeLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBroadcastComments(item.id, platform);
      setComments(data.comments);
      setPermalink(data.permalink || "");
      if (!likeLock.current) setPostLiked(Boolean(data.liked));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError, item.id, platform]);

  useEffect(() => {
    setDraft("");
    setReplyTo(null);
    setEditingId(null);
    void load();
  }, [item.id, item.platformStatuses[platform]?.external_id, item.platformStatuses[platform]?.status, load]);

  async function togglePostLike() {
    if (platform === "threads") return;
    const next = !postLiked;
    likeLock.current = true;
    setPostLiked(next);
    setPostLiking(true);
    try {
      const updated = await setBroadcastPostLike(item.id, platform, next);
      onItem(updated);
      setPostLiked(Boolean(updated.platformStatuses[platform]?.liked) || next);
      toast.success(next ? copy.likedPost : copy.unlikedPost);
    } catch (error) {
      setPostLiked(!next);
      toast.error(error instanceof ApiError ? error.detail : "Could not update like");
    } finally {
      likeLock.current = false;
      setPostLiking(false);
    }
  }

  async function sendComment() {
    const message = draft.trim();
    if (!message) return;
    setSending(true);
    try {
      const created = await createBroadcastComment(item.id, platform, message);
      setComments((rows) => [...rows, created]);
      setDraft("");
      toast.success(copy.posted);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not publish");
    } finally {
      setSending(false);
    }
  }

  async function sendReply(row: FacebookBroadcastComment) {
    const message = replyDraft.trim();
    if (!message) return;
    setReplySending(true);
    try {
      const created = await createBroadcastComment(item.id, platform, message, replyParentId(row));
      setComments((rows) => insertReply(rows, created));
      setReplyDraft("");
      setReplyTo(null);
      toast.success(copy.replied);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not publish reply");
    } finally {
      setReplySending(false);
    }
  }

  async function toggleCommentLike(row: FacebookBroadcastComment) {
    if (platform === "threads") return;
    const next = !row.liked;
    setBusyId(row.id);
    try {
      await setBroadcastCommentLike(item.id, platform, row.id, next);
      setComments((rows) =>
        rows.map((itemRow) =>
          itemRow.id === row.id
            ? { ...itemRow, liked: next, like_count: Math.max(0, itemRow.like_count + (next ? 1 : -1)) }
            : itemRow,
        ),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not update comment like");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(row: FacebookBroadcastComment) {
    const message = editText.trim();
    if (!message) {
      toast.error("Comment text is required");
      return;
    }
    setBusyId(row.id);
    try {
      const updated = await editBroadcastComment(item.id, row.id, message);
      setComments((rows) => rows.map((itemRow) => (itemRow.id === row.id ? { ...itemRow, ...updated } : itemRow)));
      setEditingId(null);
      toast.success(copy.edited);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not edit comment");
    } finally {
      setBusyId(null);
    }
  }

  async function hideComment(row: FacebookBroadcastComment) {
    if (!copy.hideConfirm || !window.confirm(copy.hideConfirm)) return;
    setBusyId(row.id);
    try {
      await hideBroadcastComment(item.id, row.id);
      setComments((rows) => rows.map((itemRow) => (itemRow.id === row.id ? { ...itemRow, hidden: true } : itemRow)));
      toast.success("Comment hidden on Instagram");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not hide comment");
    } finally {
      setBusyId(null);
    }
  }

  async function removeComment(row: FacebookBroadcastComment) {
    if (!window.confirm(copy.deleteConfirm)) return;
    setBusyId(row.id);
    try {
      await deleteBroadcastComment(item.id, platform, row.id);
      setComments((rows) => rows.filter((itemRow) => itemRow.id !== row.id && itemRow.parent_id !== row.id));
      toast.success(copy.deleted);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete");
    } finally {
      setBusyId(null);
    }
  }

  const canDelete = (row: FacebookBroadcastComment) => copy.caps.deleteAny || row.mine;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{copy.hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {copy.caps.likePost ? (
            <Button type="button" size="sm" variant={postLiked ? "secondary" : "outline"} disabled={postLiking} onClick={() => void togglePostLike()}>
              <Heart className={cn("h-4 w-4", postLiked && "fill-[#ed4956] text-[#ed4956]")} />
              {postLiking ? "Saving…" : postLiked ? "Liked" : "Like post"}
            </Button>
          ) : null}
          {permalink ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={permalink} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {copy.openLabel}
              </a>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          comments.map((row) => (
            <div key={row.id} className={cn("rounded-xl bg-white/50 px-3 py-2.5", row.parent_id && "ml-6")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {row.from_name || (row.mine ? copy.you : "Someone")}
                    {row.mine ? <span className="ml-1 text-muted-foreground">· you</span> : null}
                    {row.hidden ? <span className="ml-1 text-muted-foreground">· hidden</span> : null}
                  </p>
                  {editingId === row.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        className="h-20 w-full rounded-xl border border-white/60 bg-white/80 p-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={busyId === row.id} onClick={() => void saveEdit(row)}>
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={cn("mt-0.5 whitespace-pre-wrap text-sm", row.hidden && "text-muted-foreground")}>
                      {row.message || "—"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!row.mine ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                      aria-label="Reply"
                      onClick={() => {
                        setReplyTo(row);
                        setReplyDraft("");
                        setEditingId(null);
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                  ) : null}
                  {copy.caps.likeComment ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                      aria-label={row.liked ? "Unlike comment" : "Like comment"}
                      onClick={() => void toggleCommentLike(row)}
                    >
                      <Heart className={cn("h-4 w-4", row.liked && "fill-[#ed4956] text-[#ed4956]")} />
                    </button>
                  ) : null}
                  {copy.caps.editComment && row.mine ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                      aria-label="Edit comment"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditText(row.message);
                        setReplyTo(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  {copy.caps.hideComment && !row.mine && !row.hidden ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                      aria-label="Hide comment"
                      onClick={() => void hideComment(row)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  ) : null}
                  {canDelete(row) ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-red-600 hover:bg-white/80"
                      aria-label="Delete"
                      onClick={() => void removeComment(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              {replyTo?.id === row.id ? (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] font-medium text-primary">
                    Replying to {row.from_name || "this comment"}
                  </p>
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder={copy.replyPlaceholder}
                    className="h-16 w-full rounded-xl border border-white/60 bg-white/80 p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={replySending || !replyDraft.trim()} onClick={() => void sendReply(row)}>
                      {replySending ? "Posting…" : copy.replyVerb}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.commentPlaceholder}
          className="h-20 flex-1 rounded-xl border border-white/60 bg-white/70 p-2.5 text-sm"
        />
        <Button type="button" disabled={sending || !draft.trim()} onClick={() => void sendComment()}>
          {sending ? "Posting…" : copy.commentVerb}
        </Button>
      </div>
    </div>
  );
}

export function BroadcastPostEngagement({
  item,
  onItem,
  preferred,
  onPreferred,
}: {
  item: Broadcast;
  onItem: (next: Broadcast) => void;
  preferred?: string;
  onPreferred?: (platform: BroadcastEngagementPlatform) => void;
}) {
  const platforms = useMemo(() => livePlatforms(item), [item]);
  const [tab, setTab] = useState<BroadcastEngagementPlatform>(platforms[0] || "instagram");

  useEffect(() => {
    if (!platforms.length) return;
    const preferredLive =
      preferred && platforms.includes(preferred as BroadcastEngagementPlatform)
        ? (preferred as BroadcastEngagementPlatform)
        : null;
    if (preferredLive && tab !== preferredLive) {
      setTab(preferredLive);
      return;
    }
    if (!platforms.includes(tab)) setTab(platforms[0]);
  }, [platforms, preferred, tab]);

  if (!platforms.length) return null;

  const active = platforms.includes(tab) ? tab : platforms[0];
  const title =
    platforms.length === 1
      ? active === "threads"
        ? "Threads replies"
        : `${PLATFORM_COPY[active].label} comments`
      : "Comments";

  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {platforms.length > 1 ? (
          <Tabs
            value={active}
            onValueChange={(value) => {
              const next = value as BroadcastEngagementPlatform;
              setTab(next);
              onPreferred?.(next);
            }}
          >
            <TabsList className="h-9">
              {platforms.map((platform) => (
                <TabsTrigger key={platform} value={platform} className="px-3 text-xs">
                  {PLATFORM_COPY[platform].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}
      </div>
      <PlatformEngagementPanel key={active} item={item} platform={active} onItem={onItem} />
    </section>
  );
}
