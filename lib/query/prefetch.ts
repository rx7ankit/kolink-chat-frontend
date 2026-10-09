import type { QueryClient } from "@tanstack/react-query";

import { getAnalytics } from "@/lib/api/analytics";
import { listTemplates } from "@/lib/api/automations";
import { listBroadcasts } from "@/lib/api/broadcasts";
import { listChannels } from "@/lib/api/channels";
import { listContacts, listSegments, listTags } from "@/lib/api/contacts";
import { listIgAutomations } from "@/lib/api/ig-automations";
import { queryKeys } from "@/lib/query/keys";

const STALE = 30_000;

export function prefetchNav(queryClient: QueryClient, href: string, workspaceId: string) {
  if (!workspaceId) return;
  if (href.startsWith("/home")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.analytics(workspaceId),
      queryFn: getAnalytics,
      staleTime: STALE,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.channels(workspaceId),
      queryFn: listChannels,
      staleTime: STALE,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.templates(workspaceId),
      queryFn: listTemplates,
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/broadcasts")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.broadcasts(workspaceId),
      queryFn: listBroadcasts,
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/automations")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.igAutomations(workspaceId, "instagram"),
      queryFn: () => listIgAutomations("instagram"),
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/contacts")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.contacts(workspaceId, {
        q: "",
        segment: "all",
        tag: "all",
        channel: "all",
        page: 1,
      }),
      queryFn: () => listContacts({ q: "", segment: "all", channel: "all", page: 1, pageSize: 8 }),
      staleTime: STALE,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.contactTags(workspaceId),
      queryFn: listTags,
      staleTime: STALE,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.contactSegments(workspaceId),
      queryFn: listSegments,
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/channels") || href.startsWith("/settings/channels")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.channels(workspaceId),
      queryFn: listChannels,
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/templates")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.templates(workspaceId),
      queryFn: listTemplates,
      staleTime: STALE,
    });
    return;
  }
  if (href.startsWith("/insights")) {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.analytics(workspaceId),
      queryFn: getAnalytics,
      staleTime: STALE,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.channels(workspaceId),
      queryFn: listChannels,
      staleTime: STALE,
    });
  }
}
