"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Inbox,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  RefreshCw,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { ChannelBadge } from "@/components/channel-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { isPromoEmail, type InboxThread } from "@/lib/api/inbox";
import type { Contact } from "@/lib/mock";
import { cn, formatRelativeTime } from "@/lib/utils";

const PROFILE_KEYS = new Set([
  "profile_picture_url",
  "follower_count",
  "follows_count",
  "media_count",
  "follows_you",
  "you_follow",
  "is_verified",
  "biography",
  "website",
  "first_name",
  "last_name",
  "locale",
  "facebook_profile_url",
  "facebook_inbox_url",
  "threads_profile_url",
  "telegram_profile_url",
  "telegram_username",
  "linkedin_profile_url",
  "linkedin_vanity",
  "headline",
]);

const HIDDEN_FIELD_KEYS = new Set([
  "deleted_message_ids",
  "_deleted_message_ids",
  "_profile_fetched_at",
  "in_directory",
]);

function formatCount(value: string | undefined) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value || "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 10_000) return `${Math.round(num / 1_000)}K`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
}

function isNumericId(value: string | undefined) {
  return Boolean(value && /^\d{8,}$/.test(value.trim()));
}

function looksLikeLinkedInPersonId(value: string | undefined) {
  const text = (value || "").trim();
  return /^[A-Z0-9_-]{8,16}$/.test(text) && /\d/.test(text);
}

function linkedinSubtitle(contact: Contact, fields: Record<string, string>) {
  const vanity = (fields.linkedin_vanity || "").replace(/^@/, "").trim();
  if (vanity) return `@${vanity}`;
  const handle = (contact.handle || "").replace(/^@/, "").trim();
  if (handle && !looksLikeLinkedInPersonId(handle) && !/^(member|linkedin|linkedin member)$/i.test(handle)) {
    return `@${handle}`;
  }
  return "";
}

function instagramUrl(handle: string) {
  const username = handle.replace(/^@/, "").trim();
  return username && !isNumericId(username) ? `https://www.instagram.com/${username}/` : null;
}

