"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listTemplates,
  useTemplate as createAutomationFromTemplate,
  type ApiTemplate,
} from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import type { ChannelId } from "@/lib/mock";

type PlatformTab = "all" | "whatsapp" | "instagram" | "facebook";

const TABS: { value: PlatformTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
];

/** Messenger recipes belong to the Facebook platform tab. */
const TAB_CHANNELS: Record<Exclude<PlatformTab, "all">, string[]> = {
  whatsapp: ["whatsapp"],
  instagram: ["instagram"],
  facebook: ["facebook", "messenger"],
};

function MessageTemplatesCard() {
  return (
    <Link
      href="/templates/whatsapp"
      className="glass group flex flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <ChannelBadge channel="whatsapp" />
        <Badge variant="muted">Meta</Badge>
      </div>
      <h2 className="mt-3 flex items-center gap-2 font-semibold">
        <LayoutTemplate className="h-4 w-4 text-emerald-600" />
        Message templates
      </h2>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        Create and manage WhatsApp message templates on your connected WhatsApp Business Account.
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Manage templates
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [tab, setTab] = useState<PlatformTab>("all");

  useEffect(() => {
    void listTemplates()
      .then(setTemplates)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load templates"));
  }, []);

  const visible = useMemo(() => {
    if (tab === "all") return templates;
    const channels = TAB_CHANNELS[tab];
    return templates.filter((template) => channels.includes(template.channel));
  }, [tab, templates]);

  const showMessageTemplates = tab === "all" || tab === "whatsapp";

  async function applyTemplate(id: string) {
    try {
      const created = await createAutomationFromTemplate(id);
      toast.success("Automation created from template");
      router.push(`/automations/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not use template");
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Templates"
        description="WhatsApp message templates and quick automations you can drop onto the canvas"
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as PlatformTab)}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {showMessageTemplates ? <MessageTemplatesCard /> : null}

              {visible.map((template) => (
                <div key={template.id} className="glass flex flex-col rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <ChannelBadge channel={template.channel as ChannelId} />
                    <Badge variant="muted">{template.category}</Badge>
                  </div>
                  <h2 className="mt-3 font-semibold">{template.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{template.description}</p>
                  <Button className="mt-4" onClick={() => void applyTemplate(template.id)}>
                    Trigger automation
                  </Button>
                </div>
              ))}
            </div>

            {!showMessageTemplates && !visible.length ? (
              <p className="glass mt-4 rounded-2xl p-6 text-sm text-muted-foreground">
                No templates for this platform yet.
              </p>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
