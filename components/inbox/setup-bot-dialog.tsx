"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  addInboxKnowledge,
  deleteInboxKnowledge,
  getInboxBot,
  listInboxKnowledge,
  playgroundInboxBot,
  saveInboxBot,
  uploadInboxKnowledge,
  type InboxBotButton,
  type InboxBotConfig,
  type InboxBotMode,
  type InboxKnowledgeDoc,
} from "@/lib/api/inbox-bot";
import { cn } from "@/lib/utils";

const KINDS = ["catalog", "services", "locations", "faq", "policy", "profile"] as const;

function emptyButton(): InboxBotButton {
  return { id: `b${Math.random().toString(36).slice(2, 8)}`, label: "Button", action: "text", text: "", children: [] };
}

function MenuPreview({ menu }: { menu: InboxBotConfig["menu"] }) {
  return (
    <div className="rounded-3xl border bg-slate-900 p-3 text-white shadow-inner">
      <p className="mb-2 text-center text-[10px] uppercase tracking-wide text-slate-400">Preview</p>
      <div className="rounded-2xl bg-slate-800 p-3">
        <p className="text-sm leading-snug">{menu.welcome_text || "Welcome message"}</p>
        <div className="mt-3 grid gap-1.5">
          {menu.buttons.map((button) => (
            <div key={button.id} className="rounded-full bg-white/10 px-3 py-1.5 text-center text-xs">
              {button.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ButtonEditor({
  button,
  onChange,
  onRemove,
  depth = 0,
}: {
  button: InboxBotButton;
  onChange: (next: InboxBotButton) => void;
  onRemove: () => void;
  depth?: number;
}) {
  return (
    <div className={cn("space-y-2 rounded-xl border bg-white/70 p-3", depth > 0 && "ml-4")}>
      <div className="flex gap-2">
        <Input value={button.label} onChange={(event) => onChange({ ...button, label: event.target.value.slice(0, 20) })} />
        <Select value={button.action} onValueChange={(value) => onChange({ ...button, action: value as InboxBotButton["action"] })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Send text</SelectItem>
            <SelectItem value="media">Send media</SelectItem>
            <SelectItem value="card">Catalog card</SelectItem>
            <SelectItem value="submenu">Follow-up menu</SelectItem>
            <SelectItem value="escalate">Talk to human</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove button">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {button.action !== "escalate" ? (
        <Textarea
          value={button.text}
          onChange={(event) => onChange({ ...button, text: event.target.value })}
          placeholder="Reply text"
          rows={2}
        />
      ) : (
        <Input
          value={button.text}
          onChange={(event) => onChange({ ...button, text: event.target.value })}
          placeholder="I'll get a teammate for you."
        />
      )}
      {button.action === "media" ? (
        <Input
          value={button.media_url || ""}
          onChange={(event) => onChange({ ...button, media_url: event.target.value })}
          placeholder="https://… image or video"
        />
      ) : null}
      {button.action === "submenu" && depth < 2 ? (
        <div className="space-y-2">
          {button.children.map((child, index) => (
            <ButtonEditor
              key={child.id}
              button={child}
              depth={depth + 1}
              onChange={(next) => {
                const children = [...button.children];
                children[index] = next;
                onChange({ ...button, children });
              }}
              onRemove={() => onChange({ ...button, children: button.children.filter((_, i) => i !== index) })}
            />
          ))}
          {button.children.length < 8 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...button, children: [...button.children, emptyButton()] })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add follow-up
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SetupBotDialog({
  open,
  onOpenChange,
  channel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: "instagram" | "messenger";
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<InboxBotConfig | null>(null);
  const [docs, setDocs] = useState<InboxKnowledgeDoc[]>([]);
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeKind, setKnowledgeKind] = useState<(typeof KINDS)[number]>("faq");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [playIn, setPlayIn] = useState("Hi, what are your hours?");
  const [playOut, setPlayOut] = useState("");
  const [playHistory, setPlayHistory] = useState<{ role: string; text: string }[]>([]);

  const channelLabel = channel === "instagram" ? "Instagram" : "Messenger";

  async function load() {
    setLoading(true);
    try {
      const [next, knowledge] = await Promise.all([getInboxBot(channel), listInboxKnowledge(channel)]);
      setConfig(next);
      setDocs(knowledge);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not load bot setup");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel]);

  const buttonOptions = useMemo(
    () => (config?.menu.buttons || []).map((item) => ({ id: item.id, label: item.label })),
    [config],
  );

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      const next = await saveInboxBot(channel, {
        mode: config.mode,
        menu: config.menu,
        agentic: config.agentic,
      });
      setConfig(next);
      toast.success(`${channelLabel} bot saved`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save bot");
    } finally {
      setSaving(false);
    }
  }

  async function addKnowledge() {
    const title = knowledgeTitle.trim();
    if (!title || !knowledgeContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      const row = await addInboxKnowledge(channel, { kind: knowledgeKind, title, content: knowledgeContent });
      setDocs((current) => [row, ...current]);
      setKnowledgeTitle("");
      setKnowledgeContent("");
      toast.success("Knowledge added");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not add knowledge");
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    try {
      const row = await uploadInboxKnowledge(channel, file, knowledgeKind, knowledgeTitle.trim() || file.name);
      setDocs((current) => [row, ...current]);
      toast.success("File ingested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  async function runPlayground() {
    const message = playIn.trim();
    if (!message) return;
    try {
      const result = await playgroundInboxBot(channel, { message, history: playHistory });
      setPlayOut(result.escalated ? `${result.reply}\n\nEscalated: ${result.reason}` : result.reply);
      setPlayHistory((current) => [...current, { role: "user", text: message }, { role: "assistant", text: result.reply }]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Playground failed");
    }
  }

  function setMode(mode: InboxBotMode) {
    if (!config) return;
    setConfig({ ...config, mode });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Setup bot · {channelLabel}</DialogTitle>
          <DialogDescription>
            Pick one mode for this channel. Agentic on means no menu to configure. Menu on means no LLM.
          </DialogDescription>
        </DialogHeader>
        {loading || !config ? (
          <p className="py-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
              {(["off", "menu", "agentic"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium capitalize",
                    config.mode === mode ? "bg-white shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {mode === "off" ? "Bot off" : mode}
                </button>
              ))}
            </div>

            {config.mode === "menu" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Welcome text</Label>
                    <Textarea
                      value={config.menu.welcome_text}
                      onChange={(event) => setConfig({ ...config, menu: { ...config.menu, welcome_text: event.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Buttons (3–8)</Label>
                      {config.menu.buttons.length < 8 ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => setConfig({ ...config, menu: { ...config.menu, buttons: [...config.menu.buttons, emptyButton()] } })}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add
                        </Button>
                      ) : null}
                    </div>
                    {config.menu.buttons.map((button, index) => (
                      <ButtonEditor
                        key={button.id}
                        button={button}
                        onChange={(next) => {
                          const buttons = [...config.menu.buttons];
                          buttons[index] = next;
                          setConfig({ ...config, menu: { ...config.menu, buttons } });
                        }}
                        onRemove={() =>
                          setConfig({
                            ...config,
                            menu: { ...config.menu, buttons: config.menu.buttons.filter((_, i) => i !== index) },
                          })
                        }
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords</Label>
                    {config.menu.keywords.map((row, index) => (
                      <div key={`${row.phrase}-${index}`} className="flex gap-2">
                        <Input
                          value={row.phrase}
                          placeholder="price"
                          onChange={(event) => {
                            const keywords = [...config.menu.keywords];
                            keywords[index] = { ...row, phrase: event.target.value };
                            setConfig({ ...config, menu: { ...config.menu, keywords } });
                          }}
                        />
                        <Select
                          value={row.button_id}
                          onValueChange={(value) => {
                            const keywords = [...config.menu.keywords];
                            keywords[index] = { ...row, button_id: value };
                            setConfig({ ...config, menu: { ...config.menu, keywords } });
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                          <SelectContent>
                            {buttonOptions.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setConfig({
                              ...config,
                              menu: { ...config.menu, keywords: config.menu.keywords.filter((_, i) => i !== index) },
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setConfig({
                          ...config,
                          menu: {
                            ...config.menu,
                            keywords: [...config.menu.keywords, { phrase: "", button_id: buttonOptions[0]?.id || "" }],
                          },
                        })
                      }
                    >
                      Add keyword
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Fallback</Label>
                    <Textarea
                      value={config.menu.fallback_text}
                      onChange={(event) => setConfig({ ...config, menu: { ...config.menu, fallback_text: event.target.value } })}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Escalate after</Label>
                      <Input
                        type="number"
                        min={1}
                        max={8}
                        className="w-20"
                        value={config.menu.fallback_escalate_after}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            menu: { ...config.menu, fallback_escalate_after: Number(event.target.value) || 2 },
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">unknown replies</span>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <Label>Quiet hours</Label>
                      <Switch
                        checked={config.menu.quiet_hours.enabled}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            menu: { ...config.menu, quiet_hours: { ...config.menu.quiet_hours, enabled: checked } },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={config.menu.quiet_hours.start}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            menu: { ...config.menu, quiet_hours: { ...config.menu.quiet_hours, start: event.target.value } },
                          })
                        }
                      />
                      <Input
                        type="time"
                        value={config.menu.quiet_hours.end}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            menu: { ...config.menu, quiet_hours: { ...config.menu.quiet_hours, end: event.target.value } },
                          })
                        }
                      />
                    </div>
                    <Textarea
                      value={config.menu.quiet_hours.message}
                      onChange={(event) =>
                        setConfig({
                          ...config,
                          menu: { ...config.menu, quiet_hours: { ...config.menu.quiet_hours, message: event.target.value } },
                        })
                      }
                    />
                  </div>
                </div>
                <MenuPreview menu={config.menu} />
              </div>
            ) : null}

            {config.mode === "agentic" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand voice</Label>
                  <Textarea
                    value={config.agentic.brand_voice}
                    onChange={(event) => setConfig({ ...config, agentic: { ...config.agentic, brand_voice: event.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What never to promise</Label>
                  <Textarea
                    value={config.agentic.never_promise}
                    onChange={(event) => setConfig({ ...config, agentic: { ...config.agentic, never_promise: event.target.value } })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Escalate after</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    className="w-20"
                    value={config.agentic.escalate_after_misses}
                    onChange={(event) =>
                      setConfig({
                        ...config,
                        agentic: { ...config.agentic, escalate_after_misses: Number(event.target.value) || 2 },
                      })
                    }
                  />
                  <span className="text-xs text-muted-foreground">misses</span>
                </div>
                <div className="space-y-2 rounded-xl border p-3">
                  <Label>Knowledge</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select value={knowledgeKind} onValueChange={(value) => setKnowledgeKind(value as (typeof KINDS)[number])}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KINDS.map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            {kind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input className="flex-1" placeholder="Title" value={knowledgeTitle} onChange={(event) => setKnowledgeTitle(event.target.value)} />
                    <Input type="file" accept=".csv,.txt,.md" onChange={(event) => void onUpload(event.target.files?.[0] ?? null)} />
                  </div>
                  <Textarea placeholder="Paste FAQ, policy, or CSV-mapped notes" value={knowledgeContent} onChange={(event) => setKnowledgeContent(event.target.value)} />
                  <Button type="button" size="sm" onClick={() => void addKnowledge()}>
                    Add
                  </Button>
                  <div className="space-y-1">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span>
                          <span className="font-medium">{doc.title}</span>{" "}
                          <span className="text-xs text-muted-foreground">{doc.kind}</span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void deleteInboxKnowledge(channel, doc.id).then(() => setDocs((current) => current.filter((item) => item.id !== doc.id)))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border p-3">
                  <Label>Playground</Label>
                  <Textarea value={playIn} onChange={(event) => setPlayIn(event.target.value)} />
                  <Button type="button" size="sm" onClick={() => void runPlayground()}>
                    Try reply
                  </Button>
                  {playOut ? <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{playOut}</pre> : null}
                </div>
              </div>
            ) : null}

            {config.mode === "off" ? (
              <p className="text-sm text-muted-foreground">Human Inbox only. Teammates answer every DM on {channelLabel}.</p>
            ) : null}

            {config.mode === "menu" ? (
              <div className="space-y-2 rounded-xl border p-3">
                <Label>Playground</Label>
                <Textarea value={playIn} onChange={(event) => setPlayIn(event.target.value)} />
                <Button type="button" size="sm" onClick={() => void runPlayground()}>
                  Try reply
                </Button>
                {playOut ? <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{playOut}</pre> : null}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save bot"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
