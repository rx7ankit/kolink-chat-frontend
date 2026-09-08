"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlarmClock,
  Check,
  ChevronLeft,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Smile,
  Tags,
  UserCheck,
  UserRoundX,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/inbox/chat-bubble";
import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { ContactProfileSheet } from "@/components/inbox/contact-profile-sheet";
import { EmailThread } from "@/components/inbox/email-thread";
import { messagePreview } from "@/components/inbox/message-content";
import { ChannelBadge, ChannelIcon, channelMeta } from "@/components/channel-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api/client";
import {
  createLabel as apiCreateLabel,
  deleteConversation,
  deleteMessage,
  getConversation,
  getInboxRevision,
  hideMessage,
  listCannedResponses,
  listConversations,
  listLabels,
  patchConversation,
  patchMessage,
  sendMessage,
  toInboxThread,
  uploadInboxFile,
  isPromoEmail,
  type CannedResponse,
  type InboxThread,
} from "@/lib/api/inbox";
import { listChannels, syncChannel } from "@/lib/api/channels";
import { listTeam, type TeamMember } from "@/lib/api/team";
import { useInboxNotifications } from "@/lib/hooks/use-inbox-notifications";
import { useInboxLive } from "@/lib/hooks/use-inbox-live";
import { useAuth } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n/provider";
import { inboxFolders, labelColorPalette } from "@/lib/mock";
import {
  applyThreadPatch,
  hydrateListWithMessages,
  mergeThreadLists,
  persistInboxSnapshot,
  readActiveThreadId,
  readInboxPrefs,
  readListSessionCache,
  readMessageCacheMap,
  removeMessageCacheEntry,
  threadNeedsMessageRefresh,
  writeActiveThreadId,
  writeInboxPrefs,
  writeMessageCacheEntry,
} from "@/lib/inbox/cache";
import type { ChannelId, ChatMessage, InboxLabel } from "@/lib/mock";
import { cn, formatClock, formatRelativeTime } from "@/lib/utils";

const folderIcons: Record<string, LucideIcon> = {
  all: Inbox,
  comments: MessageSquare,
  unassigned: UserRoundX,
  mine: UserCheck,
  reminders: AlarmClock,
};

const quickEmojis = ["😀", "😂", "😍", "🙏", "👍", "🔥", "✨", "🎉", "❤️", "😊", "🙂", "👋"];

type PendingMedia = {
  url?: string;
  previewUrl: string;
  contentType: string;
  name: string;
  file: File;
};

const channelFilters: { id: "all" | ChannelId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "instagram", label: channelMeta.instagram.label },
  { id: "whatsapp", label: channelMeta.whatsapp.label },
  { id: "telegram", label: channelMeta.telegram.label },
  { id: "line", label: channelMeta.line.label },
  { id: "linkedin", label: channelMeta.linkedin.label },
  { id: "email", label: channelMeta.email.label },
  { id: "messenger", label: channelMeta.messenger.label },
  { id: "facebook", label: channelMeta.facebook.label },
  { id: "threads", label: channelMeta.threads.label },
  { id: "tiktok", label: channelMeta.tiktok.label },
  { id: "x", label: channelMeta.x.label },
];

function inboxListCacheKey(
  folder: string,
  label: string,
  labels: InboxLabel[],
  channel: string,
  q: string,
  emailTab: string,
) {
  const selected = labels.find((item) => item.name === label);
  const labelId = label === "all" ? "all" : (selected?.id ?? label);
  return `${folder}|${labelId}|${channel}|${emailTab}|${q}`;
}

function outboundLabel(message: ChatMessage, now = Date.now()) {
  const status = (message.status || message.deliveryStatus || "").toLowerCase();
  if (status === "failed") return "Not sent";
  const sending = status === "uploading" || status === "sending" || status === "queued";
  if (sending) {
    const at = Date.parse(message.at);
    if (Number.isFinite(at) && now - at > 90_000) return "Not sent";
    return "Sending…";
  }
  return "Sent";
}

function pickActiveId(current: string | null, items: InboxThread[]) {
  if (current && items.some((thread) => thread.id === current)) return current;
  return items[0]?.id ?? null;
}

function isPlaceholderLinkedInComment(thread: InboxThread) {
  if (thread.channel !== "linkedin" || thread.threadKind !== "comment") return false;
  const preview = (thread.preview || "").trim();
  if (!preview || preview === "[comment]") return true;
  const texts = (thread.messages || []).map((item) => (item.text || "").trim());
  return texts.length > 0 && texts.every((text) => !text || text === "[comment]");
}

function linkedinContactName(name: string | undefined, channel?: string) {
  const text = (name || "").trim();
  if (channel && channel !== "linkedin") return text;
  if (!text || /^(member|linkedin|linkedin member)$/i.test(text)) return "LinkedIn member";
  if (/^[A-Z0-9_-]{8,16}$/.test(text) && /\d/.test(text)) return "LinkedIn member";
  return text;
}

function NavLabel({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "min-w-0 truncate text-left transition-[opacity,max-width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "ml-0 max-w-0 opacity-0" : "ml-0 max-w-[10rem] opacity-100",
      )}
    >
      {children}
    </span>
  );
}

