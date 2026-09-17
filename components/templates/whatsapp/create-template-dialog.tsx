"use client";

import { useMemo, useState } from "react";
import { Check, KeyRound, Megaphone, Plus, Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TemplatePreview } from "@/components/templates/whatsapp/template-preview";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  createWhatsAppTemplate,
  type TemplateCategory,
  type TemplateComponent,
} from "@/lib/api/whatsapp-templates";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

type TemplateType = {
  id: string;
  label: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
};

const CATEGORIES: {
  id: TemplateCategory;
  label: string;
  icon: typeof Megaphone;
  goodFor: string;
  types: TemplateType[];
}[] = [
  {
    id: "MARKETING",
    label: "Marketing",
    icon: Megaphone,
    goodFor: "Welcome messages, promotions, offers, coupons, newsletters, announcements",
    types: [
      {
        id: "DEFAULT",
        label: "Default",
        description: "Send messages with media and customised buttons to engage your customers.",
      },
      {
        id: "CATALOGUE",
        label: "Catalogue",
        description: "Send messages that drive sales by connecting your product catalogue.",
        disabled: true,
        disabledReason: "Needs a connected product catalogue on your WhatsApp Business Account.",
      },
      {
        id: "CALL_PERMISSION",
        label: "Calling permissions request",
        description: "Ask customers if you can call them on WhatsApp.",
        disabled: true,
        disabledReason: "Needs WhatsApp calling enabled on your number.",
      },
    ],
  },
  {
    id: "UTILITY",
    label: "Utility",
    icon: Bell,
    goodFor: "Order confirmations, account updates, receipts, appointment reminders, billing",
    types: [
      {
        id: "DEFAULT",
        label: "Default",
        description: "Send messages about an existing order or account.",
      },
      {
        id: "CALL_PERMISSION",
        label: "Calling permissions request",
        description: "Ask customers if you can call them on WhatsApp.",
        disabled: true,
        disabledReason: "Needs WhatsApp calling enabled on your number.",
      },
    ],
  },
  {
    id: "AUTHENTICATION",
    label: "Authentication",
    icon: KeyRound,
    goodFor: "One-time password, account recovery code, account verification, integrity challenges",
    types: [
      {
        id: "OTP",
        label: "One-time passcode",
        description: "Send codes to verify a transaction or login.",
        disabled: true,
        disabledReason: "One-time passcode templates need an authentication button setup.",
      },
    ],
  },
];

const LANGUAGES = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "pt_BR", label: "Portuguese (BR)" },
  { value: "ar", label: "Arabic" },
];

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Set up template" },
  { id: 2, label: "Edit template" },
  { id: 3, label: "Submit for Review" },
];

