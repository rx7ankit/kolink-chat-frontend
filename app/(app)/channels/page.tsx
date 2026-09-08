"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ChannelCard, ChannelCardSkeleton, type ChannelCardItem } from "@/components/channels/channel-card";
import { ChannelProfileDialog } from "@/components/channels/channel-profile-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  connectChannelDev,
  connectWhatsApp,
  completeWhatsAppEmbeddedSignup,
  disconnectAllChannels,
  disconnectChannel,
  getChannelProfile,
  getMetaStatus,
  listChannels,
  startChannelOAuth,
  syncChannel,
  type ApiChannel,
  type ChannelProfile,
  type MetaStatus,
} from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { oauthCallbackUrl, webhookUrl } from "@/lib/api/url";
import {
  facebookSdkReady,
  listenWhatsAppEmbeddedSignup,
  loadFacebookSdk,
  loginWhatsAppEmbeddedSignup,
  type WhatsAppSignupSession,
} from "@/lib/meta/facebook-sdk";
import { channels as catalog } from "@/lib/mock";
import type { Channel, ChannelId } from "@/lib/mock";

const LIVE = new Set(["whatsapp", "instagram", "messenger", "facebook", "threads", "x", "email", "linkedin"]);
const PROFILE_CHANNELS = new Set<ChannelId>(["instagram", "facebook", "messenger", "threads", "x", "email", "linkedin"]);

function emptyItems(): ChannelCardItem[] {
  return catalog.map((item) => ({
    ...item,
    connected: false,
    status: "disconnected" as const,
    handle: item.name,
    profile: null,
  }));
}

function merge(apiRows: ApiChannel[]): ChannelCardItem[] {
  const byId = new Map(apiRows.map((row) => [row.channel, row]));
  return catalog.map((item) => {
    const row = byId.get(item.id);
    if (!row) {
      return { ...item, connected: false, status: "disconnected" as const, handle: item.name, profile: null };
    }
    const connected = row.connected;
    return {
      ...item,
      handle: connected ? row.handle || item.name : item.name,
      connected,
      status: connected ? ("healthy" as const) : ("disconnected" as const),
      profile: row.profile,
      externalId: row.external_id,
    };
  });
}

