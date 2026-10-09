"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PostThumb } from "@/components/ig-automations/post-thumb";
import { PostPicker } from "@/components/ig-automations/post-picker";
import {
  FieldHint,
  KeywordInput,
  ResponseEditor,
  VariationsInput,
  responseProblems,
} from "@/components/ig-automations/fields";
import { CollapsibleCaption } from "@/components/collapsible-caption";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  DEFAULT_CONFIG,
  createIgAutomation,
  getIgMedia,
  isReel,
  type IgAutomationConfig,
  type IgMediaItem,
} from "@/lib/api/ig-automations";
import { keywordProblems } from "@/lib/ig-keywords";
import { cn } from "@/lib/utils";

const STEPS = ["Post", "Keywords", "Follow check", "DM response", "Comment reply", "Review"] as const;

export default function NewIgAutomationPage() {
  return (
    <Suspense fallback={<p className="page-shell text-sm text-muted-foreground">Loading…</p>}>
      <NewIgAutomationPageInner />
    </Suspense>
  );
}

function NewIgAutomationPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetMediaId = searchParams.get("media");
  const fromBroadcast = searchParams.get("from") === "broadcast";
  const [step, setStep] = useState(fromBroadcast && presetMediaId ? 1 : 0);
  const [media, setMedia] = useState<IgMediaItem | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [followRequired, setFollowRequired] = useState(true);
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(true);
  const [config, setConfig] = useState<IgAutomationConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!presetMediaId) return;
    void getIgMedia(presetMediaId)
      .then((item) => {
        if (item.automation_id) {
          toast.message("This post already has an automation");
          router.replace(`/automations/ig/${item.automation_id}`);
          return;
        }
        setMedia(item);
        if (fromBroadcast) setStep(1);
      })
      .catch((error) => {
        if (fromBroadcast) setStep(0);
        toast.error(error instanceof ApiError ? error.detail : "Could not load that post");
      });
  }, [presetMediaId, fromBroadcast, router]);

  const problems = useMemo(() => {
    switch (step) {
      case 0:
        return media ? [] : ["Pick a post or reel"];
      case 1:
        return keywordProblems(keywords);
      case 2:
        return followRequired && (!config.follow_prompt.trim() || !config.follow_button.trim())
          ? ["Fill in the follow message and button"]
          : [];
      case 3: {
        const list = responseProblems(config.response);
        const needsOpener = followRequired || Boolean(config.response.media_url);
        if (needsOpener && (!config.opener_text.trim() || !config.opener_button.trim())) {
          list.push("Fill in the first DM and its button");
        }
        return list;
      }
      case 4:
        return commentReplyEnabled && !config.comment_replies.some((reply) => reply.trim())
          ? ["Add at least one comment reply, or turn comment replies off"]
          : [];
      default:
        return [];
    }
  }, [step, media, keywords, followRequired, config, commentReplyEnabled]);

  function patch(next: Partial<IgAutomationConfig>) {
    setConfig((current) => ({ ...current, ...next }));
  }

  async function submit() {
    if (!media) return;
    setSaving(true);
    try {
      const created = await createIgAutomation({
        media_id: media.id,
        keywords,
        follow_required: followRequired,
        comment_reply_enabled: commentReplyEnabled,
        config: {
          ...config,
          greetings: config.greetings.filter((item) => item.trim()),
          comment_replies: config.comment_replies.filter((item) => item.trim()),
          response: {
            ...config.response,
            link_url: config.response.link_url?.trim() || null,
          },
        },
      });
      toast.success("Automation is live");
      router.push(`/automations/ig/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create automation");
      setSaving(false);
    }
  }

  const needsOpener = followRequired || Boolean(config.response.media_url);

  return (
    <div className="page-shell max-w-5xl">
      <div className="sticky top-0 z-20 -mx-1 mb-4 bg-white/80 px-1 pb-1 pt-1 backdrop-blur-md">
      <PageHeader
        className="mb-3"
        title="Set up comment automation"
        description="When someone comments a keyword on your post, reply to the comment and DM them what you promised."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {problems.length ? <p className="max-w-[14rem] text-xs text-amber-700">{problems[0]}</p> : null}
            <Button variant="outline" asChild>
              <Link href="/templates">Cancel</Link>
            </Button>
            <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={problems.length > 0} onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={saving} onClick={() => void submit()}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Activate automation
              </Button>
            )}
          </div>
        }
      />

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              disabled={index > step}
              onClick={() => setStep(index)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                index === step && "border-primary bg-primary text-primary-foreground",
                index < step && "border-primary/30 bg-primary/10 text-primary",
                index > step && "text-muted-foreground",
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px]">
                {index < step ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        {step === 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">Which post or reel?</h2>
              <FieldHint>Posts that already have an automation are greyed out.</FieldHint>
            </div>
            <PostPicker selectedId={media?.id ?? null} onSelect={setMedia} />
          </section>
        ) : null}

        {media && step > 0 && step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mb-5 flex w-full items-center gap-3 rounded-2xl border bg-white/60 p-2.5 text-left hover:bg-white/80"
          >
            <PostThumb src={media.preview_url} reel={isReel(media)} className="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Using this post</p>
              <p className="line-clamp-1 text-sm font-medium">{media.caption || "No caption"}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-primary">Change</span>
          </button>
        ) : null}

        {step === 1 ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">Trigger keywords</h2>
              <FieldHint>A comment containing any of these starts the automation.</FieldHint>
            </div>
            <KeywordInput value={keywords} onChange={setKeywords} />
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Only send to followers</h2>
                <FieldHint>
                  After they tap the first DM button, we look up their Instagram user id and check whether they follow
                  you. If they tapped without following, they get the message below — not your reward. We check again
                  on every later tap. People who never commented are never messaged.
                </FieldHint>
              </div>
              <Switch checked={followRequired} onCheckedChange={setFollowRequired} />
            </div>
            {followRequired ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                <div className="space-y-1.5">
                  <Label>Message to non-followers</Label>
                  <Textarea
                    rows={3}
                    maxLength={640}
                    value={config.follow_prompt}
                    onChange={(event) => patch({ follow_prompt: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Button</Label>
                  <Input
                    maxLength={20}
                    value={config.follow_button}
                    onChange={(event) => patch({ follow_button: event.target.value })}
                  />
                  <FieldHint>Tapping it re-checks if they follow.</FieldHint>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-6">
            {needsOpener ? (
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold">First DM</h2>
                  <FieldHint>
                    Instagram allows one private reply per comment, so we first send this with a button. Tapping it
                    lets us {followRequired ? "check that they follow and " : ""}send your response.
                  </FieldHint>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                  <Textarea
                    rows={2}
                    maxLength={640}
                    value={config.opener_text}
                    onChange={(event) => patch({ opener_text: event.target.value })}
                  />
                  <div className="space-y-1.5">
                    <Input
                      maxLength={20}
                      value={config.opener_button}
                      onChange={(event) => patch({ opener_button: event.target.value })}
                    />
                    <FieldHint>Button label</FieldHint>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold">What they receive</h2>
                <FieldHint>Any mix of a message, a link button, and an image or video.</FieldHint>
              </div>
              <ResponseEditor value={config.response} onChange={(response) => patch({ response })} />
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold">Greeting variations (optional)</h2>
                <FieldHint>Added above your message, e.g. “Here’s your link!” or “Enjoy 🎉”.</FieldHint>
              </div>
              <VariationsInput
                value={config.greetings}
                onChange={(greetings) => patch({ greetings })}
                placeholder="Here's your link!"
                addLabel="Add greeting"
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Reply to the comment publicly</h2>
                <FieldHint>Posted under each matching comment so others see you responded.</FieldHint>
              </div>
              <Switch checked={commentReplyEnabled} onCheckedChange={setCommentReplyEnabled} />
            </div>
            {commentReplyEnabled ? (
              <VariationsInput
                value={config.comment_replies}
                onChange={(comment_replies) => patch({ comment_replies })}
                placeholder="Thanks for commenting! Just sent you a DM 📩"
                addLabel="Add reply variation"
              />
            ) : null}
          </section>
        ) : null}

        {step === 5 && media ? (
          <section className="space-y-5">
            <h2 className="font-semibold">Review</h2>
            <div className="flex gap-4 rounded-2xl border bg-white/60 p-4">
              <PostThumb src={media.preview_url} reel={isReel(media)} className="h-24 w-24" />
              <div className="min-w-0 space-y-1 text-sm">
                <Badge variant="rose">{isReel(media) ? "Reel" : "Post"}</Badge>
                <CollapsibleCaption text={media.caption || "No caption"} lines={3} className="text-sm" />
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ReviewItem label="Keywords">{keywords.join(", ")}</ReviewItem>
              <ReviewItem label="Follow check">{followRequired ? "On — followers only" : "Off"}</ReviewItem>
              <ReviewItem label="DM">
                {[
                  config.response.text && "message",
                  config.response.link_url && "link",
                  config.response.media_url && config.response.media_type,
                ]
                  .filter(Boolean)
                  .join(" + ")}
                {config.greetings.filter((g) => g.trim()).length
                  ? ` · ${config.greetings.filter((g) => g.trim()).length} greeting variation(s)`
                  : ""}
              </ReviewItem>
              <ReviewItem label="Comment reply">
                {commentReplyEnabled
                  ? `${config.comment_replies.filter((r) => r.trim()).length} variation(s)`
                  : "Off"}
              </ReviewItem>
            </dl>
            <FieldHint>
              Each person gets the DM once per post. Further comments from them on this post are ignored.
            </FieldHint>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ReviewItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">{children || "—"}</dd>
    </div>
  );
}
