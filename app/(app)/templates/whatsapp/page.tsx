"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutTemplate, Library, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { CreateTemplateDialog } from "@/components/templates/whatsapp/create-template-dialog";
import { TemplatePreview } from "@/components/templates/whatsapp/template-preview";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  browseTemplateLibrary,
  createWhatsAppTemplateGroup,
  deleteWhatsAppTemplate,
  importLibraryTemplate,
  listWhatsAppTemplateGroups,
  listWhatsAppTemplates,
  type LibraryTemplate,
  type TemplateCategory,
  type WhatsAppTemplate,
  type WhatsAppTemplateGroup,
} from "@/lib/api/whatsapp-templates";
import { cn } from "@/lib/utils";

type Section = "manage" | "library";

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utility",
  AUTHENTICATION: "Authentication",
};

function statusVariant(status: string) {
  const value = status.toUpperCase();
  if (value === "APPROVED") return "mint" as const;
  if (value === "REJECTED" || value === "DISABLED") return "rose" as const;
  if (value === "PAUSED") return "peach" as const;
  return "sky" as const;
}

function statusLabel(status: string) {
  const value = status.toUpperCase();
  if (value === "PENDING") return "In review";
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function WhatsAppTemplatesPage() {
  const [section, setSection] = useState<Section>("manage");
  const [wabaId, setWabaId] = useState("");
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [maxActive, setMaxActive] = useState(250);
  const [groups, setGroups] = useState<WhatsAppTemplateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);

  const [libraryRows, setLibraryRows] = useState<LibraryTemplate[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [selected, setSelected] = useState<LibraryTemplate | null>(null);
  const [importing, setImporting] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listWhatsAppTemplates();
      setWabaId(list.waba_id);
      setTemplates(list.templates);
      setMaxActive(list.max_active);
      try {
        const groupList = await listWhatsAppTemplateGroups();
        setGroups(groupList.groups);
      } catch {
        setGroups([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not load message templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const languages = useMemo(
    () => Array.from(new Set(templates.map((row) => row.language).filter(Boolean))),
    [templates],
  );

  const visible = useMemo(
    () =>
      templates.filter((row) => {
        if (categoryFilter !== "all" && row.category.toUpperCase() !== categoryFilter) return false;
        if (languageFilter !== "all" && row.language !== languageFilter) return false;
        if (statusFilter !== "all" && row.status.toUpperCase() !== statusFilter) return false;
        if (search.trim()) {
          const needle = search.trim().toLowerCase();
          return row.name.toLowerCase().includes(needle) || row.body.toLowerCase().includes(needle);
        }
        return true;
      }),
    [categoryFilter, languageFilter, search, statusFilter, templates],
  );

  async function loadLibrary(term = "") {
    setLibraryLoading(true);
    try {
      const rows = await browseTemplateLibrary(term ? { search: term } : {});
      setLibraryRows(rows);
      setLibraryLoaded(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not load the template library");
    } finally {
      setLibraryLoading(false);
    }
  }

  function openLibrary() {
    setSection("library");
    if (!libraryLoaded) void loadLibrary();
  }

  async function removeTemplate(row: WhatsAppTemplate) {
    try {
      await deleteWhatsAppTemplate(row.name, row.id);
      toast.success(`${row.name} deleted`);
      void reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not delete template");
    }
  }

  async function createGroup() {
    setGroupBusy(true);
    try {
      await createWhatsAppTemplateGroup({ name: groupName, description: groupDescription });
      toast.success("Template group created");
      setGroupOpen(false);
      setGroupName("");
      setGroupDescription("");
      void reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not create group");
    } finally {
      setGroupBusy(false);
    }
  }

  async function importTemplate(row: LibraryTemplate) {
    setImporting(row.name);
    try {
      await importLibraryTemplate({
        library_template_name: row.name,
        name: row.name,
        language: row.language || "en_US",
        category: (row.category.toUpperCase() || "UTILITY") as TemplateCategory,
      });
      toast.success(`${row.name} added to your templates`);
      setSelected(null);
      setSection("manage");
      void reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Could not import this template");
    } finally {
      setImporting("");
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="WhatsApp Manager"
        description={wabaId ? `Message templates on WhatsApp Business Account ${wabaId}` : "Message templates"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Templates
              </Link>
            </Button>
            <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="glass h-fit rounded-2xl p-3">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Message templates
          </p>
          <button
            type="button"
            onClick={() => setSection("manage")}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
              section === "manage" ? "bg-primary/10 font-medium text-primary" : "hover:bg-white/60",
            )}
          >
            <LayoutTemplate className="h-4 w-4" />
            Manage templates
          </button>
          <button
            type="button"
            onClick={openLibrary}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
              section === "library" ? "bg-primary/10 font-medium text-primary" : "hover:bg-white/60",
            )}
          >
            <Library className="h-4 w-4" />
            Template library
          </button>
        </nav>

        <div className="min-w-0">
          {error ? (
            <div className="glass rounded-2xl p-6">
              <p className="text-sm font-medium">Message templates unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/channels">Go to Channels</Link>
              </Button>
            </div>
          ) : section === "manage" ? (
            <Tabs defaultValue="templates">
              <TabsList className="h-auto w-full justify-start overflow-x-auto">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="groups">Template groups</TabsTrigger>
              </TabsList>

              <TabsContent value="templates">
                <div className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[12rem] flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="UTILITY">Utility</SelectItem>
                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All languages</SelectItem>
                        {languages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PENDING">In review</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setCreateOpen(true)}>Create Template</Button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-white/60 bg-white/40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((row) => (
                          <TableRow key={`${row.id}-${row.language}`}>
                            <TableCell>
                              <p className="font-medium">{row.name}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">{row.body}</p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {CATEGORY_LABELS[row.category.toUpperCase()] || row.category}
                            </TableCell>
                            <TableCell className="text-sm">{row.language}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
                              {row.rejected_reason ? (
                                <p className="mt-1 text-xs text-muted-foreground">{row.rejected_reason}</p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${row.name}`}
                                onClick={() => void removeTemplate(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="border-t border-white/60 px-4 py-3 text-xs text-muted-foreground">
                      {loading
                        ? "Loading templates…"
                        : `${visible.length} message templates shown (total active templates: ${templates.length} of ${maxActive})`}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="groups">
                <div className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Groups keep related templates together on this WhatsApp Business Account.
                    </p>
                    <Button onClick={() => setGroupOpen(true)}>Create group</Button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-white/60 bg-white/40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Group name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Templates</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {group.description || "—"}
                            </TableCell>
                            <TableCell className="text-sm">{group.template_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="border-t border-white/60 px-4 py-3 text-xs text-muted-foreground">
                      {groups.length} template groups shown
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[14rem] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search Meta's template library"
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void loadLibrary(librarySearch);
                    }}
                  />
                </div>
                <Button variant="outline" disabled={libraryLoading} onClick={() => void loadLibrary(librarySearch)}>
                  {libraryLoading ? "Searching…" : "Search"}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {libraryRows.map((row) => (
                  <button
                    key={`${row.name}-${row.language}`}
                    type="button"
                    onClick={() => setSelected(row)}
                    className="rounded-2xl border border-white/60 bg-white/45 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="muted">
                        {CATEGORY_LABELS[row.category.toUpperCase()] || row.category || "Template"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{row.language}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{row.name}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{row.body}</p>
                  </button>
                ))}
              </div>

              {!libraryLoading && !libraryRows.length ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No library templates returned for this search.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => void reload()} />

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create template group</DialogTitle>
            <DialogDescription>
              Group templates on this WhatsApp Business Account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={groupName}
                placeholder="Order updates"
                onChange={(event) => setGroupName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={groupDescription}
                placeholder="Templates we send after an order ships"
                onChange={(event) => setGroupDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            <Button disabled={groupBusy || !groupName.trim()} onClick={() => void createGroup()}>
              {groupBusy ? "Creating…" : "Create group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {[selected?.topic, selected?.usecase].filter(Boolean).join(" · ") || "Meta template library"}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <TemplatePreview
              title="Preview"
              className="bg-white/40"
              data={{
                header: selected.header,
                body: selected.body,
                footer: selected.footer,
                buttons: selected.buttons,
                samples: selected.body_params,
              }}
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              disabled={Boolean(importing)}
              onClick={() => selected && void importTemplate(selected)}
            >
              {importing ? "Importing…" : "Use template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
