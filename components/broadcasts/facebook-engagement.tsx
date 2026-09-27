"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Loader2, Pencil, RefreshCw, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createFacebookBroadcastComment,
  deleteFacebookBroadcastComment,
  editFacebookBroadcastComment,
  listFacebookBroadcastComments,
  setFacebookBroadcastCommentLike,
  setFacebookBroadcastLike,
  type FacebookBroadcastComment,
} from "@/lib/api/broadcasts";
import { ApiError } from "@/lib/api/client";
import type { Broadcast } from "@/lib/mock";
import { cn } from "@/lib/utils";

function facebookLive(item: Broadcast) {
  const fb = item.platformStatuses.facebook;
  const status = (fb?.status || "").toLowerCase();
  return Boolean(fb?.external_id) && (status === "published" || status === "sent");
}

export function FacebookBroadcastEngagement({
  item,
  onItem,
}: {
  item: Broadcast;
  onItem: (next: Broadcast) => void;
}) {
  const [comments, setComments] = useState<FacebookBroadcastComment[]>([]);
  const [postLiked, setPostLiked] = useState(Boolean(item.platformStatuses.facebook?.liked));
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

  function replyParentId(row: FacebookBroadcastComment) {
    return row.parent_id || row.id;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFacebookBroadcastComments(item.id);
      setComments(data.comments);
      if (!likeLock.current) setPostLiked(Boolean(data.liked));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not load Facebook comments");
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    if (!facebookLive(item)) return;
    void load();
  }, [item.id, item.platformStatuses.facebook?.external_id, item.platformStatuses.facebook?.status, load]);

  if (!facebookLive(item)) return null;

  async function togglePostLike() {
    const next = !postLiked;
    likeLock.current = true;
    setPostLiked(next);
    setPostLiking(true);
    try {
      const updated = await setFacebookBroadcastLike(item.id, next);
      onItem(updated);
      setPostLiked(Boolean(updated.platformStatuses.facebook?.liked) || next);
      toast.success(next ? "Page liked this post" : "Like removed");
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
      const created = await createFacebookBroadcastComment(item.id, message);
      setComments((rows) => [...rows, created]);
      setDraft("");
      toast.success("Comment published on the Page");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not publish comment");
    } finally {
      setSending(false);
    }
  }

  async function sendReply(row: FacebookBroadcastComment) {
    const message = replyDraft.trim();
    if (!message) return;
    setReplySending(true);
    try {
      const created = await createFacebookBroadcastComment(item.id, message, replyParentId(row));
      setComments((rows) => insertReply(rows, created));
      setReplyDraft("");
      setReplyTo(null);
      toast.success("Reply published on the Page");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not publish reply");
    } finally {
      setReplySending(false);
    }
  }

  async function toggleCommentLike(row: FacebookBroadcastComment) {
    const next = !row.liked;
    setBusyId(row.id);
    try {
      await setFacebookBroadcastCommentLike(item.id, row.id, next);
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
      const updated = await editFacebookBroadcastComment(item.id, row.id, message);
      setComments((rows) => rows.map((itemRow) => (itemRow.id === row.id ? { ...itemRow, ...updated } : itemRow)));
      setEditingId(null);
      toast.success("Comment updated on Facebook");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not edit comment");
    } finally {
      setBusyId(null);
    }
  }

  async function removeComment(row: FacebookBroadcastComment) {
    if (!window.confirm("Delete this comment on Facebook?")) return;
    setBusyId(row.id);
    try {
      await deleteFacebookBroadcastComment(item.id, row.id);
      setComments((rows) => rows.filter((itemRow) => itemRow.id !== row.id && itemRow.parent_id !== row.id));
      toast.success("Comment deleted on Facebook");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete comment");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Facebook comments</h2>
          <p className="text-sm text-muted-foreground">Like this Page post, then reply, like, edit, or delete comments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={postLiked ? "secondary" : "outline"} disabled={postLiking} onClick={() => void togglePostLike()}>
            <Heart className={cn("h-4 w-4", postLiked && "fill-[#ed4956] text-[#ed4956]")} />
            {postLiking ? "Saving…" : postLiked ? "Liked" : "Like post"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No comments yet. When someone comments on this Facebook post, they show here.
          </p>
        ) : (
          comments.map((row) => (
            <div
              key={row.id}
              className={cn("rounded-xl bg-white/50 px-3 py-2.5", row.parent_id && "ml-6")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {row.from_name || (row.mine ? "Your Page" : "Facebook user")}
                    {row.mine ? <span className="ml-1 text-muted-foreground">· you</span> : null}
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
                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{row.message || "—"}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!row.mine ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                      aria-label="Reply to comment"
                      onClick={() => {
                        setReplyTo(row);
                        setReplyDraft("");
                        setEditingId(null);
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-white/80"
                    aria-label={row.liked ? "Unlike comment" : "Like comment"}
                    onClick={() => void toggleCommentLike(row)}
                  >
                    <Heart className={cn("h-4 w-4", row.liked && "fill-[#ed4956] text-[#ed4956]")} />
                  </button>
                  {row.mine ? (
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
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-full p-1.5 text-red-600 hover:bg-white/80"
                    aria-label="Delete comment"
                    onClick={() => void removeComment(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {replyTo?.id === row.id ? (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] font-medium text-primary">
                    Replying to {row.from_name || "this comment"} as the Page
                  </p>
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Write a reply as the Page…"
                    className="h-16 w-full rounded-xl border border-white/60 bg-white/80 p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={replySending || !replyDraft.trim()}
                      onClick={() => void sendReply(row)}
                    >
                      {replySending ? "Posting…" : "Reply"}
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
          placeholder="Write a comment as the Page…"
          className="h-20 flex-1 rounded-xl border border-white/60 bg-white/70 p-2.5 text-sm"
        />
        <Button type="button" disabled={sending || !draft.trim()} onClick={() => void sendComment()}>
          {sending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </section>
  );
}