export default function InboxPage() {
  const { t } = useI18n();
  const { user, workspace } = useAuth();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [labels, setLabels] = useState<InboxLabel[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [canned, setCanned] = useState<CannedResponse[]>([]);
  const [folder, setFolder] = useState("all");
  const [label, setLabel] = useState<string | "all">("all");
  const [channel, setChannel] = useState<"all" | ChannelId>("all");
  const [emailTab, setEmailTab] = useState<"primary" | "promotions">("primary");
  const [inboxPrefsReady, setInboxPrefsReady] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
  const [createLabelOpen, setCreateLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColorPalette[0]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [syncHint, setSyncHint] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const listRequestRef = useRef(0);
  const listCacheKeyRef = useRef("");
  const folderCacheRef = useRef<Record<string, InboxThread[]>>({});
  const messageCacheRef = useRef<Map<string, InboxThread>>(new Map());
  const conversationAbortRef = useRef<AbortController | null>(null);
  const conversationRequestRef = useRef(0);
  const prefetchRef = useRef<Map<string, Promise<void>>>(new Map());
  const syncHintTimerRef = useRef<number | null>(null);
  const deepLinkKey = useRef<string | null>(null);

  const listCacheKey = useMemo(
    () => inboxListCacheKey(folder, label, labels, channel, debouncedQuery, channel === "email" ? "mail" : "all"),
    [folder, label, labels, channel, debouncedQuery],
  );

  listCacheKeyRef.current = listCacheKey;

  const hasSending = threads.some((thread) =>
    thread.messages.some((item) => {
      const status = (item.status || item.deliveryStatus || "").toLowerCase();
      return status === "sending" || status === "queued" || status === "uploading";
    }),
  );

  useEffect(() => {
    if (!hasSending) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, [hasSending]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!workspace?.id) return;
    messageCacheRef.current = readMessageCacheMap(workspace.id);
  }, [workspace?.id]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasLink = Boolean(params.get("contact") || params.get("thread"));
      if (hasLink) {
        setChannel("all");
        setFolder("all");
        setLabel("all");
      } else if (workspace?.id) {
        const prefs = readInboxPrefs(workspace.id);
        if (prefs?.channel) setChannel(prefs.channel as "all" | ChannelId);
        if (prefs?.emailTab === "primary" || prefs?.emailTab === "promotions") setEmailTab(prefs.emailTab);
        if (prefs?.folder) setFolder(prefs.folder);
        if (prefs?.label) setLabel(prefs.label);
      } else {
        const savedChannel = sessionStorage.getItem("kolink_inbox_channel");
        const savedTab = sessionStorage.getItem("kolink_inbox_email_tab");
        if (savedChannel) setChannel(savedChannel as "all" | ChannelId);
        if (savedTab === "primary" || savedTab === "promotions") setEmailTab(savedTab);
      }
    } catch {
      /* ignore */
    }
    setInboxPrefsReady(true);
  }, [workspace?.id]);

  useEffect(() => {
    if (!inboxPrefsReady || !workspace?.id) return;
    writeInboxPrefs(workspace.id, { channel, emailTab, folder, label });
    try {
      sessionStorage.setItem("kolink_inbox_channel", channel);
      sessionStorage.setItem("kolink_inbox_email_tab", emailTab);
    } catch {
      /* ignore */
    }
  }, [inboxPrefsReady, workspace?.id, channel, emailTab, folder, label]);

  const commitThreads = useCallback(
    (next: InboxThread[], cacheKey: string) => {
      folderCacheRef.current[cacheKey] = next;
      if (workspace?.id) {
        persistInboxSnapshot(workspace.id, cacheKey, next, messageCacheRef.current);
      }
      setThreads(next);
    },
    [workspace?.id],
  );

  const patchThreads = useCallback(
    (mapped: InboxThread[], cacheKey: string) => {
      commitThreads(mapped, cacheKey);
    },
    [commitThreads],
  );

  const flashSyncHint = useCallback((text: string) => {
    setSyncHint(text);
    if (syncHintTimerRef.current) window.clearTimeout(syncHintTimerRef.current);
    syncHintTimerRef.current = window.setTimeout(() => setSyncHint(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (syncHintTimerRef.current) window.clearTimeout(syncHintTimerRef.current);
    };
  }, []);

  const patchThread = useCallback(
    (threadId: string, updater: (thread: InboxThread) => InboxThread, opts?: { persistMessages?: boolean }) => {
      const cacheKey = listCacheKeyRef.current;
      setThreads((current) => {
        const next = current.map((thread) => {
          if (thread.id !== threadId) return thread;
          const updated = updater(thread);
          if (opts?.persistMessages !== false && updated.messages.length && workspace?.id) {
            messageCacheRef.current.set(threadId, updated);
            writeMessageCacheEntry(workspace.id, updated);
          }
          return updated;
        });
        folderCacheRef.current[cacheKey] = next;
        if (workspace?.id) {
          persistInboxSnapshot(workspace.id, cacheKey, next, messageCacheRef.current);
        }
        return next;
      });
    },
    [workspace?.id],
  );

  const patchThreadMeta = useCallback(
    (threadId: string, mapped: InboxThread) => {
      patchThread(threadId, (thread) => ({ ...mapped, messages: thread.messages }));
    },
    [patchThread],
  );

  const loadConversationList = useCallback(
    async (cacheKey: string, opts?: { background?: boolean }): Promise<InboxThread[] | null> => {
      if (!workspace) return null;
      const selected = labels.find((item) => item.name === label);

      if (opts?.background) {
        setListRefreshing(true);
      }

      const page = await listConversations({
        folder,
        labelId: label === "all" ? null : selected?.id,
        channel,
        q: debouncedQuery,
        emailTab: channel === "email" ? "all" : undefined,
        pageSize: 50,
      });

      if (listCacheKeyRef.current !== cacheKey) return null;

      const previous = folderCacheRef.current[cacheKey] ?? [];
      const mapped = mergeThreadLists(
        page.items.map((row) => toInboxThread(row, user?.id, members)),
        previous,
        messageCacheRef.current,
      );
      patchThreads(mapped, cacheKey);
      if (!opts?.background) {
        setActiveId((id) => pickActiveId(id, mapped));
        setLoading(false);
      } else {
        flashSyncHint("Inbox updated");
      }
      setListRefreshing(false);
      return mapped;
    },
    [workspace, folder, label, labels, channel, debouncedQuery, user?.id, members, patchThreads, flashSyncHint],
  );
  const loadConversationListRef = useRef(loadConversationList);
  loadConversationListRef.current = loadConversationList;

  const refreshList = useCallback(
    async (opts?: { background?: boolean }) => {
      const cacheKey = listCacheKeyRef.current;
      if (!opts?.background && !(cacheKey in folderCacheRef.current)) {
        setLoading(true);
      }
      try {
        return await loadConversationList(cacheKey, opts);
      } catch (error) {
        if (listCacheKeyRef.current === cacheKey) {
          setLoading(false);
          setListRefreshing(false);
        }
        if (!opts?.background) {
          toast.error(error instanceof ApiError ? error.detail : "Could not load conversations");
        }
        return null;
      }
    },
    [loadConversationList],
  );

  const switchFolder = useCallback(
    (nextFolder: string) => {
      if (nextFolder === folder) return;
      setFolder(nextFolder);
      setProfileOpen(false);
    },
    [folder],
  );

  const switchLabel = useCallback(
    (nextLabel: string | "all") => {
      if (nextLabel === label) return;
      setLabel(nextLabel);
      setProfileOpen(false);
    },
    [label],
  );

  useEffect(() => {
    if (!workspace) return;

    const requestId = ++listRequestRef.current;
    const cacheKey = listCacheKey;
    let cached: InboxThread[] | undefined = folderCacheRef.current[cacheKey];
    if (!cached && workspace.id) {
      const fromSession = readListSessionCache(workspace.id, cacheKey);
      if (fromSession) {
        cached = hydrateListWithMessages(fromSession, messageCacheRef.current);
        folderCacheRef.current[cacheKey] = cached;
      }
    }

    if (cached) {
      setThreads(cached);
      const savedActive = workspace.id ? readActiveThreadId(workspace.id, cacheKey) : null;
      setActiveId((current) => pickActiveId(savedActive ?? current, cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    void loadConversationListRef.current(cacheKey).catch((error) => {
      if (requestId !== listRequestRef.current) return;
      if (listCacheKeyRef.current !== cacheKey) return;
      setLoading(false);
      setListRefreshing(false);
      toast.error(error instanceof ApiError ? error.detail : "Could not load conversations");
    });

    return () => {
      listRequestRef.current += 1;
    };
  }, [workspace, listCacheKey]);

  const loadActiveConversation = useCallback(
    async (conversationId: string, opts?: { refreshProfile?: boolean; background?: boolean }) => {
      if (!workspace) return;
      const cached = messageCacheRef.current.get(conversationId);
      if (cached?.messages.length && !opts?.refreshProfile) {
        setThreads((current) => applyThreadPatch(current, cached));
        if (!opts?.background) {
          setActiveLoading(false);
        }
      } else if (!opts?.background) {
        setActiveLoading(true);
      }

      conversationAbortRef.current?.abort();
      const controller = new AbortController();
      conversationAbortRef.current = controller;
      const requestId = ++conversationRequestRef.current;

      try {
        const row = await getConversation(conversationId, { refreshProfile: opts?.refreshProfile });
        if (controller.signal.aborted || requestId !== conversationRequestRef.current) return;
        const mapped = toInboxThread(row, user?.id, members);
        messageCacheRef.current.set(conversationId, mapped);
        if (workspace.id) {
          writeMessageCacheEntry(workspace.id, mapped);
        }
        setThreads((current) => {
          const next = applyThreadPatch(current, mapped);
          const cacheKey = listCacheKeyRef.current;
          if (cacheKey in folderCacheRef.current) {
            folderCacheRef.current[cacheKey] = next;
            persistInboxSnapshot(workspace.id, cacheKey, next, messageCacheRef.current);
          }
          return next;
        });
      } catch (error) {
        if (controller.signal.aborted || requestId !== conversationRequestRef.current) return;
        if (!opts?.background) {
          console.warn("inbox message load failed", error);
        }
      } finally {
        if (requestId === conversationRequestRef.current && !controller.signal.aborted) {
          setActiveLoading(false);
        }
      }
    },
    [workspace, user?.id, members],
  );

  const prefetchConversation = useCallback(
    (conversationId: string) => {
      const cached = messageCacheRef.current.get(conversationId);
      const listRow = folderCacheRef.current[listCacheKeyRef.current]?.find((row) => row.id === conversationId);
      if (cached?.messages.length && listRow && !threadNeedsMessageRefresh(listRow, cached)) {
        return;
      }
      const pending = prefetchRef.current.get(conversationId);
      if (pending) return;
      const task = loadActiveConversation(conversationId, { background: true })
        .catch(() => undefined)
        .finally(() => {
          prefetchRef.current.delete(conversationId);
        });
      prefetchRef.current.set(conversationId, task);
    },
    [loadActiveConversation],
  );

  const reloadActiveConversation = useCallback(
    async (opts?: { refreshProfile?: boolean }) => {
      if (!activeId) return;
      await loadActiveConversation(activeId, opts);
    },
    [activeId, loadActiveConversation],
  );

  const softRefresh = useCallback(async () => {
    const currentActive = activeId;
    const cached = currentActive ? messageCacheRef.current.get(currentActive) : undefined;
    const mapped = await refreshList({ background: true });
    if (!currentActive || !mapped) return;
    const listRow = mapped.find((row) => row.id === currentActive);
    if (!threadNeedsMessageRefresh(listRow, cached)) return;
    void loadActiveConversation(currentActive, { background: true });
  }, [refreshList, activeId, loadActiveConversation]);

  const openThreadFromNotification = useCallback((threadId: string) => {
    setActiveId(threadId);
    setMobileChat(true);
    setProfileOpen(false);
  }, []);

  useInboxLive(softRefresh, Boolean(workspace));
  useInboxNotifications(threads, activeId, openThreadFromNotification, Boolean(workspace));

  useEffect(() => {
    if (!workspace) return;
    void Promise.all([listLabels(), listTeam(), listCannedResponses()])
      .then(([nextLabels, nextMembers, nextCanned]) => {
        setLabels(nextLabels);
        setMembers(nextMembers);
        setCanned(nextCanned);
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.detail : "Could not load inbox");
      });
  }, [workspace]);

  useEffect(() => {
    if (!activeId || !workspace) return;
    void loadActiveConversation(activeId);
    return () => {
      conversationAbortRef.current?.abort();
    };
  }, [activeId, workspace, loadActiveConversation]);

  useEffect(() => {
    if (!workspace?.id || !activeId) return;
    writeActiveThreadId(workspace.id, listCacheKey, activeId);
  }, [workspace?.id, listCacheKey, activeId]);

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const labelByName = useMemo(() => {
    return Object.fromEntries(labels.map((item) => [item.name, item]));
  }, [labels]);

  const isCommentsView = folder === "comments";
  const isEmailView = channel === "email";
  const searchPlaceholder = isCommentsView ? t("inbox.searchComments") : isEmailView ? "Search mail" : t("inbox.search");
  const replyPlaceholder = isCommentsView ? t("inbox.commentPlaceholder") : t("inbox.placeholder");
  const emptyStateText =
    channel === "facebook" && folder === "all"
      ? "Facebook post comments appear in the Comments folder. Page DMs appear under Messenger."
      : channel === "threads" && folder === "all"
        ? "Threads private messages are not available via Meta's API yet. Open the Comments folder for post replies and @mentions."
        : channel === "threads"
          ? "No Threads replies yet. Sync after someone comments on your posts or @mentions you."
          : channel === "x" && folder === "comments"
            ? "No X mentions yet. Sync after someone mentions you or replies to a post."
            : channel === "x"
              ? "No X DMs yet. Mentions appear in Comments. DMs need dm.read access on your X app."
              : channel === "telegram"
                ? "No Telegram chats yet. Connect your personal Telegram, then wait a moment or tap Sync."
              : channel === "line"
                ? "No LINE chats yet. Connect your Official Account in Channels, set the webhook, then message the bot from LINE."
              : channel === "linkedin" && folder === "comments"
                ? "No LinkedIn comments yet. Stay on Comments, tap Sync comments & chat. LinkedIn only lets apps read Company Page comments — not comments on a personal profile post."
              : channel === "linkedin"
                ? "LinkedIn comments are in the Comments folder, not All chats. Personal DMs are not available."
              : channel === "email"
                ? emailTab === "promotions"
                  ? "Promotions are hidden from Primary. Nothing in Promotions yet — tap Sync after connecting Gmail."
                  : "Primary inbox is empty. Promotions stay hidden until you tap Promotions. Connect Gmail in Channels, then tap Sync."
              : channel === "tiktok" && folder === "comments"
                ? "No TikTok comments yet. Connect TikTok, then tap Sync. Live comments need Business Messaging access."
              : channel === "tiktok"
                ? "No TikTok DMs yet. Profile and videos sync after Connect. Live DMs need TikTok Business Messaging credentials."
          : channel === "messenger" && folder === "comments"
        ? "Messenger chats appear under All chats, not Comments."
        : isCommentsView
          ? t("inbox.noComments")
          : "No conversations in this view";

  function selectChannel(next: "all" | ChannelId) {
    if (next === channel) return;
    setChannel(next);
    setProfileOpen(false);
    if (next === "email") {
      setEmailTab("primary");
      setFolder("all");
    } else if (next === "facebook" || next === "threads" || next === "linkedin") {
      setFolder("comments");
    } else if (next === "messenger" || next === "telegram" || next === "whatsapp") {
      setFolder("all");
    }
  }

  function openEmailTab(next: "primary" | "promotions") {
    setChannel("email");
    setEmailTab(next);
    setFolder("all");
    setLabel("all");
    setProfileOpen(false);
  }

  useEffect(() => {
    if ((channel === "threads" || channel === "linkedin" || channel === "facebook") && folder === "all") {
      setFolder("comments");
    }
  }, [channel, folder]);
  const filtered = useMemo(() => {
    const visible = threads.filter((thread) => !isPlaceholderLinkedInComment(thread));
    if (channel === "email" && emailTab === "promotions") {
      return visible.filter((thread) => isPromoEmail(thread));
    }
    return visible.filter((thread) => !isPromoEmail(thread));
  }, [threads, channel, emailTab]);
  const active = filtered.find((thread) => thread.id === activeId) ?? filtered[0];
  const contact = active?.contact;
  const displayContact = contact
    ? { ...contact, name: linkedinContactName(contact.name, active?.channel) }
    : contact;
  const promoCount = useMemo(() => threads.filter((thread) => isPromoEmail(thread)).length, [threads]);

  useEffect(() => {
    if (!threads.length) return;
    const params = new URLSearchParams(window.location.search);
    const contactId = params.get("contact");
    const threadId = params.get("thread");
    if (!contactId && !threadId) return;
    const key = `${contactId || ""}:${threadId || ""}`;
    const match = threadId
      ? threads.find((item) => item.id === threadId)
      : threads.find((item) => item.contact.id === contactId);
    if (!match) return;
    if (deepLinkKey.current === key && activeId === match.id) return;
    deepLinkKey.current = key;
    if (match.channel === "email") {
      setChannel("email");
      setEmailTab(isPromoEmail(match) ? "promotions" : "primary");
      setFolder("all");
    }
    setActiveId(match.id);
    setMobileChat(true);
  }, [threads, activeId]);

  useEffect(() => {
    if (activeId && filtered.some((thread) => thread.id === activeId)) return;
    setActiveId(filtered[0]?.id ?? null);
  }, [filtered, activeId]);

  useEffect(() => {
    if (!active?.messages.length) return;
    if (active.channel === "email") return;
    scrollChatToBottom("auto");
  }, [activeId, active?.messages.length, active?.channel, scrollChatToBottom]);

  useEffect(() => {
    setReplyTo(null);
  }, [activeId]);

  async function syncInbox() {
    if (syncing) return;
    setSyncing(true);
    try {
      const before = await getInboxRevision().catch(() => ({ revision: "" }));
      const connected = (await listChannels().catch(() => []))
        .filter((row) => row.connected && ["instagram", "messenger", "facebook", "threads", "x", "telegram", "email", "tiktok", "line", "linkedin"].includes(row.channel))
        .map((row) => row.channel);
      const notes: string[] = [];
      let linkedinImported = false;
      const targets =
        channel !== "all" && connected.includes(channel) ? [channel] : connected;
      for (const channelId of targets) {
        const res = await syncChannel(channelId);
        if (channelId === "linkedin" && res?.detail) {
          notes.push(res.detail);
          linkedinImported = /imported\s+\d+/i.test(res.detail);
        }
      }
      if (linkedinImported) {
        setChannel("linkedin");
        setFolder("comments");
      }
      const inlineOnly = targets.length === 1 && targets[0] === "linkedin";
      if (!inlineOnly) {
        let changed = false;
        for (let attempt = 0; attempt < 12; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
          const after = await getInboxRevision().catch(() => ({ revision: "" }));
          await refreshList();
          if (activeId) {
            await reloadActiveConversation().catch(() => undefined);
          }
          if (after.revision && after.revision !== before.revision) {
            changed = true;
            break;
          }
        }
        if (!changed) {
          await refreshList();
        }
      } else {
        await refreshList();
        if (activeId) {
          await reloadActiveConversation().catch(() => undefined);
        }
      }
      toast.success(notes[0] || t("inbox.syncDone"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : t("inbox.syncFailed"));
    } finally {
      setSyncing(false);
    }
  }

  async function handleMediaPick(file: File | null) {
    if (!file || !active) return;
    const previewUrl = URL.createObjectURL(file);
    const guessed = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("image/")
          ? "image"
          : "file";
    setPendingMedia({ previewUrl, contentType: guessed, name: file.name, file });
    setUploadingMedia(true);
    try {
      const uploaded = await uploadInboxFile(file);
      setPendingMedia((current) =>
        current && current.previewUrl === previewUrl
          ? { ...current, url: uploaded.url, contentType: uploaded.content_type }
          : current,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setPendingMedia(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function send() {
    if (!active) return;
    const text = draft.trim();
    const media = pendingMedia;
    if (!text && !media) return;

    const tempId = `local-${Date.now()}`;
    const optimistic = {
      id: tempId,
      from: "agent" as const,
      text,
      at: new Date().toISOString(),
      contentType: media?.contentType ?? "text",
      mediaUrl: media?.previewUrl || media?.url,
      status: (media ? "uploading" : "sending") as ChatMessage["status"],
    };
    setDraft("");
    setPendingMedia(null);
    setEmojiOpen(false);
    patchThread(active.id, (thread) => ({
      ...thread,
      messages: [...thread.messages, optimistic],
      preview: messagePreview(optimistic),
      unread: 0,
      paused: true,
      assignedTo: thread.assignedTo ?? "You",
      assignedToUserId: thread.assignedToUserId ?? user?.id ?? null,
      updatedAt: optimistic.at,
    }));

    try {
      let url = media?.url;
      let type = media?.contentType;
      if (media && !url) {
        const uploaded = await uploadInboxFile(media.file);
        url = uploaded.url;
        type = uploaded.content_type;
      }
      const message = await sendMessage(active.id, text, {
        mediaUrl: url,
        contentType: type,
        replyToMessageId: replyTo?.id,
      });
      setReplyTo(null);
      const uiMessage: ChatMessage = {
        id: message.id,
        from: message.sender,
        text: message.body,
        at: message.created_at,
        contentType: message.content_type,
        mediaUrl: media?.previewUrl || message.media_url || undefined,
        deliveryStatus: message.delivery_status,
        status:
          message.delivery_status === "failed"
            ? "failed"
            : message.delivery_status === "queued"
              ? "sending"
              : "sent",
      };
      patchThread(active.id, (thread) => ({
        ...thread,
        messages: thread.messages.map((item) => (item.id === tempId ? uiMessage : item)),
        preview: messagePreview(uiMessage),
      }));
    } catch (error) {
      patchThread(active.id, (thread) => ({
        ...thread,
        messages: thread.messages.map((item) =>
          item.id === tempId ? { ...item, status: "failed" } : item,
        ),
      }));
      setDraft(text);
      setPendingMedia(media);
      toast.error(error instanceof ApiError ? error.detail : "Could not send");
    }
  }

  async function removeMessage(message: ChatMessage) {
    if (!active) return;
    if (!window.confirm(
      active.channel === "email"
        ? "Delete this email from KoLink and move it to Gmail Trash?"
        : message.from === "agent"
          ? "Unsend this message?"
          : "Remove this message from the inbox?",
    )) {
      return;
    }
    try {
      if (!message.id.startsWith("local-")) {
        await deleteMessage(active.id, message.id);
      }
      patchThread(active.id, (thread) => ({
        ...thread,
        messages: thread.messages.filter((item) => item.id !== message.id),
      }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete");
    }
  }

  async function editMessage(message: ChatMessage, body: string) {
    if (!active) return;
    try {
      const updated = await patchMessage(active.id, message.id, body);
      patchThread(active.id, (thread) => ({
        ...thread,
        messages: thread.messages.map((item) =>
          item.id === message.id
            ? {
                ...item,
                text: updated.body,
                deliveryStatus: updated.delivery_status,
                status: updated.delivery_status === "queued" ? "sending" : item.status,
              }
            : item,
        ),
      }));
      toast.success("Reply updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not edit");
      throw error;
    }
  }

  async function removeThread() {
    if (!active) return;
    if (!window.confirm("Delete this conversation from KoLink and move it to Gmail Trash?")) return;
    try {
      await deleteConversation(active.id);
      const deletedId = active.id;
      const cacheKey = listCacheKeyRef.current;
      let nextActiveId: string | null = null;
      setThreads((current) => {
        const next = current.filter((thread) => thread.id !== deletedId);
        nextActiveId = next[0]?.id ?? null;
        folderCacheRef.current[cacheKey] = next;
        if (workspace?.id) {
          removeMessageCacheEntry(workspace.id, deletedId);
          messageCacheRef.current.delete(deletedId);
          persistInboxSnapshot(workspace.id, cacheKey, next, messageCacheRef.current);
        }
        return next;
      });
      setActiveId(nextActiveId);
      toast.success("Moved to Trash");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete");
    }
  }

  async function moveEmail(category: "primary" | "promotions") {
    if (!active) return;
    try {
      const row = await patchConversation(active.id, { gmail_category: category });
      const mapped = toInboxThread(row, user?.id, members);
      patchThreadMeta(active.id, mapped);
      toast.success(category === "promotions" ? "Moved to Promotions" : "Moved to Primary");
      void refreshList({ background: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not move email");
    }
  }

  async function hideComment(message: ChatMessage) {
    if (!active) return;
    try {
      await hideMessage(active.id, message.id);
      patchThread(active.id, (thread) => ({
        ...thread,
        messages: thread.messages.map((item) =>
          item.id === message.id ? { ...item, text: "Comment hidden", mediaUrl: undefined, contentType: "text" } : item,
        ),
      }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not hide comment");
    }
  }

  async function createLabel() {
    const name = newLabelName.trim();
    if (!name) {
      toast.error("Enter a label name");
      return;
    }
    if (labels.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      toast.error("That label already exists");
      return;
    }
    try {
      const created = await apiCreateLabel(name, newLabelColor);
      setLabels((current) => [...current, created]);
      setLabel(created.name);
      setNewLabelName("");
      setNewLabelColor(labelColorPalette[0]);
      setCreateLabelOpen(false);
      toast.success(`Label “${created.name}” created`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create label");
    }
  }

  async function assignThread(value: string) {
    if (!active) return;
    const assigned = value === "unassigned" ? null : value;
    try {
      const row = await patchConversation(active.id, { assigned_to_user_id: assigned });
      const mapped = toInboxThread(row, user?.id, members);
      patchThreadMeta(active.id, mapped);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not assign");
    }
  }

  async function toggleState() {
    if (!active) return;
    const next = active.state === "open" ? "closed" : "open";
    try {
      const row = await patchConversation(active.id, { state: next });
      const mapped = toInboxThread(row, user?.id, members);
      patchThreadMeta(active.id, mapped);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not update conversation");
    }
  }

  function navButtonClass(active: boolean) {
    return cn(
      "flex items-center overflow-hidden rounded-xl text-sm transition",
      foldersCollapsed
        ? "mx-auto h-8 w-8 shrink-0 justify-center p-0"
        : "w-full justify-start gap-2.5 px-2.5 py-2 text-left",
      active
        ? "bg-primary/12 font-medium text-foreground"
        : "text-muted-foreground hover:bg-white/40 hover:text-foreground",
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex h-[calc(100svh-3rem)] min-h-0 min-w-0 overflow-hidden">
      <aside
        className={cn(
          "hidden shrink-0 flex-col overflow-hidden border-r border-white/35 bg-white/20 backdrop-blur-2xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
          foldersCollapsed ? "w-12" : "w-52",
        )}
      >
        <div
          className={cn(
            "flex items-center overflow-hidden border-b border-white/30 py-2",
            foldersCollapsed ? "justify-center px-2" : "justify-start gap-1 px-2",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("shrink-0", foldersCollapsed ? "h-8 w-8" : "h-9 w-9")}
                onClick={() => setFoldersCollapsed((value) => !value)}
                aria-label={foldersCollapsed ? "Expand folders" : "Collapse folders"}
              >
                {foldersCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {foldersCollapsed ? "Expand folders" : "Collapse folders"}
            </TooltipContent>
          </Tooltip>
          <p
            className={cn(
              "whitespace-nowrap px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              foldersCollapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-[8rem] opacity-100",
            )}
          >
            Folders
          </p>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            foldersCollapsed ? "px-2" : "px-2",
          )}
        >
          <div
            className={cn(
              "space-y-0.5 py-2",
              foldersCollapsed && "flex flex-col items-center",
            )}
          >
            {inboxFolders.map((item) => {
              const Icon = folderIcons[item.id] ?? Inbox;
              const activeFolder = folder === item.id && (item.id !== "all" || channel !== "email");
              const button = (
                <button
                  type="button"
                  onClick={() => switchFolder(item.id)}
                  className={navButtonClass(activeFolder)}
                  aria-label={item.name}
                  aria-current={activeFolder ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!foldersCollapsed ? (
                    <NavLabel collapsed={false}>{item.name}</NavLabel>
                  ) : null}
                </button>
              );

              return foldersCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{button}</div>
              );
            })}

            <div
              className={cn(
                "pt-3",
                foldersCollapsed && "flex flex-col items-center",
              )}
            >
              {!foldersCollapsed ? (
                <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
              ) : null}
              {(
                [
                  { id: "primary" as const, name: "Primary", Icon: Mail },
                  { id: "promotions" as const, name: "Promotions", Icon: Megaphone },
                ] as const
              ).map((item) => {
                const Icon = item.Icon;
                const activeMail = channel === "email" && emailTab === item.id;
                const button = (
                  <button
                    type="button"
                    onClick={() => openEmailTab(item.id)}
                    className={navButtonClass(activeMail)}
                    aria-label={item.name}
                    aria-current={activeMail ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!foldersCollapsed ? (
                      <NavLabel collapsed={false}>
                        {item.name}
                        {item.id === "promotions" && promoCount > 0 ? ` (${promoCount})` : ""}
                      </NavLabel>
                    ) : null}
                  </button>
                );
                return foldersCollapsed ? (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name}
                      {item.id === "promotions" && promoCount > 0 ? ` (${promoCount})` : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.id}>{button}</div>
                );
              })}
            </div>

            <div
              className={cn(
                "flex items-center overflow-hidden pb-1 pt-4",
                foldersCollapsed ? "w-full justify-center" : "justify-start gap-1 px-0.5",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("shrink-0", foldersCollapsed ? "h-8 w-8" : "h-7 w-7")}
                    onClick={() => setCreateLabelOpen(true)}
                    aria-label="Create label"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create label</TooltipContent>
              </Tooltip>
              <p
                className={cn(
                  "whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  foldersCollapsed ? "max-w-0 overflow-hidden opacity-0" : "max-w-[6rem] opacity-100",
                )}
              >
                Labels
              </p>
            </div>

            {(() => {
              const allLabelsButton = (
                <button
                  type="button"
                  onClick={() => switchLabel("all")}
                  className={navButtonClass(label === "all")}
                  aria-label="All labels"
                >
                  <Tags className="h-4 w-4 shrink-0 text-primary" />
                  {!foldersCollapsed ? (
                    <NavLabel collapsed={false}>All labels</NavLabel>
                  ) : null}
                </button>
              );

              return foldersCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{allLabelsButton}</TooltipTrigger>
                  <TooltipContent side="right">All labels</TooltipContent>
                </Tooltip>
              ) : (
                allLabelsButton
              );
            })()}

            {labels.map((item) => {
              const activeLabel = label === item.name;
              const button = (
                <button
                  type="button"
                  onClick={() => switchLabel(item.name)}
                  className={navButtonClass(activeLabel)}
                  aria-label={item.name}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/70"
                    style={{ backgroundColor: item.color }}
                  />
                  {!foldersCollapsed ? (
                    <NavLabel collapsed={false}>{item.name}</NavLabel>
                  ) : null}
                </button>
              );

              return foldersCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{button}</div>
              );
            })}
          </div>
        </div>
      </aside>

      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/35 bg-white/22 backdrop-blur-2xl md:w-80 md:shrink-0",
          mobileChat ? "hidden md:flex" : "flex w-full",
        )}
      >
        <div className="space-y-2.5 border-b border-white/35 p-3">
          <div className="flex items-center gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {syncHint ? (
              <span className="hidden shrink-0 text-[11px] font-medium text-emerald-700 sm:inline">{syncHint}</span>
            ) : listRefreshing ? (
              <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Updating…</span>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1.5 px-2.5 text-xs"
                  disabled={syncing || loading}
                  onClick={() => void syncInbox()}
                  aria-label={t("inbox.sync")}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                  <span className="hidden sm:inline">
                    {syncing ? t("inbox.syncing") : t("inbox.sync")}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t("inbox.syncHint")}</TooltipContent>
            </Tooltip>
          </div>
          <div className="lg:hidden">
            <Select value={folder} onValueChange={switchFolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inboxFolders.map((item) => {
                  const Icon = folderIcons[item.id] ?? Inbox;
                  return (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {item.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {channelFilters.map((item) => {
              const activeChip = channel === item.id;
              const chip = (
                <button
                  type="button"
                  onClick={() => selectChannel(item.id)}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                    activeChip
                      ? "bg-primary text-primary-foreground"
                      : "glass-field text-muted-foreground hover:bg-white/45 hover:text-foreground",
                  )}
                  aria-label={item.label}
                  aria-pressed={activeChip}
                >
                  {item.id === "all" ? (
                    <Inbox className="h-3.5 w-3.5" />
                  ) : (
                    <span className={cn(activeChip && "brightness-0 invert")}>
                      <ChannelIcon channel={item.id} size={14} />
                    </span>
                  )}
                </button>
              );

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{chip}</TooltipTrigger>
                  <TooltipContent side="bottom">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => openEmailTab("primary")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition",
                  channel === "email" && emailTab === "primary"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
                aria-pressed={channel === "email" && emailTab === "primary"}
              >
                <Mail className="h-4 w-4" />
                Primary
              </button>
              <button
                type="button"
                onClick={() => openEmailTab("promotions")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition",
                  channel === "email" && emailTab === "promotions"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
                aria-pressed={channel === "email" && emailTab === "promotions"}
              >
                <Megaphone className="h-4 w-4" />
                Promotions
                {promoCount > 0 ? (
                  <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-700">{promoCount}</span>
                ) : null}
              </button>
            </div>
        </div>
        <ScrollArea className={cn("min-h-0 min-w-0 flex-1 overflow-x-hidden transition-opacity", listRefreshing && "opacity-80")}>
          {loading && filtered.length === 0 ? (
            <div className="space-y-2 px-3 py-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse space-y-2 border-b pb-3">
                  <div className="h-3 w-2/5 rounded bg-slate-200/80" />
                  <div className="h-3 w-4/5 rounded bg-slate-100/90" />
                  <div className="h-2 w-1/3 rounded bg-slate-100/80" />
                </div>
              ))}
            </div>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              {channel === "messenger"
                ? "No Messenger DMs yet. Send a direct 1:1 message to your Page (not a group). Both accounts must be Meta app Testers."
                : emptyStateText}
            </p>
          ) : null}
          {filtered.map((thread) => {
            const person = thread.contact;
            return (
              <button
                key={thread.id}
                onMouseEnter={() => prefetchConversation(thread.id)}
                onFocus={() => prefetchConversation(thread.id)}
                onClick={() => {
                  setActiveId(thread.id);
                  setMobileChat(true);
                  setProfileOpen(false);
                }}
                className={cn(
                  "w-full border-b px-3 py-3 text-left hover:bg-muted/50",
                  active?.id === thread.id && "bg-primary/10",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("truncate text-sm", thread.unread > 0 ? "font-semibold text-slate-900" : "font-medium")}>
                    {linkedinContactName(person?.name, thread.channel)}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(thread.updatedAt)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-700">
                  {thread.subject || messagePreview({ text: thread.preview, contentType: "text" })}
                </p>
                {thread.subject ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {messagePreview({ text: thread.preview, contentType: "text" })}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {channel === "email" ? null : <ChannelBadge channel={thread.channel} />}
                  {thread.channel === "email" && isPromoEmail(thread) && emailTab !== "promotions" ? (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Megaphone className="h-3 w-3" />
                      Promo
                    </Badge>
                  ) : null}
                  {thread.threadKind === "comment" && (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <MessageSquare className="h-3 w-3" />
                      Comment
                    </Badge>
                  )}
                  {thread.labels.map((name) => {
                    const meta = labelByName[name];
                    return (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: meta ? `${meta.color}22` : "rgba(255,255,255,0.45)",
                          color: meta?.color ?? undefined,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: meta?.color ?? "#94a3b8" }}
                        />
                        {name}
                      </span>
                    );
                  })}
                  {thread.unread > 0 && <Badge>{thread.unread}</Badge>}
                </div>
              </button>
            );
          })}
        </ScrollArea>
      </section>

      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent",
          mobileChat ? "flex" : "hidden md:flex",
        )}
      >
        {active && contact ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-white/35 bg-white/22 backdrop-blur-2xl px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileChat(false)}
                  aria-label="Back to chats"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label={`Open profile for ${displayContact?.name ?? contact.name}`}
                >
                  <ContactAvatar contact={displayContact ?? contact} className="h-9 w-9 shrink-0" fallbackClassName="text-xs" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayContact?.name ?? contact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {active.threadKind === "comment" ? (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {active.channel === "threads"
                            ? "Threads reply"
                            : active.channel === "instagram"
                              ? "Instagram comment"
                              : active.channel === "facebook"
                                ? "Facebook post comment"
                                : "Comment"}
                        </span>
                      ) : contact.channel === "email" ? (
                        <span>
                          {contact.handle || contact.email}
                          {active.subject ? ` · ${active.subject}` : ""}
                        </span>
                      ) : contact.handle ? (
                        contact.handle
                      ) : contact.channel === "messenger" ? (
                        "Messenger"
                      ) : contact.channel === "facebook" ? (
                        "Facebook"
                      ) : (
                        ""
                      )}
                    </p>
                  </div>
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={active.assignedToUserId ?? "unassigned"}
                  onValueChange={(value) => {
                    void assignThread(value);
                  }}
                >
                  <SelectTrigger className="hidden w-36 sm:flex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_id === user?.id ? "You" : member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => void toggleState()}>
                  {active.state === "open" ? "Close" : "Reopen"}
                </Button>
              </div>
            </div>
            {active.channel === "email" ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <EmailThread
                  subject={active.subject || active.messages.find((item) => item.subject)?.subject}
                  contact={contact}
                  messages={active.messages}
                  category={active.gmailCategory}
                  onDeleteMessage={(item) => void removeMessage(item)}
                  onDeleteThread={() => void removeThread()}
                  onMove={(next) => void moveEmail(next)}
                  onEdit={(item, body) => editMessage(item, body)}
                />
              </div>
            ) : (
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto bg-gradient-to-b from-white/40 to-sky-50/40 px-3 py-4 sm:px-5"
            >
              <div className="mx-auto max-w-2xl space-y-2">
                {activeLoading && active.messages.length === 0 ? (
                  <div className="space-y-3 py-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className={cn("flex animate-pulse", index % 2 === 0 ? "justify-start" : "justify-end")}
                      >
                        <div
                          className={cn(
                            "rounded-2xl bg-white/70",
                            index % 2 === 0 ? "h-10 w-44" : "h-10 w-28",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                {active.messages.map((message, index) => {
                  const previous = active.messages[index - 1];
                  const showTime =
                    !previous ||
                    Math.abs(new Date(message.at).getTime() - new Date(previous.at).getTime()) > 12 * 60 * 1000;
                  const showAvatar =
                    message.from === "contact" &&
                    (index === active.messages.length - 1 || active.messages[index + 1]?.from !== "contact");
                  return (
                    <div key={message.id} className="space-y-2">
                      {showTime ? (
                        <p className="py-2 text-center text-[11px] font-medium text-slate-400">
                          {formatClock(message.at)}
                        </p>
                      ) : null}
                      <ChatBubble
                        message={message}
                        contact={displayContact ?? contact}
                        isComment={active.threadKind === "comment"}
                        showAvatar={showAvatar}
                        allowReply={active.threadKind === "comment"}
                        onReply={(item) => {
                          setReplyTo(item);
                        }}
                        onDelete={(item) => void removeMessage(item)}
                        onEdit={(item, body) => editMessage(item, body)}
                        onHide={active.threadKind === "comment" ? (item) => void hideComment(item) : undefined}
                      />
                      {index === active.messages.length - 1 && message.from === "agent" ? (
                        <p className="pr-9 text-right text-[11px] text-slate-400">
                          {outboundLabel(message, nowMs)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                <div aria-hidden className="h-1" />
              </div>
            </div>
            )}
            <div className="border-t border-white/40 bg-white/25 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              {replyTo ? (
                <div className="mb-2 flex items-start gap-2 rounded-2xl border border-sky-200/70 bg-white/80 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1 border-l-2 border-[#007AFF] pl-2">
                    <p className="text-[11px] font-medium text-[#007AFF]">Replying to {displayContact?.name ?? contact.name}</p>
                    <p className="truncate text-muted-foreground">
                      {messagePreview(replyTo)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-muted-foreground hover:bg-slate-100"
                    onClick={() => setReplyTo(null)}
                    aria-label="Cancel reply"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <div className="mb-2 flex flex-wrap gap-2">
                {canned.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant="outline"
                    onClick={() => setDraft(item.text)}
                  >
                    {item.shortcut}
                  </Button>
                ))}
                {active.paused && (
                  <Badge variant="peach" className="gap-1">
                    <Pause className="h-3 w-3" /> Automations paused
                  </Badge>
                )}
              </div>
              {pendingMedia ? (
                <div className="mb-2 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 px-3 py-2">
                  {pendingMedia.contentType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pendingMedia.previewUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs">{pendingMedia.name}</span>
                  {uploadingMedia ? (
                    <span className="text-[11px] text-muted-foreground">Uploading…</span>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => {
                      URL.revokeObjectURL(pendingMedia.previewUrl);
                      setPendingMedia(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    active.channel === "email"
                      ? "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,video/mp4,video/quicktime,audio/mpeg,audio/mp4"
                      : "image/*,video/mp4,video/quicktime,audio/mpeg,audio/mp4"
                  }
                  className="hidden"
                  onChange={(event) => void handleMediaPick(event.target.files?.[0] ?? null)}
                />
                {emojiOpen ? (
                  <div className="mb-2 flex flex-wrap gap-1 rounded-2xl border border-white/50 bg-white/80 p-2">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded-lg px-2 py-1 text-lg hover:bg-white"
                        onClick={() => setDraft((value) => `${value}${emoji}`)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-1.5 shadow-sm">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setEmojiOpen((open) => !open)}
                    aria-label="Insert emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={active.channel === "email" ? "Reply by email…" : replyPlaceholder}
                    rows={1}
                    className="max-h-28 min-h-[2.25rem] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full"
                    disabled={uploadingMedia || isCommentsView}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach media"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!draft.trim() && !pendingMedia}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007AFF] text-white transition hover:brightness-110 disabled:opacity-40"
                    aria-label={t("inbox.send")}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {emptyStateText}
          </div>
        )}
      </section>

      <ContactProfileSheet
        contact={displayContact ?? contact}
        thread={active}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onRefreshProfile={
          activeId
            ? async () => {
                await reloadActiveConversation({ refreshProfile: true });
              }
            : undefined
        }
      />

      <Dialog open={createLabelOpen} onOpenChange={setCreateLabelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create label</DialogTitle>
            <DialogDescription>
              Pick a name and color so labels stay easy to scan in the inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label-name">Name</Label>
              <Input
                id="label-name"
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.target.value)}
                placeholder="e.g. Wholesale"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    createLabel();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {labelColorPalette.map((color) => {
                  const selected = newLabelColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition",
                        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105",
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Choose color ${color}`}
                      aria-pressed={selected}
                    >
                      {selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                    </button>
                  );
                })}
              </div>
              <div className="glass-field mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: newLabelColor }}
                />
                <span style={{ color: newLabelColor }}>
                  {newLabelName.trim() || "Label preview"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateLabelOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createLabel}>Create label</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
