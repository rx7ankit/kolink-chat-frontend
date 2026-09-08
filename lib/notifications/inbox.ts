"use client";

const PROMPT_KEY = "kolink.inbox.notify_prompt";
const ENABLED_KEY = "kolink.inbox.notify_enabled";

export type InboxNotificationPayload = {
  threadId: string;
  contactName: string;
  preview: string;
  channel: string;
  avatarUrl?: string;
};

export function browserNotificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!browserNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function inboxNotificationsEnabled() {
  if (!browserNotificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem(ENABLED_KEY) !== "false";
}

export function setInboxNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}

export function shouldShowNotificationPrompt() {
  if (!browserNotificationsSupported()) return false;
  if (Notification.permission !== "default") return false;
  return localStorage.getItem(PROMPT_KEY) !== "dismissed";
}

export function dismissNotificationPrompt() {
  localStorage.setItem(PROMPT_KEY, "dismissed");
}

export async function requestInboxNotificationPermission() {
  if (!browserNotificationsSupported()) return "unsupported" as const;
  const result = await Notification.requestPermission();
  if (result === "granted") {
    setInboxNotificationsEnabled(true);
    localStorage.setItem(PROMPT_KEY, "accepted");
  }
  return result;
}

export function showInboxBrowserNotification(
  payload: InboxNotificationPayload,
  onOpen?: () => void,
) {
  if (!inboxNotificationsEnabled()) return;
  try {
    const notification = new Notification(payload.contactName, {
      body: payload.preview,
      icon: payload.avatarUrl || "/favicon.ico",
      tag: `kolink-inbox-${payload.threadId}`,
      silent: false,
    });
    notification.onclick = () => {
      window.focus();
      onOpen?.();
      notification.close();
    };
  } catch {
    /* ignore blocked or quota errors */
  }
}
