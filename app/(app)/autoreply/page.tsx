"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addAutoreplySource,
  deleteAutoreplySource,
  getAutoreply,
  sendAutoreplyTurn,
  setAutoreplyPlatform,
  uploadAutoreplySource,
  type AutoreplyHome,
  type AutoreplyMode,
} from "@/lib/api/autoreply";
import { ApiError } from "@/lib/api/client";
import { playgroundInboxBot, type BotChannel } from "@/lib/api/inbox-bot";
import { useWorkspaceId } from "@/lib/query/hooks";

const MODES: AutoreplyMode[] = ["off", "menu", "agentic"];

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function AutoreplyPage() {
  return (
    <Suspense fallback={<p className="page-shell text-sm text-muted-foreground">Loading Autoreply…</p>}>
      <AutoreplyInner />
    </Suspense>
  );
}

function AutoreplyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "menu" || params.get("tab") === "agentic" ? params.get("tab") : "home";
  const ws = useWorkspaceId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["autoreply", ws],
    queryFn: getAutoreply,
    enabled: Boolean(ws),
  });

  function openTab(next: string) {
    router.push(next === "home" ? "/autoreply" : `/autoreply?tab=${next}`);
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Autoreply"
        description="One knowledge library for the workspace. Each platform is Off, Menu, or Agentic — never both."
        actions={
          <Button variant="outline" onClick={() => openTab("home")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        }
      />
      <Tabs value={tab ?? "home"} onValueChange={openTab}>
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="agentic">Agentic</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : null}
      {query.isError ? (
        <p className="mt-6 text-sm text-destructive">{errorText(query.error, "Could not load Autoreply")}</p>
      ) : null}
      {query.data && tab === "home" ? (
        <HomePanel
          data={query.data}
          onOpen={openTab}
          onChange={(next) => queryClient.setQueryData(["autoreply", ws], next)}
        />
      ) : null}
      {query.data && tab === "agentic" ? (
        <AgenticPanel
          data={query.data}
          onChange={(next) => queryClient.setQueryData(["autoreply", ws], next)}
        />
      ) : null}
      {query.data && tab === "menu" ? (
        <MenuPanel data={query.data} onChange={(next) => queryClient.setQueryData(["autoreply", ws], next)} />
      ) : null}
    </div>
  );
}

function HomePanel({
  data,
  onOpen,
  onChange,
}: {
  data: AutoreplyHome;
  onOpen: (tab: string) => void;
  onChange: (next: AutoreplyHome) => void;
}) {
  const ready = data.sources.filter((source) => source.status === "ready").length;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onOpen("agentic")}
        className="glass rounded-2xl p-5 text-left"
      >
        <p className="text-sm font-medium">Agentic</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Chat onboarding, articles, links, and catalog. The agent answers only from this library.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {data.status === "ready" ? "Onboarding saved" : `Onboarding step: ${data.step}`} · {ready} ready articles
        </p>
      </button>
      <button type="button" onClick={() => onOpen("menu")} className="glass rounded-2xl p-5 text-left">
        <p className="text-sm font-medium">Menu</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Keyword buttons stay on the existing menu editor. Turning Menu on turns Agentic off for that platform.
        </p>
      </button>
      <PlatformCards data={data} onChange={onChange} />
    </div>
  );
}

