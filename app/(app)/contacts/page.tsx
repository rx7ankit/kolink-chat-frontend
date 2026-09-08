"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ChannelBadge, channelMeta } from "@/components/channel-badge";
import { ContactAvatar } from "@/components/inbox/contact-avatar";
import { PageHeader } from "@/components/page-header";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkDeleteContacts,
  bulkTagContacts,
  bulkUnsubscribeContacts,
  createContact,
  deleteContact,
  listContacts,
  listSegments,
  listTags,
  type SegmentRow,
  type TagRow,
} from "@/lib/api/contacts";
import { ApiError } from "@/lib/api/client";
import type { ChannelId, Contact } from "@/lib/mock";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatRelativeTime } from "@/lib/utils";

const CHANNELS = Object.keys(channelMeta) as ChannelId[];

export default function ContactsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [tag, setTag] = useState<string | "all">("all");
  const [channel, setChannel] = useState<"all" | ChannelId>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagValue, setTagValue] = useState("VIP");
  const [tagTargetIds, setTagTargetIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    channel: "email" as ChannelId,
    email: "",
    phone: "",
    handle: "",
  });
  const pageSize = 8;

  const reloadMeta = useCallback(async () => {
    const [seg, tagRows] = await Promise.all([listSegments(), listTags()]);
    setSegments(seg);
    setTags(tagRows);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContacts({
        q: query,
        segment,
        tag: tag === "all" ? undefined : tag,
        channel,
        page,
        pageSize,
      });
      setRows(result.items);
      setTotal(result.total);
      setPageCount(result.page_count);
      setSelected([]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [query, segment, tag, channel, page]);

  useEffect(() => {
    void reloadMeta();
  }, [reloadMeta]);

  useEffect(() => {
    const timer = setTimeout(() => void reload(), 200);
    return () => clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [query, segment, tag, channel]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map((row) => row.id) : []);
  }

  function openTag(ids: string[]) {
    setTagTargetIds(ids);
    setTagValue(tags[0]?.name || "VIP");
    setTagOpen(true);
  }

  function openDelete(ids: string[]) {
    setDeleteIds(ids);
    setDeleteOpen(true);
  }

  async function onBulkTag() {
    const value = tagValue.trim();
    if (!value) {
      toast.error("Enter a tag name");
      return;
    }
    try {
      const res = await bulkTagContacts(tagTargetIds, value);
      toast.success(res.detail);
      setTagOpen(false);
      await Promise.all([reload(), reloadMeta()]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not tag contacts");
    }
  }

  async function onBulkUnsubscribe(ids = selected) {
    try {
      const res = await bulkUnsubscribeContacts(ids);
      toast.success(res.detail);
      await Promise.all([reload(), reloadMeta()]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Unsubscribe failed");
    }
  }

  async function onDelete() {
    try {
      if (deleteIds.length === 1) {
        await deleteContact(deleteIds[0]);
        toast.success("Contact deleted");
      } else {
        const res = await bulkDeleteContacts(deleteIds);
        toast.success(res.detail);
      }
      setDeleteOpen(false);
      await Promise.all([reload(), reloadMeta()]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete contacts");
    }
  }

  async function onCreate() {
    const name = newContact.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (newContact.channel === "email" && !newContact.email.trim()) {
      toast.error("Email is required for email contacts");
      return;
    }
    setCreating(true);
    try {
      await createContact({
        name,
        channel: newContact.channel,
        email: newContact.email.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        handle: newContact.handle.trim() || newContact.email.trim() || undefined,
      });
      toast.success("Contact added");
      setCreateOpen(false);
      setNewContact({ name: "", channel: "email", email: "", phone: "", handle: "" });
      await Promise.all([reload(), reloadMeta()]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not add contact");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)]">
      <aside className="hidden w-52 shrink-0 border-r border-white/35 bg-white/25 p-4 backdrop-blur-xl md:block">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Segments
        </p>
        {segments.map((item) => (
          <button
            key={item.id}
            onClick={() => setSegment(item.id)}
            className={cn(
              "mb-0.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm",
              segment === item.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {item.name}
            <span className="text-xs">{item.count}</span>
          </button>
        ))}
        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tags
        </p>
        <button
          onClick={() => setTag("all")}
          className={cn(
            "mb-0.5 w-full rounded-lg px-2 py-1.5 text-left text-sm",
            tag === "all" ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
          )}
        >
          All tags
        </button>
        {tags.map((item) => (
          <button
            key={item.name}
            onClick={() => setTag(item.name)}
            className={cn(
              "mb-0.5 w-full rounded-lg px-2 py-1.5 text-left text-sm",
              tag === item.name ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {item.name}
            <span className="ml-1 text-xs text-muted-foreground">({item.count})</span>
          </button>
        ))}
      </aside>
      <div className="min-w-0 flex-1 page-shell">
        <PageHeader
          title={t("contacts.title")}
          description={`${total} ${t("contacts.inView")}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!selected.length} onClick={() => openTag(selected)}>
                Tag
              </Button>
              <Button
                variant="outline"
                disabled={!selected.length}
                onClick={() => void onBulkUnsubscribe()}
              >
                Unsubscribe
              </Button>
              <Button
                variant="outline"
                disabled={!selected.length}
                onClick={() => openDelete(selected)}
              >
                Delete
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add contact
              </Button>
            </div>
          }
        />
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {segments.map((item) => (
            <button
              key={item.id}
              onClick={() => setSegment(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                segment === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, handle, email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={channel} onValueChange={(value) => setChannel(value as "all" | ChannelId)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {CHANNELS.map((id) => (
                <SelectItem key={id} value={id}>
                  {channelMeta[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.length === rows.length && rows.length > 0}
                    onCheckedChange={(value) => toggleAll(Boolean(value))}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="hidden sm:table-cell">Tags</TableHead>
                <TableHead className="hidden md:table-cell">Last seen</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No people match these filters. Promotional and no-reply mailboxes stay in Inbox, not Contacts.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(contact.id)}
                      onCheckedChange={(value) =>
                        setSelected((current) =>
                          value
                            ? [...current, contact.id]
                            : current.filter((id) => id !== contact.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                      <ContactAvatar contact={contact} className="h-8 w-8" />
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.email || contact.handle || contact.phone || "No handle"}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={contact.channel} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        contact.tags.map((item) => (
                          <Badge key={item} variant="secondary">
                            {item}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatRelativeTime(contact.lastSeen)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/inbox?contact=${contact.id}`}>Chat</Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Contact actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contacts/${contact.id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/inbox?contact=${contact.id}`}>Open chat</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openTag([contact.id])}>Add tag</DropdownMenuItem>
                          {contact.status !== "unsubscribed" ? (
                            <DropdownMenuItem onSelect={() => void onBulkUnsubscribe([contact.id])}>
                              Unsubscribe
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => openDelete([contact.id])}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Dialog open={tagOpen} onOpenChange={setTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag contacts</DialogTitle>
            <DialogDescription>
              Apply a tag to {tagTargetIds.length} selected {tagTargetIds.length === 1 ? "person" : "people"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tag-name">Tag</Label>
            <Input
              id="tag-name"
              value={tagValue}
              onChange={(event) => setTagValue(event.target.value)}
              placeholder="VIP, Lead, Customer…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTagOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onBulkTag()}>Save tag</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteIds.length === 1 ? "contact" : "contacts"}?</DialogTitle>
            <DialogDescription>
              This removes {deleteIds.length === 1 ? "this person" : `${deleteIds.length} people`} from Contacts
              and deletes their stored conversations in KoLink. Email in Gmail is not changed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onDelete()}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription>Only people belong here. Brand and no-reply mailboxes stay in Inbox.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newContact.name}
                onChange={(event) => setNewContact((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={newContact.channel}
                onValueChange={(value) => setNewContact((current) => ({ ...current, channel: value as ChannelId }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {channelMeta[id].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newContact.email}
                onChange={(event) => setNewContact((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input
                id="new-phone"
                value={newContact.phone}
                onChange={(event) => setNewContact((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-handle">Handle</Label>
              <Input
                id="new-handle"
                value={newContact.handle}
                onChange={(event) => setNewContact((current) => ({ ...current, handle: event.target.value }))}
                placeholder="@username"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creating} onClick={() => void onCreate()}>
              Save contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
