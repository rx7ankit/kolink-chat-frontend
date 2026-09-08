import type { InboxThread } from "@/lib/api/inbox";

const SESSION_LIST_PREFIX = "kolink_inbox_v1";
const SESSION_MSG_PREFIX = "kolink_inbox_msgs_v1";
const SESSION_ACTIVE_PREFIX = "kolink_inbox_active_v1";
const SESSION_PREFS_PREFIX = "kolink_inbox_prefs_v1";
const MAX_MESSAGE_THREADS = 16;

export type InboxPrefs = {
  folder?: string;
  label?: string;
  channel?: string;
  emailTab?: "primary" | "promotions";
};

type MessageCacheStore = {
  order: string[];
  threads: Record<string, InboxThread>;
};

function listSessionKey(workspaceId: string, cacheKey: string) {
  return `${SESSION_LIST_PREFIX}:${workspaceId}:${cacheKey}`;
}

function messageStoreKey(workspaceId: string) {
  return `${SESSION_MSG_PREFIX}:${workspaceId}`;
}

function activeThreadKey(workspaceId: string, cacheKey: string) {
  return `${SESSION_ACTIVE_PREFIX}:${workspaceId}:${cacheKey}`;
}

function prefsKey(workspaceId: string) {
  return `${SESSION_PREFS_PREFIX}:${workspaceId}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode */
  }
}

export function readInboxPrefs(workspaceId: string): InboxPrefs | null {
  return readJson<InboxPrefs>(prefsKey(workspaceId));
}

export function writeInboxPrefs(workspaceId: string, prefs: InboxPrefs) {
  const current = readInboxPrefs(workspaceId) ?? {};
  writeJson(prefsKey(workspaceId), { ...current, ...prefs });
}

/** Persist list metadata (no messages) for instant first paint after navigation. */
export function readListSessionCache(workspaceId: string, cacheKey: string): InboxThread[] | null {
  const parsed = readJson<InboxThread[]>(listSessionKey(workspaceId, cacheKey));
  if (!parsed || !Array.isArray(parsed)) return null;
  return parsed.map((thread) => ({ ...thread, messages: thread.messages ?? [] }));
}

export function writeListSessionCache(workspaceId: string, cacheKey: string, threads: InboxThread[]) {
  const slim = threads.map(({ messages: _messages, ...rest }) => ({ ...rest, messages: [] }));
  writeJson(listSessionKey(workspaceId, cacheKey), slim);
}

export function readMessageCacheMap(workspaceId: string): Map<string, InboxThread> {
  const store = readJson<MessageCacheStore>(messageStoreKey(workspaceId));
  const map = new Map<string, InboxThread>();
  if (!store?.threads) return map;
  for (const id of store.order ?? Object.keys(store.threads)) {
    const thread = store.threads[id];
    if (thread?.messages?.length) {
      map.set(id, thread);
    }
  }
  return map;
}

export function writeMessageCacheEntry(workspaceId: string, thread: InboxThread) {
  if (!thread.messages.length) return;
  const store =
    readJson<MessageCacheStore>(messageStoreKey(workspaceId)) ?? ({ order: [], threads: {} } as MessageCacheStore);
  store.threads[thread.id] = thread;
  store.order = [thread.id, ...(store.order ?? []).filter((id) => id !== thread.id)].slice(0, MAX_MESSAGE_THREADS);
  for (const id of Object.keys(store.threads)) {
    if (!store.order.includes(id)) delete store.threads[id];
  }
  writeJson(messageStoreKey(workspaceId), store);
}

export function removeMessageCacheEntry(workspaceId: string, threadId: string) {
  const store = readJson<MessageCacheStore>(messageStoreKey(workspaceId));
  if (!store?.threads?.[threadId]) return;
  delete store.threads[threadId];
  store.order = (store.order ?? []).filter((id) => id !== threadId);
  writeJson(messageStoreKey(workspaceId), store);
}

export function readActiveThreadId(workspaceId: string, cacheKey: string): string | null {
  return readJson<string>(activeThreadKey(workspaceId, cacheKey));
}

export function writeActiveThreadId(workspaceId: string, cacheKey: string, threadId: string | null) {
  if (!threadId) return;
  writeJson(activeThreadKey(workspaceId, cacheKey), threadId);
}

export function hydrateListWithMessages(
  threads: InboxThread[],
  messageCache: Map<string, InboxThread>,
): InboxThread[] {
  return threads.map((thread) => mergeThreadRow(thread, undefined, messageCache));
}

/** Merge server list row with cached messages and prior local state. */
export function mergeThreadRow(
  incoming: InboxThread,
  previous: InboxThread | undefined,
  messageCache: Map<string, InboxThread>,
): InboxThread {
  const cached = messageCache.get(incoming.id);
  const prior = previous?.id === incoming.id ? previous : undefined;

  const messages =
    cached?.messages.length ? cached.messages : prior?.messages.length ? prior.messages : incoming.messages;

  const contact =
    cached?.contact?.name && cached.contact.name !== "LinkedIn member"
      ? cached.contact
      : prior?.contact?.avatarUrl
        ? { ...incoming.contact, ...prior.contact, name: incoming.contact.name || prior.contact.name }
        : incoming.contact;

  return {
    ...incoming,
    messages,
    contact,
    // Keep optimistic send state if server list is still catching up.
    preview: prior && prior.updatedAt > incoming.updatedAt ? prior.preview : incoming.preview,
    updatedAt: prior && prior.updatedAt > incoming.updatedAt ? prior.updatedAt : incoming.updatedAt,
    unread: incoming.unread,
    paused: prior?.paused ?? incoming.paused,
  };
}

export function mergeThreadLists(
  next: InboxThread[],
  previous: InboxThread[],
  messageCache: Map<string, InboxThread>,
) {
  return next.map((thread) => {
    const old = previous.find((item) => item.id === thread.id);
    return mergeThreadRow(thread, old, messageCache);
  });
}

export function applyThreadPatch(threads: InboxThread[], mapped: InboxThread) {
  return threads.map((thread) => (thread.id === mapped.id ? mapped : thread));
}

export function threadNeedsMessageRefresh(
  listRow: InboxThread | undefined,
  cached: InboxThread | undefined,
) {
  if (!listRow) return false;
  if (!cached?.messages.length) return true;
  if (listRow.unread > 0 && cached.unread === 0) return true;
  if (listRow.updatedAt !== cached.updatedAt) return true;
  if (listRow.preview !== cached.preview) return true;
  return false;
}

export function persistInboxSnapshot(
  workspaceId: string,
  cacheKey: string,
  threads: InboxThread[],
  messageCache: Map<string, InboxThread>,
) {
  writeListSessionCache(workspaceId, cacheKey, threads);
  for (const thread of threads) {
    if (thread.messages.length) {
      messageCache.set(thread.id, thread);
      writeMessageCacheEntry(workspaceId, thread);
    }
  }
}
