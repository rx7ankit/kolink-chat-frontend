"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadInboxFile } from "@/lib/api/inbox";
import {
  addInboxKnowledge,
  botChannelLabel,
  deleteInboxKnowledge,
  playgroundInboxBot,
  uploadInboxKnowledge,
  type BotChannel,
  type InboxBotButton,
  type InboxBotButtonAction,
  type InboxBotConfig,
  type InboxBotItem,
  type InboxBotItemLayout,
  type InboxKnowledgeDoc,
} from "@/lib/api/inbox-bot";
import { ApiError } from "@/lib/api/client";
import { publicMediaUrl } from "@/lib/broadcast-media";
import { cn } from "@/lib/utils";

export const KNOWLEDGE_KINDS = ["catalog", "services", "locations", "faq", "policy", "profile"] as const;

export function emptyItem(): InboxBotItem {
  return { title: "", subtitle: "", price: "", media_url: "" };
}

export function emptyButton(): InboxBotButton {
  return {
    id: `b${Math.random().toString(36).slice(2, 8)}`,
    label: "Button",
    action: "text",
    text: "",
    layout: "",
    items: [],
    children: [],
  };
}

export function BotSetupHeader({
  channel,
  title,
  description,
  backHref,
}: {
  channel: BotChannel;
  title: string;
  description: string;
  backHref: string;
}) {
  return (
    <div className="mb-6 space-y-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{botChannelLabel(channel)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
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

function ItemEditor({
  item,
  onChange,
  onRemove,
  showMedia,
  showPrice,
}: {
  item: InboxBotItem;
  onChange: (next: InboxBotItem) => void;
  onRemove: () => void;
  showMedia: boolean;
  showPrice: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadInboxFile(file);
      onChange({ ...item, media_url: uploaded.url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const thumb = publicMediaUrl(item.media_url);

  return (
    <div className="space-y-2 rounded-xl border bg-white/80 p-3">
      <div className="flex gap-2">
        <Input
          value={item.title}
          onChange={(event) => onChange({ ...item, title: event.target.value.slice(0, 80) })}
          placeholder={showPrice ? "Service" : "Title"}
        />
        {showPrice ? (
          <Input
            className="w-28"
            value={item.price || ""}
            onChange={(event) => onChange({ ...item, price: event.target.value.slice(0, 40) })}
            placeholder="$40"
          />
        ) : null}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove item">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={item.subtitle || ""}
        onChange={(event) => onChange({ ...item, subtitle: event.target.value.slice(0, 200) })}
        placeholder={showPrice ? "Duration or note" : "Caption or details"}
      />
      {showMedia ? (
        <div className="flex items-center gap-2">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : null}
          <Input
            value={item.media_url || ""}
            onChange={(event) => onChange({ ...item, media_url: event.target.value })}
            placeholder="https://… or upload"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "…" : "Media"}
          </Button>
        </div>
      ) : null}
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
  const action: InboxBotButtonAction = button.action === "card" ? "prices" : button.action;
  const items = button.items || [];
  const showItems = action === "carousel" || action === "list" || action === "prices";
  const showMedia = action === "carousel" || (action === "list" && button.layout !== "text_list");
  const showPrice = action === "prices" || action === "list";

  function setAction(next: InboxBotButtonAction) {
    const layout: InboxBotItemLayout =
      next === "carousel" ? "carousel" : next === "prices" ? "text_list" : next === "list" ? "stack" : "";
    onChange({
      ...button,
      action: next,
      layout,
      items: next === "carousel" || next === "list" || next === "prices" ? items : [],
    });
  }

  return (
    <div className={cn("space-y-2 rounded-xl border bg-white/70 p-3", depth > 0 && "ml-4")}>
      <div className="flex gap-2">
        <Input value={button.label} onChange={(event) => onChange({ ...button, label: event.target.value.slice(0, 20) })} />
        <Select value={action} onValueChange={(value) => setAction(value as InboxBotButtonAction)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Send text</SelectItem>
            <SelectItem value="media">Send media</SelectItem>
            <SelectItem value="carousel">Catalog carousel</SelectItem>
            <SelectItem value="list">Vertical media / list</SelectItem>
            <SelectItem value="prices">Service & cost list</SelectItem>
            <SelectItem value="submenu">Follow-up menu</SelectItem>
            <SelectItem value="escalate">Talk to human</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove button">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {action !== "escalate" ? (
        <Textarea
          value={button.text}
          onChange={(event) => onChange({ ...button, text: event.target.value })}
          placeholder={showItems ? "Intro text sent with the list" : "Reply text"}
          rows={2}
        />
      ) : (
        <Input
          value={button.text}
          onChange={(event) => onChange({ ...button, text: event.target.value })}
          placeholder="I'll get a teammate for you."
        />
      )}
      {action === "media" ? (
        <Input
          value={button.media_url || ""}
          onChange={(event) => onChange({ ...button, media_url: event.target.value })}
          placeholder="https://… image or video"
        />
      ) : null}
      {action === "list" ? (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {([
            ["stack", "Vertical media"],
            ["text_list", "Text only"],
          ] as const).map(([layout, label]) => (
            <button
              key={layout}
              type="button"
              onClick={() => onChange({ ...button, layout })}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-medium",
                (button.layout || "stack") === layout ? "bg-white shadow-sm" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {showItems ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {action === "carousel"
              ? "Customers swipe these cards horizontally."
              : action === "prices"
                ? "Sent as a service and cost list."
                : button.layout === "text_list"
                  ? "Sent as a text list."
                  : "Each item is sent as media with its caption."}
          </p>
          {items.map((item, index) => (
            <ItemEditor
              key={`${button.id}-item-${index}`}
              item={item}
              showMedia={showMedia}
              showPrice={showPrice}
              onChange={(next) => {
                const nextItems = [...items];
                nextItems[index] = next;
                onChange({ ...button, items: nextItems });
              }}
              onRemove={() => onChange({ ...button, items: items.filter((_, i) => i !== index) })}
            />
          ))}
          {items.length < 10 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...button, items: [...items, emptyItem()] })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add item
            </Button>
          ) : null}
        </div>
      ) : null}
      {action === "submenu" && depth < 2 ? (
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

export function MenuSetupFields({
  config,
  setConfig,
}: {
  config: InboxBotConfig;
  setConfig: (next: InboxBotConfig) => void;
}) {
  const buttonOptions = useMemo(
    () => (config.menu.buttons || []).map((item) => ({ id: item.id, label: item.label })),
    [config],
  );

  return (
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfig({ ...config, menu: { ...config.menu, buttons: [...config.menu.buttons, emptyButton()] } })}
              >
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
  );
}

export function AgenticSetupFields({
  channel,
  config,
  setConfig,
  docs,
  setDocs,
}: {
  channel: BotChannel;
  config: InboxBotConfig;
  setConfig: (next: InboxBotConfig) => void;
  docs: InboxKnowledgeDoc[];
  setDocs: (next: InboxKnowledgeDoc[] | ((current: InboxKnowledgeDoc[]) => InboxKnowledgeDoc[])) => void;
}) {
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeKind, setKnowledgeKind] = useState<(typeof KNOWLEDGE_KINDS)[number]>("faq");
  const [knowledgeContent, setKnowledgeContent] = useState("");

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

  return (
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
          <Select value={knowledgeKind} onValueChange={(value) => setKnowledgeKind(value as (typeof KNOWLEDGE_KINDS)[number])}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KNOWLEDGE_KINDS.map((kind) => (
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
    </div>
  );
}

export function BotPlayground({ channel }: { channel: BotChannel }) {
  const [playIn, setPlayIn] = useState("Hi, what are your hours?");
  const [playOut, setPlayOut] = useState("");
  const [playHistory, setPlayHistory] = useState<{ role: string; text: string }[]>([]);

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

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <Label>Playground</Label>
      <Textarea value={playIn} onChange={(event) => setPlayIn(event.target.value)} />
      <Button type="button" size="sm" onClick={() => void runPlayground()}>
        Try reply
      </Button>
      {playOut ? <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{playOut}</pre> : null}
    </div>
  );
}
