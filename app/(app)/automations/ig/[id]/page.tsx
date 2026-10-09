"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AutomationCanvas, type CanvasBlock } from "@/components/ig-automations/automation-canvas";
import {
  FieldHint,
  KeywordInput,
  ResponseEditor,
  VariationsInput,
  responseProblems,
} from "@/components/ig-automations/fields";
import { PostThumb } from "@/components/ig-automations/post-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  deleteIgAutomation,
  getIgAutomation,
  isReel,
  listIgRuns,
  updateIgAutomation,
  type IgAutomation,
  type IgAutomationConfig,
  type IgRun,
} from "@/lib/api/ig-automations";
import { keywordProblems } from "@/lib/ig-keywords";

const BLOCK_TITLES: Record<CanvasBlock, string> = {
  post: "Post",
  keywords: "Trigger keywords",
  follow: "Follow check",
  reply: "Reply to comment",
  dm: "DM response",
};

const RUN_STATES: Record<string, { label: string; variant: "mint" | "sky" | "peach" | "rose" | "muted" }> = {
  matched: { label: "Matched", variant: "sky" },
  awaiting_tap: { label: "DM sent · waiting for tap", variant: "sky" },
  awaiting_follow: { label: "Waiting to follow", variant: "peach" },
  delivered: { label: "Delivered", variant: "mint" },
  skipped: { label: "Skipped", variant: "muted" },
  failed: { label: "Failed", variant: "rose" },
};

function problemsFor(draft: IgAutomation): string[] {
  const problems = [...keywordProblems(draft.keywords), ...responseProblems(draft.config.response)];
  if (draft.comment_reply_enabled && !draft.config.comment_replies.some((reply) => reply.trim())) {
    problems.push("Add at least one comment reply, or turn comment replies off");
  }
  if (draft.follow_required && (!draft.config.follow_prompt.trim() || !draft.config.follow_button.trim())) {
    problems.push("Fill in the follow message and button");
  }
  return problems;
}

