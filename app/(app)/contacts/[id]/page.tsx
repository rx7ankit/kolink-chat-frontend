"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ChannelBadge } from "@/components/channel-badge";
import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { PageHeader } from "@/components/page-header";
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
import { Textarea } from "@/components/ui/textarea";
import {
  deleteContact,
  getContact,
  listContactConversations,
  updateContact,
  type ContactThread,
} from "@/lib/api/contacts";
import { ApiError } from "@/lib/api/client";
import type { Contact } from "@/lib/mock";
import { formatRelativeTime } from "@/lib/utils";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [history, setHistory] = useState<ContactThread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    handle: "",
    city: "",
    language: "",
    notes: "",
    status: "subscribed" as Contact["status"],
    tags: [] as string[],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [row, threads] = await Promise.all([
          getContact(params.id),
          listContactConversations(params.id),
        ]);
        if (cancelled) return;
        setContact(row);
        setHistory(threads);
        setForm({
          name: row.name,
          email: row.email || "",
          phone: row.phone || "",
          handle: row.handle || "",
          city: row.city || "",
          language: row.language || "",
          notes: row.notes || "",
          status: row.status,
          tags: row.tags,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          router.replace("/contacts");
          return;
        }
        setError(err instanceof ApiError ? err.detail : "Failed to load contact");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function save() {
    if (!contact) return;
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const row = await updateContact(contact.id, {
        name,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        handle: form.handle.trim() || null,
        city: form.city.trim() || null,
        language: form.language.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
        tags: form.tags,
      });
      setContact(row);
      toast.success("Contact saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not save contact");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!contact) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contact deleted");
      router.replace("/contacts");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not delete contact");
    }
  }

  function addTag() {
    const value = tagDraft.trim();
    if (!value || form.tags.includes(value)) {
      setTagDraft("");
      return;
    }
    setForm((current) => ({ ...current, tags: [...current.tags, value] }));
    setTagDraft("");
  }

  function copy(value: string, label: string) {
    void navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  if (error) {
    return <p className="page-shell text-sm text-destructive">{error}</p>;
  }
  if (!contact) {
    return <p className="page-shell text-sm text-muted-foreground">Loading…</p>;
  }

  const chatHref = history[0] ? `/inbox?contact=${contact.id}&thread=${history[0].id}` : `/inbox?contact=${contact.id}`;
  const extraFields = Object.entries(contact.fields).filter(
    ([key, value]) => value.trim() && !key.startsWith("_") && key !== "in_directory",
  );

  return (
    <div className="mx-auto max-w-3xl page-shell">
      <PageHeader
        title={form.name || contact.name}
        description={[form.city, form.language].filter(Boolean).join(" · ") || "Contact details"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/contacts">Back</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={chatHref}>Open in Inbox</Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              Save
            </Button>
          </div>
        }
      />

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <ContactAvatar contact={contact} className="h-14 w-14" fallbackClassName="text-lg" />
          <div>
            <ChannelBadge channel={contact.channel} />
            <p className="mt-2 text-sm text-muted-foreground">
              {contact.status === "unsubscribed" ? "Unsubscribed" : "Subscribed"} · Last seen{" "}
              {formatRelativeTime(contact.lastSeen)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field
            label="Handle"
            value={form.handle}
            onChange={(value) => setForm((current) => ({ ...current, handle: value }))}
          />
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="contact-email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              {form.email ? (
                <Button type="button" variant="outline" size="icon" onClick={() => copy(form.email, "Email")}>
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <div className="flex gap-2">
              <Input
                id="contact-phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              {form.phone ? (
                <Button type="button" variant="outline" size="icon" onClick={() => copy(form.phone, "Phone")}>
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
          <Field label="City" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
          <Field
            label="Language"
            value={form.language}
            onChange={(value) => setForm((current) => ({ ...current, language: value }))}
          />
          <div className="space-y-2">
            <Label htmlFor="contact-status">Status</Label>
            <select
              id="contact-status"
              className="glass-field h-9 w-full rounded-xl px-3 text-sm"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as Contact["status"] }))
              }
            >
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() =>
                setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }))
              }>
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex max-w-sm gap-2">
            <Input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag"
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="contact-notes">Notes</Label>
          <Textarea
            id="contact-notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Private notes about this person"
          />
        </div>

        {extraFields.length > 0 ? (
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {extraFields.map(([key, value]) => (
              <div key={key}>
                <dt className="capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Conversations</h2>
      <div className="space-y-2">
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">No stored conversations yet.</p>
        )}
        {history.map((thread) => (
          <Link
            key={thread.id}
            href={`/inbox?contact=${contact.id}&thread=${thread.id}`}
            className="glass block rounded-xl px-4 py-3 text-sm transition hover:bg-white/40"
          >
            <div className="flex items-center justify-between">
              <ChannelBadge channel={thread.channel} />
              <span className="text-xs text-muted-foreground">{formatRelativeTime(thread.updatedAt)}</span>
            </div>
            <p className="mt-2">{thread.preview || "No preview"}</p>
          </Link>
        ))}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {contact.name}?</DialogTitle>
            <DialogDescription>
              This removes the contact from KoLink and deletes stored conversations. Mail in Gmail is not changed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onDelete()}>
              Delete contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `contact-${label.toLowerCase()}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