function variableCount(body: string) {
  const found = new Set<string>();
  for (const match of body.matchAll(/\{\{(\d+)\}\}/g)) found.add(match[1]);
  return found.size;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<TemplateCategory>("UTILITY");
  const [templateType, setTemplateType] = useState("DEFAULT");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [buttons, setButtons] = useState<{ type: string; text: string; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const active = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[1];
  const varCount = variableCount(body);

  const previewSamples = useMemo(
    () => Array.from({ length: varCount }, (_, index) => samples[index] || ""),
    [samples, varCount],
  );

  function reset() {
    setStep(1);
    setCategory("UTILITY");
    setTemplateType("DEFAULT");
    setName("");
    setLanguage("en_US");
    setHeader("");
    setBody("");
    setFooter("");
    setSamples([]);
    setButtons([]);
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  function pickCategory(next: TemplateCategory) {
    setCategory(next);
    const first = CATEGORIES.find((item) => item.id === next)?.types.find((type) => !type.disabled);
    setTemplateType(first?.id ?? "DEFAULT");
  }

  function buildComponents(): TemplateComponent[] {
    const components: TemplateComponent[] = [];
    if (header.trim()) {
      components.push({ type: "HEADER", format: "TEXT", text: header.trim() });
    }
    const bodyComponent: TemplateComponent = { type: "BODY", text: body.trim() };
    if (varCount > 0) {
      bodyComponent.example = {
        body_text: [previewSamples.map((sample, index) => sample || `sample${index + 1}`)],
      };
    }
    components.push(bodyComponent);
    if (footer.trim()) {
      components.push({ type: "FOOTER", text: footer.trim() });
    }
    const usable = buttons.filter((button) => button.text.trim());
    if (usable.length) {
      components.push({
        type: "BUTTONS",
        buttons: usable.map((button) =>
          button.type === "URL"
            ? { type: "URL", text: button.text.trim(), url: button.url.trim() }
            : { type: "QUICK_REPLY", text: button.text.trim() },
        ),
      });
    }
    return components;
  }

  const nameValid = /^[a-z0-9_]{1,512}$/.test(name);
  const issues: string[] = [];
  if (!nameValid) issues.push("Name must use lowercase letters, numbers, and underscores only.");
  if (!body.trim()) issues.push("Body text is required.");
  if (previewSamples.some((sample) => !sample.trim())) {
    issues.push("Add a sample value for every variable.");
  }
  if (buttons.some((button) => button.type === "URL" && !button.url.trim())) {
    issues.push("URL buttons need a link.");
  }

  async function submit() {
    setSubmitting(true);
    try {
      await createWhatsAppTemplate({
        name,
        language,
        category,
        components: buildComponents(),
      });
      toast.success("Template submitted to Meta for review");
      onCreated();
      close(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[min(96vw,64rem)] max-w-5xl gap-0 p-0">
        <div className="border-b border-white/50 px-6 py-4">
          <DialogHeader>
            <DialogTitle>Create template</DialogTitle>
            <DialogDescription className="sr-only">
              Create a WhatsApp message template on your connected WhatsApp Business Account.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {STEPS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  step === item.id ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    step > item.id
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : step === item.id
                        ? "border-primary text-primary"
                        : "border-muted-foreground/40",
                  )}
                >
                  {step > item.id ? <Check className="h-3 w-3" /> : item.id}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid max-h-[70vh] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5 px-6 py-5">
            {step === 1 ? (
              <>
                <div>
                  <h3 className="font-medium">Set up your template</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose the category that best describes your message template. Then select the type
                    of message that you want to send.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
                  {CATEGORIES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => pickCategory(item.id)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                          category === item.id
                            ? "bg-white/70 text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-white/40",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {active.types.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      disabled={type.disabled}
                      onClick={() => setTemplateType(type.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                        templateType === type.id && !type.disabled
                          ? "border-primary/40 bg-primary/5"
                          : "border-white/60 bg-white/40 hover:bg-white/60",
                        type.disabled && "cursor-not-allowed opacity-60 hover:bg-white/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          templateType === type.id && !type.disabled
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {templateType === type.id && !type.disabled ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{type.label}</span>
                        <span className="block text-xs text-muted-foreground">{type.description}</span>
                        {type.disabled ? (
                          <span className="mt-1 block text-xs text-amber-700">{type.disabledReason}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div>
                  <h3 className="font-medium">Edit your template</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Name the template, then write the message. Use {"{{1}}"} for variables.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-name">Template name</Label>
                    <Input
                      id="tpl-name"
                      value={name}
                      placeholder="order_update"
                      onChange={(event) =>
                        setName(
                          event.target.value
                            .toLowerCase()
                            .replace(/[\s-]+/g, "_")
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tpl-language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="tpl-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tpl-header">Header (optional)</Label>
                  <Input
                    id="tpl-header"
                    value={header}
                    maxLength={60}
                    placeholder="Order update"
                    onChange={(event) => setHeader(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tpl-body">Body</Label>
                  <Textarea
                    id="tpl-body"
                    value={body}
                    rows={5}
                    maxLength={1024}
                    placeholder="Hi {{1}}, thanks for messaging us. A teammate will reply in this chat shortly."
                    onChange={(event) => setBody(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{body.length} / 1024</p>
                </div>

                {varCount > 0 ? (
                  <div className="space-y-2 rounded-2xl border border-white/60 bg-white/40 p-4">
                    <p className="text-sm font-medium">Samples for variables</p>
                    {previewSamples.map((sample, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-12 text-xs text-muted-foreground">{`{{${index + 1}}}`}</span>
                        <Input
                          value={sample}
                          placeholder={`Sample ${index + 1}`}
                          onChange={(event) => {
                            const next = [...previewSamples];
                            next[index] = event.target.value;
                            setSamples(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="tpl-footer">Footer (optional)</Label>
                  <Input
                    id="tpl-footer"
                    value={footer}
                    maxLength={60}
                    placeholder="Reply STOP to opt out"
                    onChange={(event) => setFooter(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Buttons (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={buttons.length >= 3}
                      onClick={() => setButtons([...buttons, { type: "QUICK_REPLY", text: "", url: "" }])}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add button
                    </Button>
                  </div>
                  {buttons.map((button, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <Select
                        value={button.type}
                        onValueChange={(value) => {
                          const next = [...buttons];
                          next[index] = { ...next[index], type: value };
                          setButtons(next);
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick reply</SelectItem>
                          <SelectItem value="URL">Visit website</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="w-40"
                        value={button.text}
                        placeholder="Button text"
                        maxLength={25}
                        onChange={(event) => {
                          const next = [...buttons];
                          next[index] = { ...next[index], text: event.target.value };
                          setButtons(next);
                        }}
                      />
                      {button.type === "URL" ? (
                        <Input
                          className="w-56"
                          value={button.url}
                          placeholder="https://example.com"
                          onChange={(event) => {
                            const next = [...buttons];
                            next[index] = { ...next[index], url: event.target.value };
                            setButtons(next);
                          }}
                        />
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setButtons(buttons.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div>
                  <h3 className="font-medium">Submit for review</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Meta reviews the template before you can send it. Approval usually takes a few
                    minutes.
                  </p>
                </div>

                <dl className="grid gap-3 rounded-2xl border border-white/60 bg-white/40 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="font-medium">{name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Category</dt>
                    <dd className="font-medium">{active.label}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Language</dt>
                    <dd className="font-medium">{language}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Variables</dt>
                    <dd className="font-medium">{varCount}</dd>
                  </div>
                </dl>

                {issues.length ? (
                  <ul className="space-y-1 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-950">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-950">
                    Ready to submit.
                  </p>
                )}
              </>
            ) : null}
          </div>

          <div className="border-t border-white/50 px-6 py-5 lg:border-l lg:border-t-0">
            <TemplatePreview
              data={{ header, body, footer, buttons, samples: previewSamples }}
              className="bg-white/40"
            />
            {step === 1 ? (
              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium">This template is good for</p>
                <p className="text-sm text-muted-foreground">{active.goodFor}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/50 px-6 py-4">
          <Button variant="outline" onClick={() => (step === 1 ? close(false) : setStep((step - 1) as Step))}>
            {step === 1 ? "Discard" : "Back"}
          </Button>
          {step === 3 ? (
            <Button disabled={submitting || issues.length > 0} onClick={() => void submit()}>
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          ) : (
            <Button
              disabled={step === 2 && (!nameValid || !body.trim())}
              onClick={() => setStep((step + 1) as Step)}
            >
              Next
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
