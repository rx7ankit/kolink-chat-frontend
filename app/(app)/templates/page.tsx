"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listTemplates, useTemplate, type ApiTemplate } from "@/lib/api/automations";
import { ApiError } from "@/lib/api/client";
import type { ChannelId } from "@/lib/mock";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);

  useEffect(() => {
    void listTemplates()
      .then(setTemplates)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load templates"));
  }, []);

  async function useOne(id: string) {
    try {
      const created = await useTemplate(id);
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
        description="Quick automations you can drop onto the canvas"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <div key={template.id} className="glass flex flex-col rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <ChannelBadge channel={template.channel as ChannelId} />
              <Badge variant="muted">{template.category}</Badge>
            </div>
            <h2 className="mt-3 font-semibold">{template.name}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{template.description}</p>
            <Button className="mt-4" onClick={() => void useOne(template.id)}>
              Use template
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