export default function IgAutomationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [saved, setSaved] = useState<IgAutomation | null>(null);
  const [draft, setDraft] = useState<IgAutomation | null>(null);
  const [open, setOpen] = useState<CanvasBlock | null>(null);
  const [runs, setRuns] = useState<IgRun[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getIgAutomation(id)
      .then((row) => {
        setSaved(row);
        setDraft(row);
      })
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Automation not found"));
  }, [id]);

  const loadRuns = useCallback(() => {
    void listIgRuns(id)
      .then(setRuns)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Could not load activity"));
  }, [id]);

  useEffect(() => {
    void listIgRuns(id).then(setRuns).catch(() => undefined);
  }, [id]);

  const dirty = useMemo(() => {
    if (!saved || !draft) return false;
    const pick = (row: IgAutomation) =>
      JSON.stringify([row.keywords, row.follow_required, row.comment_reply_enabled, row.config]);
    return pick(saved) !== pick(draft);
  }, [saved, draft]);

  const problems = draft ? problemsFor(draft) : [];

  function patchConfig(next: Partial<IgAutomationConfig>) {
    setDraft((current) => (current ? { ...current, config: { ...current.config, ...next } } : current));
  }

  async function save() {
    if (!draft) return;
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    setSaving(true);
    try {
      const row = await updateIgAutomation(draft.id, {
        keywords: draft.keywords,
        follow_required: draft.follow_required,
        comment_reply_enabled: draft.comment_reply_enabled,
        config: {
          ...draft.config,
          greetings: draft.config.greetings.filter((item) => item.trim()),
          comment_replies: draft.config.comment_replies.filter((item) => item.trim()),
          response: { ...draft.config.response, link_url: draft.config.response.link_url?.trim() || null },
        },
      });
      setSaved(row);
      setDraft(row);
      toast.success("Changes saved — new comments use them right away");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(enabled: boolean) {
    if (!saved) return;
    try {
      const row = await updateIgAutomation(saved.id, { enabled });
      setSaved(row);
      setDraft((current) => (current ? { ...current, enabled: row.enabled } : row));
      toast.success(enabled ? "Automation turned on" : "Automation turned off");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not update");
    }
  }

  async function remove() {
    if (!saved || !window.confirm("Delete this automation? New comments will no longer get replies or DMs.")) return;
    try {
      await deleteIgAutomation(saved.id);
      toast.success("Automation deleted");
      router.push("/automations");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not delete");
    }
  }

  if (!draft) {
    return (
      <div className="flex h-[60svh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/35 bg-white/30 px-3 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <PostThumb src={draft.thumbnail_url} reel={isReel(draft)} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              <Link href="/automations" className="hover:text-foreground">
                Automations
              </Link>{" "}
              / {isReel(draft) ? "Reel" : "Post"}
            </p>
            <h1 className="truncate text-base font-semibold">{draft.name}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="mr-1 flex items-center gap-2 text-sm">
            <Switch checked={saved?.enabled ?? false} onCheckedChange={(value) => void toggle(value)} />
            {saved?.enabled ? "On" : "Off"}
          </label>
          <Button variant="ghost" size="icon" aria-label="Delete automation" onClick={() => void remove()}>
            <Trash2 className="h-4 w-4" />
          </Button>
          {dirty ? (
            <Button variant="outline" onClick={() => setDraft(saved)}>
              Discard
            </Button>
          ) : null}
          <Button disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flow" className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/35 bg-white/20 px-3 sm:px-5">
          <TabsList className="my-2">
            <TabsTrigger value="flow">Flow</TabsTrigger>
            <TabsTrigger value="activity" onClick={() => void loadRuns()}>
              Activity ({saved?.stats.matched ?? 0})
            </TabsTrigger>
          </TabsList>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {saved?.stats.delivered ?? 0} delivered · {saved?.stats.waiting_follow ?? 0} waiting to follow ·{" "}
            {saved?.stats.comment_replies ?? 0} comment replies
          </p>
        </div>
        <TabsContent value="flow" className="mt-0 min-h-0 flex-1 bg-[#f4f7fa]">
          <AutomationCanvas automation={draft} onOpen={setOpen} />
        </TabsContent>
        <TabsContent value="activity" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => void loadRuns()}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
          {runs.length ? (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Commenter</th>
                    <th className="px-4 py-3 font-medium">Comment</th>
                    <th className="px-4 py-3 font-medium">DM</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Comment reply</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">When</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const state = RUN_STATES[run.state] ?? { label: run.state, variant: "muted" as const };
                    return (
                      <tr key={run.id} className="border-b align-top last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {run.commenter_username ? `@${run.commenter_username}` : "Instagram user"}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <p className="line-clamp-2">{run.comment_text}</p>
                          {run.matched_keyword ? (
                            <p className="text-xs text-muted-foreground">matched “{run.matched_keyword}”</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={state.variant}>{state.label}</Badge>
                          {run.error ? <p className="mt-1 max-w-xs text-xs text-muted-foreground">{run.error}</p> : null}
                        </td>
                        <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">
                          {run.public_reply_status}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                          {new Date(run.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              No matching comments yet. When someone comments one of your keywords, it shows up here.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={(value) => !value && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{open ? BLOCK_TITLES[open] : ""}</SheetTitle>
            <SheetDescription>
              {open === "post"
                ? "The post can’t be changed — duplicate the automation to use it on another post."
                : "Edit, then press Save changes in the top bar."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {open === "post" ? (
              <div className="space-y-3">
                <PostThumb src={draft.thumbnail_url} reel={isReel(draft)} className="aspect-square w-full" />
                <p className="text-sm">{draft.caption || "No caption"}</p>
                <div className="flex flex-wrap gap-2">
                  {draft.from_broadcast ? <Badge variant="muted">Published from koLink Broadcasts</Badge> : null}
                  {draft.posted_at ? (
                    <Badge variant="outline">Posted {new Date(draft.posted_at).toLocaleString()}</Badge>
                  ) : null}
                </div>
                {draft.permalink ? (
                  <Button variant="outline" asChild>
                    <a href={draft.permalink} target="_blank" rel="noreferrer">
                      Open on Instagram <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            {open === "keywords" ? (
              <KeywordInput
                value={draft.keywords}
                onChange={(keywords) => setDraft({ ...draft, keywords })}
              />
            ) : null}

            {open === "follow" ? (
              <div className="space-y-4">
                <label className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium">Only send to followers</span>
                    <FieldHint>
                      After they tap, we check their Instagram user id with Graph. Not following → this prompt, not
                      the reward. We only send the DM when Graph says they follow.
                    </FieldHint>
                  </span>
                  <Switch
                    checked={draft.follow_required}
                    onCheckedChange={(follow_required) => setDraft({ ...draft, follow_required })}
                  />
                </label>
                {draft.follow_required ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Message to non-followers</Label>
                      <Textarea
                        rows={3}
                        maxLength={640}
                        value={draft.config.follow_prompt}
                        onChange={(event) => patchConfig({ follow_prompt: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Button</Label>
                      <Input
                        maxLength={20}
                        value={draft.config.follow_button}
                        onChange={(event) => patchConfig({ follow_button: event.target.value })}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {open === "reply" ? (
              <div className="space-y-4">
                <label className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium">Reply publicly to each matching comment</span>
                    <FieldHint>One variation is picked at random.</FieldHint>
                  </span>
                  <Switch
                    checked={draft.comment_reply_enabled}
                    onCheckedChange={(comment_reply_enabled) => setDraft({ ...draft, comment_reply_enabled })}
                  />
                </label>
                {draft.comment_reply_enabled ? (
                  <VariationsInput
                    value={draft.config.comment_replies}
                    onChange={(comment_replies) => patchConfig({ comment_replies })}
                    placeholder="Thanks for commenting! Just sent you a DM 📩"
                    addLabel="Add reply variation"
                  />
                ) : null}
              </div>
            ) : null}

            {open === "dm" ? (
              <div className="space-y-6">
                {draft.follow_required || draft.config.response.media_url ? (
                  <div className="space-y-2">
                    <Label>First DM (private reply with a button)</Label>
                    <Textarea
                      rows={2}
                      maxLength={640}
                      value={draft.config.opener_text}
                      onChange={(event) => patchConfig({ opener_text: event.target.value })}
                    />
                    <Input
                      maxLength={20}
                      value={draft.config.opener_button}
                      onChange={(event) => patchConfig({ opener_button: event.target.value })}
                    />
                    <FieldHint>Instagram only lets us message again after they tap this button.</FieldHint>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>What they receive</Label>
                  <ResponseEditor
                    value={draft.config.response}
                    onChange={(response) => patchConfig({ response })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Greeting variations (optional)</Label>
                  <VariationsInput
                    value={draft.config.greetings}
                    onChange={(greetings) => patchConfig({ greetings })}
                    placeholder="Here's your link!"
                    addLabel="Add greeting"
                  />
                </div>
              </div>
            ) : null}

            {open && open !== "post" ? (
              <Button className="w-full" onClick={() => setOpen(null)}>
                Done
              </Button>
            ) : null}
            {open && open !== "post" && problems.length ? (
              <p className="text-xs text-amber-700">{problems[0]}</p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
