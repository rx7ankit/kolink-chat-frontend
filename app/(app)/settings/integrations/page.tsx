"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listIntegrations, patchIntegration, type Integration } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";

export default function IntegrationsSettingsPage() {
  const [items, setItems] = useState<Integration[]>([]);

  useEffect(() => {
    void listIntegrations()
      .then(setItems)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load integrations"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Integrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Connect commerce and ops tools. Flags persist in your workspace.</p>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center justify-between glass rounded-2xl px-4 py-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <Button
              variant={item.connected ? "outline" : "default"}
              size="sm"
              onClick={async () => {
                try {
                  const next = await patchIntegration(item.slug, !item.connected);
                  setItems((current) => current.map((row) => (row.slug === next.slug ? next : row)));
                  toast.success(`${item.name} ${next.connected ? "connected" : "disconnected"}`);
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.detail : "Update failed");
                }
              }}
            >
              {item.connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
