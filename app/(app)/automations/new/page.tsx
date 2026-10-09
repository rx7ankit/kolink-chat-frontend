"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PostThumb } from "@/components/ig-automations/post-thumb";
import { PostPicker } from "@/components/ig-automations/post-picker";
import { AutomationTypePicker } from "@/components/ig-automations/type-picker";
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
  EMPTY_RESPONSE,
  createIgAutomation,
  getIgMedia,
  isReel,
  type IgAutomationConfig,
  type IgMediaItem,
} from "@/lib/api/ig-automations";
import {
  KIND_LABELS,
  existingAutomationHref,
  isAutomationKind,
  isAutomationPlatform,
  minKeywordsFor,
  platformLabel,
  type AutomationKind,
  type AutomationPlatform,
} from "@/lib/comment-automations";
import { keywordProblems } from "@/lib/ig-keywords";
import { cn } from "@/lib/utils";

const STEPS_DM = ["Post", "Keywords", "Follow check", "DM response", "Comment reply", "Review"] as const;
const STEPS_REPLY = ["Post", "Keywords", "Reply", "Review"] as const;
const STEPS_DELETE = ["Post", "Keywords", "Review"] as const;

const REPLY_DEFAULT: IgAutomationConfig = {
  ...DEFAULT_CONFIG,
  comment_replies: ["Thanks for commenting!"],
  response: null,
};

function stepsFor(kind: AutomationKind) {
  if (kind === "keyword_reply") return STEPS_REPLY;
  if (kind === "keyword_delete") return STEPS_DELETE;
  return STEPS_DM;
}

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
  const platformParam = searchParams.get("platform");
  const platform: AutomationPlatform = isAutomationPlatform(platformParam) ? platformParam : "instagram";
  const kindParam = searchParams.get("kind");
  const kind: AutomationKind | null = isAutomationKind(kindParam) ? kindParam : null;

  if (!kind) {
    return <AutomationTypePicker platform={platform} mediaId={presetMediaId} fromBroadcast={fromBroadcast} />;
  }

  return (
    <AutomationWizard
      platform={platform}
      kind={kind}
      presetMediaId={presetMediaId}
      fromBroadcast={fromBroadcast}
      router={router}
    />
  );
}

