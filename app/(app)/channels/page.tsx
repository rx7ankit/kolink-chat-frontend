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
  confirmTelegramPassword,
  connectChannelDev,
  connectWhatsApp,
  disconnectAllChannels,
  disconnectChannel,
  getChannelProfile,
  getMetaStatus,
  listChannels,
  startChannelOAuth,
  startTelegramLogin,
  syncChannel,
  verifyTelegramLogin,
  type ApiChannel,
  type ChannelProfile,
  type MetaStatus,
} from "@/lib/api/channels";
import { ApiError } from "@/lib/api/client";
import { channels as catalog } from "@/lib/mock";
import type { Channel, ChannelId } from "@/lib/mock";

const LIVE = new Set(["whatsapp", "instagram", "messenger", "facebook", "threads", "x", "telegram", "email", "linkedin"]);
const PROFILE_CHANNELS = new Set<ChannelId>(["instagram", "facebook", "messenger", "threads", "x", "telegram", "email", "linkedin"]);

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
  const [tgStep, setTgStep] = useState<"phone" | "code" | "password">("phone");
  const [tgPhone, setTgPhone] = useState("");
  const [tgCode, setTgCode] = useState("");
  const [tgPassword, setTgPassword] = useState("");

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
    if (!["instagram", "messenger", "facebook", "whatsapp"].includes(pending.id)) return;
    void getMetaStatus()
      .then(setMeta)
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

  useEffect(() => {
    if (pending?.id === "telegram" && !pending.connected) {
      setTgStep("phone");
      setTgPhone("");
      setTgCode("");
      setTgPassword("");
    }
  }, [pending]);

  async function submitTelegramLogin() {
    setBusy(true);
    try {
      if (tgStep === "phone") {
        const res = await startTelegramLogin(tgPhone.trim());
        toast.success(res.detail);
        setTgStep("code");
        return;
      }
      if (tgStep === "code") {
        const res = await verifyTelegramLogin(tgCode.trim());
        if (res.needs_password) {
          toast.message("Enter your Telegram cloud password (2FA)");
          setTgStep("password");
          return;
        }
        if (res.connected) {
          toast.success("Telegram connected");
          await reload();
          setPending(null);
        }
        return;
      }
      const res = await confirmTelegramPassword(tgPassword);
      if (res.connected) {
        toast.success("Telegram connected");
        await reload();
        setPending(null);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Telegram login failed");
    } finally {
      setBusy(false);
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
        await connectWhatsApp();
        toast.success(`${pending.name} connected from server credentials`);
      } else if (pending.id === "telegram") {
        await submitTelegramLogin();
        return;
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

  const profileItem = profileChannel ? items.find((item) => item.id === profileChannel) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Channels"
        description="Connect Instagram, Messenger, Facebook, Threads, X, WhatsApp, Telegram, LinkedIn, and Gmail in one inbox."
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
                  ? "Uses WhatsApp Cloud API credentials from your server environment (WHATSAPP_* in API .env). No manual tokens needed."
                  : pending?.id === "linkedin"
                    ? "Sign in with LinkedIn to connect your Company Page. Comments sync to Inbox → Comments; Page DMs need Messaging API partner access."
                  : pending?.id === "telegram"
                    ? "Sign in with your personal Telegram account (phone + code from the Telegram app). Messages sync from your private chats."
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
              {meta?.whatsapp.configured && meta.whatsapp.ok ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Server credentials ready
                  {(() => {
                    const phone = (meta.whatsapp.details as { phone?: { display_phone_number?: string } })?.phone;
                    return phone?.display_phone_number ? ` · ${phone.display_phone_number}` : "";
                  })()}
                  . Click Confirm to connect.
                </p>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {meta?.whatsapp.next_step ||
                    "Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID on the API server, then try again."}
                </p>
              )}
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Webhook callback URL (Meta → WhatsApp → Configuration)</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {meta?.webhook_callback_url || "https://api.kolink.tech/api/v1/webhooks/meta"}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Verify token: same as <code className="text-xs">META_VERIFY_TOKEN</code> on your API server.
                Subscribe to <strong>messages</strong> and <strong>message_status</strong>.
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
                  {(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "")}/channels/oauth/linkedin/callback
                </code>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Webhook URL</p>
                <code className="block break-all rounded-lg bg-black/5 px-2 py-1.5 text-xs">
                  {(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "")}/webhooks/linkedin
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Set <code className="text-xs">LINKEDIN_CLIENT_ID</code> and{" "}
                <code className="text-xs">LINKEDIN_CLIENT_SECRET</code> on the{" "}
                <strong>API server</strong> (the host in{" "}
                <code className="text-xs">NEXT_PUBLIC_API_URL</code>, currently{" "}
                {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}), restart the API, then click Confirm to
                sign in with LinkedIn.
              </p>
            </div>
          ) : null}
          {pending?.id === "telegram" && !pending.connected ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
                Your server admin must set <code className="text-xs">TELEGRAM_API_ID</code> and{" "}
                <code className="text-xs">TELEGRAM_API_HASH</code> from{" "}
                <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="underline">
                  my.telegram.org/apps
                </a>
                . KoLink stores an encrypted session for your workspace — replies send as you, not a bot.
              </p>
              {tgStep === "phone" ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Phone number (with country code)</p>
                  <input
                    className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                    placeholder="+919876543210"
                    value={tgPhone}
                    onChange={(e) => setTgPhone(e.target.value)}
                  />
                </div>
              ) : null}
              {tgStep === "code" ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Login code from Telegram</p>
                  <input
                    className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                    placeholder="12345"
                    value={tgCode}
                    onChange={(e) => setTgCode(e.target.value)}
                  />
                </div>
              ) : null}
              {tgStep === "password" ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Telegram cloud password (2FA)</p>
                  <input
                    type="password"
                    className="w-full rounded-lg border bg-white/70 px-3 py-2 text-sm"
                    value={tgPassword}
                    onChange={(e) => setTgPassword(e.target.value)}
                  />
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                After connecting, use Sync on the Telegram card or wait for automatic sync. Private chats appear in
                Inbox → Telegram.
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
                  https://api.kolink.tech/api/v1/channels/oauth/gmail/callback
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
                    {meta?.oauth_redirects?.meta ||
                      "https://api.kolink.tech/api/v1/channels/oauth/meta/callback"}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      const uri =
                        meta?.oauth_redirects?.meta ||
                        "https://api.kolink.tech/api/v1/channels/oauth/meta/callback";
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
                  {meta?.oauth_redirects?.meta || "http://localhost:8000/api/v1/channels/oauth/meta/callback"}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const uri =
                    meta?.oauth_redirects?.meta ||
                    "http://localhost:8000/api/v1/channels/oauth/meta/callback";
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
            <Button
              onClick={() => void confirm(pending?.id === "instagram" ? "facebook" : undefined)}
              disabled={busy}
            >
              {busy
                ? "Working…"
                : pending?.id === "email" && !pending.connected
                  ? "Continue with Google"
                  : pending?.id === "telegram" && !pending.connected
                  ? tgStep === "phone"
                    ? "Send code"
                    : tgStep === "code"
                      ? "Verify code"
                      : "Sign in"
                  : pending?.id === "instagram" && !pending.connected
                    ? "Connect via Facebook Page"
                    : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