function facebookSubtitle(contact: Contact, fields: Record<string, string>) {
  const parts = [fields.first_name, fields.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (fields.locale) return fields.locale.replace("_", "-");
  if (contact.handle && !isNumericId(contact.handle)) return contact.handle;
  return contact.channel === "messenger" ? "Messenger contact" : "Facebook contact";
}

function emailAddress(contact: Contact) {
  const value = (contact.email || contact.handle || "").trim();
  return value.includes("@") ? value : "";
}

function emailDomain(address: string) {
  return address.split("@")[1] || "";
}

function digits(value: string | undefined) {
  return (value || "").replace(/\D/g, "");
}

function profileAction(contact: Contact, fields: Record<string, string>): { href: string; label: string } | null {
  const email = emailAddress(contact);
  if (contact.channel === "email" && email) {
    return {
      href: `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`from:${email}`)}`,
      label: "Find in Gmail",
    };
  }
  if (contact.channel === "instagram") {
    const url = instagramUrl(contact.handle);
    return url ? { href: url, label: "View on Instagram" } : null;
  }
  if (contact.channel === "threads") {
    const url = fields.threads_profile_url?.trim() || (contact.handle ? `https://www.threads.net/@${contact.handle.replace(/^@/, "")}` : "");
    return url ? { href: url, label: "View on Threads" } : null;
  }
  if (contact.channel === "telegram") {
    const url = fields.telegram_profile_url?.trim() || (contact.handle ? `https://t.me/${contact.handle.replace(/^@/, "")}` : "");
    return url ? { href: url, label: "View on Telegram" } : null;
  }
  if (contact.channel === "whatsapp") {
    const phone = digits(contact.phone || contact.handle);
    return phone ? { href: `https://wa.me/${phone}`, label: "Open in WhatsApp" } : null;
  }
  if (contact.channel === "linkedin") {
    const vanity = (fields.linkedin_vanity || contact.handle || "").replace(/^@/, "").trim();
    const url =
      fields.linkedin_profile_url?.trim() ||
      (vanity && !looksLikeLinkedInPersonId(vanity) ? `https://www.linkedin.com/in/${vanity}` : "");
    return url ? { href: url, label: "View on LinkedIn" } : null;
  }
  if (contact.channel === "x") {
    const user = contact.handle.replace(/^@/, "").trim();
    return user && !isNumericId(user) ? { href: `https://x.com/${user}`, label: "View on X" } : null;
  }
  if (contact.channel === "facebook" || contact.channel === "messenger") {
    const url = fields.facebook_profile_url?.trim() || fields.facebook_inbox_url?.trim() || "";
    return url ? { href: url, label: "View on Facebook" } : null;
  }
  return null;
}

function mailboxLabel(
  thread: Pick<InboxThread, "gmailCategory" | "channel" | "preview" | "subject"> | null | undefined,
  contact: Contact,
  promo: boolean,
) {
  const cat = (thread?.gmailCategory || "").toLowerCase();
  if (cat === "social") return "Social";
  if (cat === "updates") return "Updates";
  if (cat === "promotions" || promo) return "Promotions";
  if (contact.channel === "email") return "Primary";
  return "";
}

function formatActivity(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const absolute = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatRelativeTime(iso)} · ${absolute}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  copy,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  copy?: boolean;
}) {
  return (
    <div className="glass-field flex items-start gap-3 rounded-xl px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all text-sm">{value}</p>
      </div>
      {copy ? (
        <button
          type="button"
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-white/80 hover:text-foreground"
          aria-label={`Copy ${label}`}
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export function ContactProfileSheet({
  contact,
  thread,
  open,
  onOpenChange,
  onRefreshProfile,
}: {
  contact: Contact | null | undefined;
  thread?: Pick<
    InboxThread,
    "subject" | "gmailCategory" | "state" | "assignedTo" | "unread" | "updatedAt" | "channel" | "preview" | "labels"
  > | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshProfile?: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  if (!contact) return null;

  const fields = contact.fields;
  const followers = fields.follower_count;
  const following = fields.follows_count;
  const posts = fields.media_count;
  const bio = (fields.biography || fields.headline || "").trim();
  const website = fields.website?.trim();
  const verified = fields.is_verified === "true";
  const followsYou = fields.follows_you === "true";
  const youFollow = fields.you_follow === "true";
  const isMetaDm = contact.channel === "messenger" || contact.channel === "facebook";
  const isThreads = contact.channel === "threads";
  const isEmail = contact.channel === "email";
  const isLinkedIn = contact.channel === "linkedin";
  const contactChannel = contact.channel;
  const instagramProfileUrl = contact.channel === "instagram" ? instagramUrl(contact.handle) : null;
  const threadsProfileUrl = fields.threads_profile_url?.trim() || (contact.handle ? `https://www.threads.net/@${contact.handle.replace(/^@/, "")}` : null);
  const emailMailto = emailAddress(contact);
  const action = profileAction(contact, fields);
  const hasStats = Boolean(followers || following || posts);
  const extraFields = Object.entries(fields).filter(
    ([key, value]) =>
      !PROFILE_KEYS.has(key) &&
      !HIDDEN_FIELD_KEYS.has(key) &&
      !key.startsWith("_") &&
      value.trim(),
  );
  const subtitle = isEmail
    ? emailMailto
    : isMetaDm
      ? facebookSubtitle(contact, fields)
      : isLinkedIn
        ? linkedinSubtitle(contact, fields)
        : contact.handle;
  const city = contact.city?.trim();
  const language = contact.language?.trim();
  const lastSeen = (thread?.updatedAt || contact.lastSeen || "").trim();
  const promo = isEmail && isPromoEmail({ ...thread, contact, channel: "email" });
  const folder = mailboxLabel(thread, contact, promo);
  const subject = thread?.subject || thread?.preview;
  const threadLabels = thread?.labels ?? [];
  const showEmptyHint =
    !isEmail &&
    !bio &&
    !website &&
    !contact.email &&
    !contact.phone &&
    !contact.notes &&
    contact.tags.length === 0 &&
    !city &&
    !language &&
    !fields.first_name &&
    !fields.last_name &&
    !fields.locale &&
    !fields.headline &&
    !fields.linkedin_profile_url &&
    !fields.linkedin_vanity &&
    !isLinkedIn;

  async function refreshProfile() {
    if (!onRefreshProfile) return;
    setRefreshing(true);
    try {
      await onRefreshProfile();
      toast.success(
        contactChannel === "instagram"
          ? "Profile updated from Instagram"
          : contactChannel === "threads"
            ? "Profile updated from Threads"
              : contactChannel === "telegram"
                ? "Profile updated from Telegram"
                : contactChannel === "linkedin"
                  ? "Profile updated from LinkedIn"
                  : contactChannel === "email"
                    ? "Profile updated from Gmail"
                    : "Profile updated from Facebook",
      );
    } catch {
      toast.error("Could not refresh profile");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="glass-strong w-full border-l border-white/40 p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/35 bg-gradient-to-br from-[#fdf2f8] via-white to-[#eff6ff] px-5 pb-6 pt-10 text-center">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-pink-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 top-16 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />

            <div className="relative mx-auto w-fit">
              <ContactAvatar
                contact={contact}
                className="h-28 w-28 border-4 border-white shadow-xl ring-1 ring-black/5"
                fallbackClassName="text-3xl"
              />
              {verified ? (
                <span className="absolute bottom-1 right-1 rounded-full bg-white p-0.5 shadow">
                  <BadgeCheck className="h-5 w-5 text-[#0095F6]" />
                </span>
              ) : null}
            </div>

            <SheetTitle className="relative mt-4 truncate text-2xl font-semibold">{contact.name}</SheetTitle>
            {subtitle ? (
              <SheetDescription className="relative truncate text-base">{subtitle}</SheetDescription>
            ) : null}

            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
              <ChannelBadge channel={contact.channel} />
              {folder ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    folder === "Promotions" || folder === "Social"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-sky-50 text-sky-800",
                  )}
                >
                  {folder}
                </Badge>
              ) : null}
              {followsYou ? (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  Follows you
                </Badge>
              ) : null}
              {youFollow ? (
                <Badge variant="secondary" className="bg-sky-50 text-sky-700">
                  You follow
                </Badge>
              ) : null}
            </div>

            {hasStats ? (
              <div className="relative mx-auto mt-6 flex max-w-xs rounded-2xl border border-white/70 bg-white/70 px-2 py-3 shadow-sm backdrop-blur">
                {posts ? <Stat label="Posts" value={formatCount(posts)} /> : null}
                {followers ? <Stat label="Followers" value={formatCount(followers)} /> : null}
                {following ? <Stat label="Following" value={formatCount(following)} /> : null}
              </div>
            ) : null}
          </div>

          <ScrollArea className="flex-1 px-5 py-4">
            {isMetaDm ? (
              <section className="mb-4 space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Facebook profile
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      {contact.channel === "messenger"
                        ? "Details come from the Page conversation. Meta does not expose the full public profile for Messenger contacts."
                        : "Public commenter details from your Facebook Page."}
                    </p>
                  </div>
                  {onRefreshProfile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={refreshing}
                      onClick={() => void refreshProfile()}
                      aria-label="Refresh profile"
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  ) : null}
                </div>
                <dl className="space-y-2 text-sm">
                  {fields.first_name ? (
                    <div className="glass-field flex items-center justify-between rounded-xl px-3 py-2.5">
                      <dt className="text-muted-foreground">First name</dt>
                      <dd className="font-medium">{fields.first_name}</dd>
                    </div>
                  ) : null}
                  {fields.last_name ? (
                    <div className="glass-field flex items-center justify-between rounded-xl px-3 py-2.5">
                      <dt className="text-muted-foreground">Last name</dt>
                      <dd className="font-medium">{fields.last_name}</dd>
                    </div>
                  ) : null}
                  {fields.locale ? (
                    <div className="glass-field flex items-center gap-3 rounded-xl px-3 py-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 text-left">
                        <dt className="text-xs text-muted-foreground">Locale</dt>
                        <dd>{fields.locale}</dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            {contact.channel === "instagram" && instagramProfileUrl ? (
              <section className="mb-4 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Follow relationship
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      {youFollow
                        ? "Your business account follows this person on Instagram."
                        : "Your business account does not follow this person yet."}
                    </p>
                  </div>
                  {onRefreshProfile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={refreshing}
                      onClick={() => void refreshProfile()}
                      aria-label="Refresh follow status"
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Meta does not allow follow or unfollow from third-party apps. Open Instagram to change it, then
                  refresh here.
                </p>
                <Button className="mt-3 w-full" variant={youFollow ? "outline" : "default"} asChild>
                  <a href={instagramProfileUrl} target="_blank" rel="noopener noreferrer">
                    {youFollow ? (
                      <>
                        <UserRound className="mr-2 h-4 w-4" />
                        Manage on Instagram
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow on Instagram
                      </>
                    )}
                  </a>
                </Button>
              </section>
            ) : null}

            {isThreads && threadsProfileUrl ? (
              <section className="mb-4 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Threads profile
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      Public profile details from Threads when Meta allows profile lookup for this account.
                    </p>
                  </div>
                  {onRefreshProfile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={refreshing}
                      onClick={() => void refreshProfile()}
                      aria-label="Refresh Threads profile"
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  ) : null}
                </div>
                <Button className="mt-3 w-full" variant="outline" asChild>
                  <a href={threadsProfileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Threads
                  </a>
                </Button>
              </section>
            ) : null}

            {isLinkedIn ? (
              <section className="mb-4 space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      LinkedIn profile
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      {fields.linkedin_vanity || bio
                        ? "Name, photo, and headline from LinkedIn when the comment includes them or this is the connected account."
                        : "LinkedIn does not give apps other people's full profiles. Tap refresh — if this is the connected LinkedIn user, name and photo will load."}
                    </p>
                  </div>
                  {onRefreshProfile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={refreshing}
                      onClick={() => void refreshProfile()}
                      aria-label="Refresh LinkedIn profile"
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  ) : null}
                </div>
                {fields.linkedin_vanity ? (
                  <dl className="space-y-2 text-sm">
                    <div className="glass-field flex items-center justify-between rounded-xl px-3 py-2.5">
                      <dt className="text-muted-foreground">Profile</dt>
                      <dd>@{fields.linkedin_vanity.replace(/^@/, "")}</dd>
                    </div>
                  </dl>
                ) : null}
              </section>
            ) : null}

            {isEmail ? (
              <section className="mb-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email details</p>
                {emailMailto ? <InfoRow icon={Mail} label="Address" value={emailMailto} copy /> : null}
                {emailMailto ? <InfoRow icon={Globe} label="Domain" value={emailDomain(emailMailto)} /> : null}
                {folder ? (
                  <InfoRow icon={promo ? Megaphone : Inbox} label="Mailbox" value={folder} />
                ) : null}
                {subject ? <InfoRow icon={Mail} label="Latest subject" value={subject} /> : null}
                {lastSeen ? <InfoRow icon={Clock} label="Last activity" value={formatActivity(lastSeen)} /> : null}
                {thread?.state ? (
                  <InfoRow
                    icon={Inbox}
                    label="Conversation"
                    value={
                      thread.state === "open"
                        ? thread.unread
                          ? `Open · ${thread.unread} unread`
                          : "Open"
                        : "Closed"
                    }
                  />
                ) : null}
                {thread?.assignedTo ? <InfoRow icon={UserRound} label="Assigned to" value={thread.assignedTo} /> : null}
                {contact.status === "unsubscribed" ? (
                  <InfoRow icon={UserRound} label="Status" value="Unsubscribed" />
                ) : null}
                {city ? <InfoRow icon={MapPin} label="City" value={city} /> : null}
                {language ? <InfoRow icon={Globe} label="Language" value={language} /> : null}
              </section>
            ) : lastSeen || city || language ? (
              <section className="mb-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact details</p>
                {lastSeen ? <InfoRow icon={Clock} label="Last activity" value={formatActivity(lastSeen)} /> : null}
                {city ? <InfoRow icon={MapPin} label="City" value={city} /> : null}
                {language ? <InfoRow icon={Globe} label="Language" value={language} /> : null}
              </section>
            ) : null}

            {bio ? (
              <section className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{bio}</p>
              </section>
            ) : null}

            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-[#0095F6] transition hover:bg-white"
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate">{website.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
              </a>
            ) : null}

            {contact.tags.length > 0 || threadLabels.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={`tag-${tag}`} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {threadLabels
                  .filter((label) => !contact.tags.includes(label))
                  .map((label) => (
                    <Badge key={`label-${label}`} variant="secondary">
                      {label}
                    </Badge>
                  ))}
              </div>
            ) : null}

            {(!isEmail && (contact.email || contact.phone)) || extraFields.length > 0 ? (
              <dl className="space-y-2 text-sm">
                {!isEmail && contact.email ? (
                  <div className="glass-field flex items-start gap-3 rounded-xl px-3 py-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="break-all">{contact.email}</dd>
                    </div>
                  </div>
                ) : null}
                {!isEmail && contact.phone ? (
                  <div className="glass-field flex items-start gap-3 rounded-xl px-3 py-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd>{contact.phone}</dd>
                    </div>
                  </div>
                ) : null}
                {extraFields.map(([key, value]) => (
                  <div key={key} className="glass-field flex items-start justify-between gap-3 rounded-xl px-3 py-2.5">
                    <dt className="capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {contact.notes ? (
              <div className="glass-field mt-4 rounded-xl px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{contact.notes}</p>
              </div>
            ) : null}

            {showEmptyHint ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isMetaDm
                  ? "Open this chat once or tap refresh to load Facebook profile details from Meta."
                  : contactChannel === "telegram"
                    ? "Open this chat once or tap refresh to load Telegram profile details."
                    : "Instagram profile details will appear here when available from Meta."}
              </p>
            ) : null}
          </ScrollArea>

          <div className="space-y-2 border-t border-white/35 p-4">
            {isEmail && emailMailto ? (
              <Button className="w-full bg-[#007AFF] text-white hover:brightness-110" asChild>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailMailto)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Compose in Gmail
                </a>
              </Button>
            ) : null}
            {action ? (
              <Button className="w-full" variant="outline" asChild>
                <a href={action.href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {action.label}
                </a>
              </Button>
            ) : null}
            {!isEmail ? (
              <Button
                className={cn("w-full", action && "bg-[#007AFF] text-white hover:brightness-110")}
                variant={action ? "default" : "outline"}
                onClick={() => {
                  toast("Automation queued for this contact");
                  onOpenChange(false);
                }}
              >
                Run automation
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