export default function ChannelsPage() {
  const [items, setItems] = useState<ChannelCardItem[]>(emptyItems);
  const [pending, setPending] = useState<Channel | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [profileChannel, setProfileChannel] = useState<ChannelId | null>(null);
  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pageId, setPageId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waWaba, setWaWaba] = useState("");
  const [waAdvanced, setWaAdvanced] = useState(false);

  const refreshProfiles = useCallback(async (rows: ChannelCardItem[]) => {
    const targets = rows.filter((row) => row.connected && PROFILE_CHANNELS.has(row.id));
    if (!targets.length) return;

    await Promise.all(
      targets.map(async (row) => {
        try {
          const fresh = await getChannelProfile(row.id, !row.profile?.picture_url);
          setItems((current) =>
            current.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    profile: {
                      name: fresh.name,
                      username: fresh.username,
                      picture_url: fresh.picture_url,
                      followers_count: fresh.followers_count,
                      verified: fresh.verified,
                      category: fresh.category,
                      page_name: fresh.page_name,
                    },
                  }
                : item,
            ),
          );
        } catch {
          /* keep cached profile */
        }
      }),
    );
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listChannels();
      const merged = merge(rows);
      setItems(merged);
      void refreshProfiles(merged);
    } catch (error) {
      setItems(emptyItems());
      toast.error(error instanceof ApiError ? error.detail : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [refreshProfiles]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (!oauth) return;
    const channel = params.get("channel");
    const message = params.get("message");
    if (oauth === "connected") {
      const label = channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : "Channel";
      toast.success(`${label} connected`);
    } else if (oauth === "error") {
      const msg = message || "Connect failed";
      toast.error(
        msg.toLowerCase().includes("redirect_uri") || msg.toLowerCase().includes("redirect uri")
          ? "Invalid redirect_uri — add the exact URI in Meta OAuth settings."
          : msg.includes("authorization code has been used")
            ? "OAuth code expired — click Connect again."
            : msg,
      );
    }
    window.history.replaceState({}, "", `${window.location.origin}/channels`);
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!pending || pending.connected) return;
    if (pending.id === "whatsapp") {
      setWaToken("");
      setWaPhoneId("");
      setWaWaba("");
      setWaAdvanced(false);
    }
    if (!["instagram", "messenger", "facebook", "whatsapp"].includes(pending.id)) return;
    void getMetaStatus()
      .then((status) => {
        setMeta(status);
        const es = status.whatsapp_embedded_signup;
        if (pending.id === "whatsapp" && es?.app_id) {
          if (!es.ready) setWaAdvanced(true);
          void loadFacebookSdk(es.app_id, es.graph_version || status.graph_version).catch(() => {
            toast.error("Could not load Meta. Check that chat.getkolink.com is in Facebook Login allowed domains.");
          });
        }
      })
      .catch(() => setMeta(null));
  }, [pending]);

  async function openProfile(channelId: ChannelId) {
    setProfileChannel(channelId);
    setProfile(null);
    setProfileLoading(true);
    try {
      const row = await getChannelProfile(channelId, channelId === "linkedin");
      setProfile(row);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not load profile");
      setProfileChannel(null);
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshProfile() {
    if (!profileChannel) return;
    setProfileLoading(true);
    try {
      const row = await getChannelProfile(profileChannel, true);
      await reload();
      setProfile(row);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not refresh profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function resetAll() {
    setBusy(true);
    try {
      await disconnectAllChannels();
      toast.success("All channels disconnected");
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function syncChannelInbox(channelId: ChannelId) {
    setSyncing(true);
    try {
      const res = await syncChannel(channelId);
      toast.success(res.detail || `${channelId} inbox synced`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function confirm(login?: "instagram" | "facebook") {
    if (!pending) return;
    setBusy(true);
    try {
      if (!LIVE.has(pending.id)) {
        toast.message(`${pending.name} is not wired yet`);
        setPending(null);
        return;
      }
      if (pending.connected) {
        await disconnectChannel(pending.id);
        toast.success(`${pending.name} disconnected`);
      } else if (pending.id === "whatsapp") {
        if (!waAdvanced) {
          toast.error("Use Continue with Meta, or open Cloud API credentials");
          return;
        }
        if (!waPhoneId.trim() || !waToken.trim()) {
          toast.error("Phone number ID and access token are required");
          return;
        }
        await connectWhatsApp({
          access_token: waToken.trim(),
          phone_number_id: waPhoneId.trim(),
          business_account_id: waWaba.trim() || undefined,
        });
        toast.success(`${pending.name} connected`);
      } else if (pending.id === "linkedin") {
        const start = await startChannelOAuth(pending.id);
        window.location.href = start.url;
        return;
      } else if (pending.id === "x" || pending.id === "threads" || pending.id === "email") {
        try {
          const start = await startChannelOAuth(pending.id);
          window.location.href = start.url;
          return;
        } catch {
          await connectChannelDev(pending.id);
          toast.success(`${pending.name} connected (dev mode)`);
        }
      } else {
        const start = await startChannelOAuth(
          pending.id,
          {
            ...(pending.id === "instagram" && login ? { login } : {}),
            ...(pending.id === "messenger" || pending.id === "facebook"
              ? { pageId: pageId.trim() || undefined }
              : {}),
          },
        );
        window.location.href = start.url;
        return;
      }
      await reload();
      setPending(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Channel update failed");
    } finally {
      setBusy(false);
    }
  }

  function launchWhatsAppMeta() {
    const es = meta?.whatsapp_embedded_signup;
    if (!es?.ready || !es.config_id) {
      toast.error(es?.next_step || "Finish Become Tech Provider in Meta, then set WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID.");
      return;
    }
    if (!facebookSdkReady()) {
      toast.error("Meta is still loading. Wait a second and try again.");
      return;
    }
    setBusy(true);
    const session: WhatsAppSignupSession = { waba_id: null, phone_number_id: null };
    const stop = listenWhatsAppEmbeddedSignup(session);
    loginWhatsAppEmbeddedSignup(es.config_id, (code) => {
      void (async () => {
        if (!code) {
          stop();
          setBusy(false);
          toast.error("WhatsApp signup was cancelled");
          return;
        }
        const started = Date.now();
        while (!session.waba_id && Date.now() - started < 4000) {
          await new Promise((resolve) => window.setTimeout(resolve, 200));
        }
        try {
          await completeWhatsAppEmbeddedSignup({
            code,
            waba_id: session.waba_id || undefined,
            phone_number_id: session.phone_number_id || undefined,
          });
          toast.success("WhatsApp connected");
          await reload();
          setPending(null);
        } catch (error) {
          toast.error(error instanceof ApiError ? error.detail : "WhatsApp signup failed");
        } finally {
          stop();
          setBusy(false);
        }
      })();
    });
  }

  const profileItem = profileChannel ? items.find((item) => item.id === profileChannel) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Channels"
        description="Connect Instagram, Messenger, Facebook, Threads, X, WhatsApp, LinkedIn, and Gmail in one inbox."
        actions={
          <Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void resetAll()}>
            Reset all
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading
          ? catalog.map((item, index) => <ChannelCardSkeleton key={item.id} index={index} />)
          : items.map((channel, index) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                live={LIVE.has(channel.id)}
                loading={loading}
                busy={busy}
                syncing={syncing}
                index={index}
                onConnect={() => setPending(channel)}
                onProfile={() => void openProfile(channel.id)}
                onSync={() => void syncChannelInbox(channel.id)}
              />
            ))}
      </div>

      <ChannelProfileDialog
        channelId={profileChannel || "instagram"}
        channelName={profileItem?.name || "Channel"}
        open={Boolean(profileChannel)}
        loading={profileLoading}
        profile={profile}
        onOpenChange={(open) => {
          if (!open) {
            setProfileChannel(null);
            setProfile(null);
          }
        }}
        onRefresh={() => void refreshProfile()}
      />

      <Dialog open={!!pending} onOpenChange={() => !busy && setPending(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pending?.connected ? "Disconnect" : "Connect"} {pending?.name}
            </DialogTitle>
            <DialogDescription>
              {pending?.connected
                ? "This removes the live connection for this workspace. Your inbox history stays intact."
                : pending?.id === "whatsapp"
                  ? "Continue with Meta to connect an existing WhatsApp number or add a new one. Cloud API paste is only if you already have a token."
                  : pending?.id === "linkedin"
                    ? "Sign in with LinkedIn to connect your Company Page. Comments sync to Inbox → Comments; Page DMs need Messaging API partner access."
                  : pending?.id === "instagram"
                    ? "Link your Instagram professional account through Facebook Page or Instagram Login."
                  : pending?.id === "threads"
                    ? "Authorize KoLink on Threads (separate from Facebook Login). Replies and @mentions appear in Inbox → Comments."
                    : pending?.id === "x"
                      ? "Authorize KoLink on X (Twitter). Mentions appear in Comments; DMs appear in All chats if your X app has DM access."
                    : pending?.id === "email"
                      ? "Sign in with Google to connect your Gmail. Incoming mail and replies appear in Inbox → Email."
                    : pending?.id === "messenger" || pending?.id === "facebook"
                      ? "Sign in with the Facebook account that manages your Page. KoLink connects one Page — DMs must be sent to that exact Page (1:1, not group). Both Facebook accounts must be App Testers in Meta → App roles."
                      : "Starts OAuth when available, otherwise uses dev credentials."}
            </DialogDescription>
          </DialogHeader>
          {pending?.id === "whatsapp" && !pending.connected ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
                This workspace gets <strong>its own</strong> WhatsApp number. Meta’s Embedded Signup lets
                the client connect a number they already use (including WhatsApp Business app) or add a new
                one. Messages stay in this inbox.
              </p>
              {meta?.whatsapp_embedded_signup?.ready ? (
                <p className="text-xs text-muted-foreground">
                  In the Meta popup they can pick an existing number, verify a number they own, or claim a
                  555 number if Meta offers it. Then they add a payment method on their WhatsApp Business
                  account.
                </p>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {meta?.whatsapp_embedded_signup?.next_step ||
                    "Finish Become Tech Provider in Meta, then set WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID on the API."}
                </p>
              )}
              {waAdvanced ? (
                <>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Phone number ID</p>
                    <input
                      className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                      placeholder="123456789012345"
                      value={waPhoneId}
                      onChange={(e) => setWaPhoneId(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Access token</p>
                    <input
                      type="password"
                      className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                      placeholder="EAAG…"
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      WhatsApp Business Account ID (recommended)
                    </p>
                    <input
                      className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                      placeholder="WABA ID"
                      value={waWaba}
                      onChange={(e) => setWaWaba(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                  onClick={() => setWaAdvanced(true)}
                >
                  I already have Cloud API credentials
                </button>
              )}
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Webhook callback URL</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {meta?.webhook_callback_url || webhookUrl("meta")}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                KoLink’s Meta app receives all client WhatsApp webhooks at that URL. Verify token is{" "}
                <code className="text-xs">META_VERIFY_TOKEN</code>. Subscribe to{" "}
                <strong>messages</strong>, <strong>message_status</strong>, and <strong>account_update</strong>.
              </p>
            </div>
          ) : null}
          {pending?.id === "linkedin" && !pending.connected ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Sign in with a LinkedIn user who <strong>admins a Company Page</strong>. Page comments sync to
                Inbox → LinkedIn → Comments. Personal profile comments and DMs are not available via LinkedIn’s API.
              </p>
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
                KoLink OAuth uses <strong>Community Management</strong> scopes (Page comments). Do not add{" "}
                <code className="text-xs">openid</code> unless you also add the{" "}
                <strong>Sign In with LinkedIn using OpenID Connect</strong> product and set{" "}
                <code className="text-xs">LINKEDIN_SIGNIN_SCOPES=true</code> on the API server.
              </p>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">OAuth redirect URI</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {meta?.oauth_redirects?.linkedin || oauthCallbackUrl("linkedin")}
                </code>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Webhook URL</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {webhookUrl("linkedin")}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Set <code className="text-xs">LINKEDIN_CLIENT_ID</code> and{" "}
                <code className="text-xs">LINKEDIN_CLIENT_SECRET</code> on the API server, restart, then click
                Confirm to sign in with LinkedIn.
              </p>
            </div>
          ) : null}
          {pending?.id === "email" && !pending.connected ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
                Enable <strong>Gmail API</strong> in Google Cloud Console, create an OAuth <strong>Web client</strong>,
                then put Client ID / Secret in <code className="text-xs">GMAIL_CLIENT_ID</code> and{" "}
                <code className="text-xs">GMAIL_CLIENT_SECRET</code>. Add this exact redirect URI to the client.
              </p>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Authorized redirect URI</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {meta?.oauth_redirects?.gmail || oauthCallbackUrl("gmail")}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                After connecting, Primary mail appears in Inbox → Email. Promotions stay hidden until you tap
                Promotions. Replies, attachments, and delete use Gmail. If delete fails, reconnect Gmail so KoLink
                can request the extra Gmail permission.
              </p>
            </div>
          ) : null}
          {pending?.id === "messenger" || pending?.id === "facebook" ? (
            !pending.connected ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Add this to Meta → Facebook Login → Settings → Valid OAuth Redirect URIs
                  </p>
                  <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                    {meta?.oauth_redirects?.meta || oauthCallbackUrl("meta")}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      const uri =
                        meta?.oauth_redirects?.meta || oauthCallbackUrl("meta");
                      try {
                        await navigator.clipboard.writeText(uri);
                        toast.success("Redirect URI copied — paste in Meta dashboard");
                      } catch {
                        toast.message(uri);
                      }
                    }}
                  >
                    Copy redirect URI
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional: paste a Facebook Page ID to connect a specific Page (e.g. Skumar webtech
                  1173079159214239). Leave blank to auto-pick the Page with linked Instagram.
                </p>
                <input
                  className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                  placeholder="Facebook Page ID (optional)"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                />
              </div>
            ) : null
          ) : null}
          {pending?.id === "instagram" && !pending.connected ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">OAuth redirect URI</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {meta?.oauth_redirects?.instagram || oauthCallbackUrl("instagram")}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const uri =
                    meta?.oauth_redirects?.instagram || oauthCallbackUrl("instagram");
                  try {
                    await navigator.clipboard.writeText(uri);
                    toast.success("Redirect URI copied");
                  } catch {
                    toast.message(uri);
                  }
                }}
              >
                Copy redirect URI
              </Button>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setPending(null)} disabled={busy}>
              Cancel
            </Button>
            {pending?.id === "instagram" && !pending.connected ? (
              <Button variant="outline" onClick={() => void confirm("instagram")} disabled={busy}>
                {busy ? "Working…" : "Instagram Login"}
              </Button>
            ) : null}
            {pending?.id === "whatsapp" && !pending.connected && !waAdvanced ? (
              <Button onClick={launchWhatsAppMeta} disabled={busy || !meta?.whatsapp_embedded_signup?.ready}>
                {busy ? "Working…" : "Continue with Meta"}
              </Button>
            ) : (
              <Button
                onClick={() => void confirm(pending?.id === "instagram" ? "facebook" : undefined)}
                disabled={
                  busy ||
                  (pending?.id === "whatsapp" &&
                    !pending.connected &&
                    (!waPhoneId.trim() || !waToken.trim()))
                }
              >
                {busy
                  ? "Working…"
                  : pending?.id === "email" && !pending.connected
                    ? "Continue with Google"
                    : pending?.id === "whatsapp" && !pending.connected
                      ? "Connect this number"
                    : pending?.id === "instagram" && !pending.connected
                      ? "Connect via Facebook Page"
                      : "Confirm"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