function AgenticPanel({
  data,
  onChange,
}: {
  data: AutoreplyHome;
  onChange: (next: AutoreplyHome) => void;
}) {
  const queryClient = useQueryClient();
  const ws = useWorkspaceId();
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("article");
  const [tryChannel, setTryChannel] = useState<BotChannel>("instagram");
  const [tryText, setTryText] = useState("");
  const [tryReply, setTryReply] = useState("");

  const turn = useMutation({
    mutationFn: () => sendAutoreplyTurn(draft),
    onSuccess: (next) => {
      setDraft("");
      onChange(next);
    },
    onError: (error) => toast.error(errorText(error, "Could not save that answer")),
  });

  const create = useMutation({
    mutationFn: () =>
      url.trim()
        ? addAutoreplySource({ kind: "url", title: title || url, url: url.trim() })
        : addAutoreplySource({ kind, title: title || "Untitled", content: body }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setUrl("");
      toast.success("Article saved");
      const next = await getAutoreply();
      onChange(next);
    },
    onError: (error) => toast.error(errorText(error, "Could not add that article")),
  });

  const remove = useMutation({
    mutationFn: deleteAutoreplySource,
    onSuccess: async () => {
      const next = await getAutoreply();
      onChange(next);
    },
    onError: (error) => toast.error(errorText(error, "Could not delete that article")),
  });

  const trial = useMutation({
    mutationFn: () => playgroundInboxBot(tryChannel, { message: tryText }),
    onSuccess: (result) => setTryReply(result.reply || "(no reply)"),
    onError: (error) => toast.error(errorText(error, "Turn Agentic on for that platform before trying a question")),
  });

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="glass flex min-h-[28rem] flex-col rounded-2xl p-4">
        <p className="text-sm font-medium">Onboarding</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Each answer is saved as its own article so later questions can find it.
        </p>
        <div className="mt-4 flex-1 space-y-3 overflow-auto">
          {data.messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={message.role === "user" ? "ml-8 rounded-xl bg-white/70 p-3 text-sm" : "mr-8 text-sm"}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) turn.mutate();
          }}
        >
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} placeholder="Your answer" />
          <Button type="submit" disabled={turn.isPending || !draft.trim()}>
            {turn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </form>
      </section>

      <div className="space-y-4">
        <PlatformCards
          data={data}
          onChange={(next) => {
            onChange(next);
            void queryClient.invalidateQueries({ queryKey: ["autoreply", ws] });
          }}
        />
        <section className="glass rounded-2xl p-4">
          <p className="text-sm font-medium">Knowledge</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Text, CSV catalog, or a public link. Links are read by the worker. PDF is not extracted yet.
          </p>
          <div className="mt-3 space-y-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
            <select
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="article">Article</option>
              <option value="faq">Typical questions</option>
              <option value="policy">Policy</option>
              <option value="catalog">Catalog CSV</option>
            </select>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="Paste the article or CSV" />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://… or leave blank" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => create.mutate()} disabled={create.isPending}>
                Add to library
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-md border px-3 text-sm">
                Upload .txt, .md, or .csv
                <input
                  type="file"
                  accept=".txt,.md,.csv,text/plain,text/csv,text/markdown"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try {
                      await uploadAutoreplySource(file, kind, title || file.name);
                      toast.success("File added");
                      onChange(await getAutoreply());
                    } catch (error) {
                      toast.error(errorText(error, "Upload failed"));
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {data.sources.length === 0 ? <li className="text-sm text-muted-foreground">No articles yet.</li> : null}
            {data.sources.map((source) => (
              <li key={source.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{source.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.kind}
                    {source.filename ? ` · ${source.filename}` : ""}
                    {source.error ? ` · ${source.error}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={source.status === "ready" ? "secondary" : "outline"}>{source.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(source.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-4">
          <p className="text-sm font-medium">Try a customer question</p>
          <div className="mt-3 flex gap-2">
            <select
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
              value={tryChannel}
              onChange={(event) => setTryChannel(event.target.value as BotChannel)}
            >
              <option value="instagram">Instagram</option>
              <option value="messenger">Messenger</option>
            </select>
            <Input value={tryText} onChange={(event) => setTryText(event.target.value)} placeholder="What are your hours?" />
            <Button type="button" disabled={trial.isPending || !tryText.trim()} onClick={() => trial.mutate()}>
              Try
            </Button>
          </div>
          {tryReply ? <p className="mt-3 whitespace-pre-wrap text-sm">{tryReply}</p> : null}
        </section>
      </div>
    </div>
  );
}

function MenuPanel({
  data,
  onChange,
}: {
  data: AutoreplyHome;
  onChange: (next: AutoreplyHome) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/inbox/bot/instagram/menu" className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Instagram menu</p>
          <p className="mt-2 text-sm text-muted-foreground">Buttons, keywords, and quiet hours. Unchanged from Inbox setup.</p>
        </Link>
        <Link href="/inbox/bot/messenger/menu" className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Messenger menu</p>
          <p className="mt-2 text-sm text-muted-foreground">Same menu editor for the Facebook Page.</p>
        </Link>
      </div>
      <PlatformCards data={data} onChange={onChange} />
    </div>
  );
}

function PlatformCards({
  data,
  onChange,
}: {
  data: AutoreplyHome;
  onChange?: (next: AutoreplyHome) => void;
}) {
  const [pending, setPending] = useState("");
  return (
    <>
      {data.platforms.map((platform) => (
        <section key={platform.channel} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{platform.label}</p>
              <p className="text-xs text-muted-foreground">Replies capped at {platform.max_chars} characters. Agentic sends text only.</p>
            </div>
            <div className="flex rounded-lg bg-white/60 p-1">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={pending === platform.channel}
                  onClick={async () => {
                    setPending(platform.channel);
                    try {
                      await setAutoreplyPlatform(platform.channel, mode);
                      const next = await getAutoreply();
                      onChange?.(next);
                    } catch (error) {
                      toast.error(errorText(error, "Menu needs at least 3 buttons before it can be turned on"));
                    } finally {
                      setPending("");
                    }
                  }}
                  className={
                    platform.mode === mode
                      ? "rounded-md bg-foreground px-2 py-1 text-xs text-background"
                      : "rounded-md px-2 py-1 text-xs text-muted-foreground"
                  }
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