function AutomationWizard({
  platform,
  kind,
  presetMediaId,
  fromBroadcast,
  router,
}: {
  platform: AutomationPlatform;
  kind: AutomationKind;
  presetMediaId: string | null;
  fromBroadcast: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const steps = stepsFor(kind);
  const minKeywords = minKeywordsFor(kind);
  const [step, setStep] = useState(fromBroadcast && presetMediaId ? 1 : 0);
  const [media, setMedia] = useState<IgMediaItem | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [followRequired, setFollowRequired] = useState(kind === "keyword_dm");
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(kind !== "keyword_delete");
  const [config, setConfig] = useState<IgAutomationConfig>(kind === "keyword_dm" ? DEFAULT_CONFIG : REPLY_DEFAULT);
  const [saving, setSaving] = useState(false);
  const reviewIndex = steps.length - 1;

  useEffect(() => {
    if (!presetMediaId) return;
    void getIgMedia(presetMediaId, { platform, kind })
      .then((item) => {
        if (item.automation_id) {
          toast.message("This post already has that automation");
          router.replace(existingAutomationHref(item.automation_id));
          return;
        }
        setMedia(item);
        if (fromBroadcast) setStep(1);
      })
      .catch((error) => {
        if (fromBroadcast) setStep(0);
        toast.error(error instanceof ApiError ? error.detail : "Could not load that post");
      });
  }, [presetMediaId, fromBroadcast, router, platform, kind]);

  const problems = useMemo(() => {
    const label = steps[step];
    if (label === "Post") return media ? [] : ["Pick a post"];
    if (label === "Keywords") return keywordProblems(keywords, minKeywords);
    if (label === "Follow check") {
      return followRequired && (!config.follow_prompt.trim() || !config.follow_button.trim())
        ? ["Fill in the follow message and button"]
        : [];
    }
    if (label === "DM response") {
      const list = responseProblems(config.response);
      const needsOpener = followRequired || Boolean(config.response?.media_url);
      if (needsOpener && (!config.opener_text.trim() || !config.opener_button.trim())) {
        list.push("Fill in the first DM and its button");
      }
      return list;
    }
    if (label === "Comment reply" || label === "Reply") {
      return commentReplyEnabled && !config.comment_replies.some((reply) => reply.trim())
        ? ["Add at least one comment reply"]
        : [];
    }
    return [];
  }, [step, steps, media, keywords, minKeywords, followRequired, config, commentReplyEnabled]);

  function patch(next: Partial<IgAutomationConfig>) {
    setConfig((current) => ({ ...current, ...next }));
  }

  async function submit() {
    if (!media) return;
    setSaving(true);
    try {
      const created = await createIgAutomation({
        media_id: media.id,
        platform,
        kind,
        keywords,
        follow_required: kind === "keyword_dm" ? followRequired : false,
        comment_reply_enabled: kind === "keyword_reply" ? true : kind === "keyword_delete" ? false : commentReplyEnabled,
        config: {
          ...config,
          greetings: config.greetings.filter((item) => item.trim()),
          comment_replies: config.comment_replies.filter((item) => item.trim()),
          response:
            kind === "keyword_dm" && config.response
              ? { ...config.response, link_url: config.response.link_url?.trim() || null }
              : null,
        },
      });
      toast.success("Automation is live");
      router.push(existingAutomationHref(created.id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create automation");
      setSaving(false);
    }
  }

  const needsOpener = followRequired || Boolean(config.response?.media_url);
  const stepLabel = steps[step];

  return (
    <div className="page-shell max-w-5xl">
      <div className="sticky top-0 z-20 -mx-1 mb-4 bg-white/80 px-1 pb-1 pt-1 backdrop-blur-md">
        <PageHeader
          className="mb-3"
          title={KIND_LABELS[kind]}
          description={`${platformLabel(platform)} · trigger words on a selected post.`}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {problems.length ? <p className="max-w-[14rem] text-xs text-amber-700">{problems[0]}</p> : null}
              <Button variant="outline" asChild>
                <Link href="/automations">Cancel</Link>
              </Button>
              <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              {step < reviewIndex ? (
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
          {steps.map((label, index) => (
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
        {stepLabel === "Post" ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">Which post?</h2>
              <FieldHint>Posts that already have this automation type are greyed out.</FieldHint>
            </div>
            <PostPicker
              selectedId={media?.id ?? null}
              onSelect={setMedia}
              platform={platform}
              kind={kind}
            />
          </section>
        ) : null}

        {media && step > 0 && step < reviewIndex ? (
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

        {stepLabel === "Keywords" ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold">Trigger keywords</h2>
              <FieldHint>
                {kind === "keyword_delete"
                  ? "A comment containing any of these is deleted. Add at least 3 variations."
                  : "A comment containing any of these starts the automation."}
              </FieldHint>
            </div>
            <KeywordInput value={keywords} onChange={setKeywords} minCount={minKeywords} />
          </section>
        ) : null}

        {stepLabel === "Follow check" ? (
          <section className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Only send to followers</h2>
                <FieldHint>
                  After they tap the first DM button, we look up their Instagram user id and check whether they follow
                  you. If they tapped without following, they get the message below — not your reward.
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

        {stepLabel === "DM response" ? (
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
              <ResponseEditor
                value={config.response ?? EMPTY_RESPONSE}
                onChange={(response) => patch({ response })}
              />
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

        {stepLabel === "Comment reply" || stepLabel === "Reply" ? (
          <section className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Reply to the comment publicly</h2>
                <FieldHint>Posted under each matching comment so others see you responded.</FieldHint>
              </div>
              {kind === "keyword_dm" ? (
                <Switch checked={commentReplyEnabled} onCheckedChange={setCommentReplyEnabled} />
              ) : null}
            </div>
            {commentReplyEnabled ? (
              <VariationsInput
                value={config.comment_replies}
                onChange={(comment_replies) => patch({ comment_replies })}
                placeholder={
                  kind === "keyword_dm"
                    ? "Thanks for commenting! Just sent you a DM 📩"
                    : "Thanks for commenting!"
                }
                addLabel="Add reply variation"
              />
            ) : null}
          </section>
        ) : null}

        {stepLabel === "Review" && media ? (
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
              <ReviewItem label="Type">{KIND_LABELS[kind]}</ReviewItem>
              <ReviewItem label="Keywords">{keywords.join(", ")}</ReviewItem>
              {kind === "keyword_dm" ? (
                <>
                  <ReviewItem label="Follow check">{followRequired ? "On — followers only" : "Off"}</ReviewItem>
                  <ReviewItem label="DM">
                    {[
                      config.response?.text && "message",
                      config.response?.link_url && "link",
                      config.response?.media_url && config.response.media_type,
                    ]
                      .filter(Boolean)
                      .join(" + ")}
                  </ReviewItem>
                  <ReviewItem label="Comment reply">
                    {commentReplyEnabled
                      ? `${config.comment_replies.filter((r) => r.trim()).length} variation(s)`
                      : "Off"}
                  </ReviewItem>
                </>
              ) : null}
              {kind === "keyword_reply" ? (
                <ReviewItem label="Comment reply">
                  {config.comment_replies.filter((r) => r.trim()).length} variation(s)
                </ReviewItem>
              ) : null}
              {kind === "keyword_delete" ? (
                <ReviewItem label="Action">Matching comments are deleted</ReviewItem>
              ) : null}
            </dl>
            <FieldHint>
              {kind === "keyword_delete"
                ? "Each matching comment is deleted once. Add at least 3 trigger words so everyday comments are not removed by accident."
                : "Each person is handled once per post. Further matching comments from them on this post are ignored."}
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
