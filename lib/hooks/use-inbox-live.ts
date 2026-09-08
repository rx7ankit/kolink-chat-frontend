"use client";

import { useEffect, useRef } from "react";

import { getInboxRevision } from "@/lib/api/inbox";
import { getToken, getWorkspaceId } from "@/lib/api/client";
import { API_URL } from "@/lib/api/url";

const REFRESH_DEBOUNCE_MS = 150;
const RECONNECT_MS = 2000;
/** Only used when SSE is down — not while the stream is healthy. */
const FALLBACK_POLL_MS = 15_000;
const FALLBACK_POLL_MAX_MS = 60_000;

export function useInboxLive(onRefresh: () => void, enabled = true) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;
    const workspaceId = getWorkspaceId();
    const token = getToken();
    if (!workspaceId || !token) return;

    let active = true;
    let streamConnected = false;
    let lastRevision = "";
    let refreshTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let fallbackPollTimer: number | null = null;
    let fallbackPollDelay = FALLBACK_POLL_MS;
    let streamController: AbortController | null = null;

    function scheduleRefresh() {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => onRefreshRef.current(), REFRESH_DEBOUNCE_MS);
    }

    function clearFallbackPoll() {
      if (fallbackPollTimer) {
        window.clearTimeout(fallbackPollTimer);
        fallbackPollTimer = null;
      }
      fallbackPollDelay = FALLBACK_POLL_MS;
    }

    async function pollRevisionOnce() {
      if (!active || document.hidden) return;
      try {
        const after = await getInboxRevision();
        if (after.revision && after.revision !== lastRevision) {
          lastRevision = after.revision;
          scheduleRefresh();
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    function scheduleFallbackPoll() {
      if (!active || streamConnected || document.hidden) return;
      clearFallbackPoll();
      fallbackPollTimer = window.setTimeout(() => {
        void pollRevisionOnce().finally(() => {
          if (!active || streamConnected) return;
          fallbackPollDelay = Math.min(Math.round(fallbackPollDelay * 1.5), FALLBACK_POLL_MAX_MS);
          scheduleFallbackPoll();
        });
      }, fallbackPollDelay);
    }

    function stopStream() {
      streamConnected = false;
      if (streamController) {
        streamController.abort();
        streamController = null;
      }
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      clearFallbackPoll();
    }

    async function readStream() {
      if (!active || document.hidden) return;

      stopStream();
      streamController = new AbortController();
      const signal = streamController.signal;

      try {
        const res = await fetch(`${API_URL}/workspaces/${workspaceId}/inbox/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });
        if (!res.ok || !res.body) {
          throw new Error("stream unavailable");
        }

        streamConnected = true;
        clearFallbackPoll();

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (active && !document.hidden) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const line = chunk
              .split("\n")
              .find((row) => row.startsWith("data:"));
            if (!line) continue;
            try {
              const payload = JSON.parse(line.slice(5).trim()) as { type?: string; revision?: string };
              if (payload.type === "refresh" && payload.revision && payload.revision !== lastRevision) {
                lastRevision = payload.revision;
                scheduleRefresh();
              }
            } catch {
              /* ignore malformed events */
            }
          }
        }
      } catch {
        if (!active || signal.aborted) return;
      }

      streamConnected = false;
      streamController = null;
      if (!active || document.hidden) return;

      scheduleFallbackPoll();
      reconnectTimer = window.setTimeout(() => {
        void readStream();
      }, RECONNECT_MS);
    }

    function connect() {
      if (!active || document.hidden) return;
      void getInboxRevision()
        .then((row) => {
          lastRevision = row.revision || "";
        })
        .catch(() => undefined);
      void readStream();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopStream();
        return;
      }
      connect();
    }

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopStream();
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, [enabled]);
}
