"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthGate } from "@/components/app/auth-gate";
import { ChannelBadge } from "@/components/channel-badge";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/provider";
import { channels } from "@/lib/mock";
import type { ChannelId } from "@/lib/mock";
import { cn } from "@/lib/utils";

const uses = [
  { id: "sales", title: "Sell in DMs", body: "Turn comments into checkouts." },
  { id: "faq", title: "Answer FAQs", body: "Hours, shipping, returns on autopilot." },
  { id: "leads", title: "Capture leads", body: "Collect email and phone from chat." },
  { id: "creator", title: "Creator growth", body: "Welcome followers and collabs." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { workspace } = useAuth();
  const [step, setStep] = useState(0);
  const [useCase, setUseCase] = useState("sales");
  const [connected, setConnected] = useState<ChannelId | null>(null);

  return (
    <AuthGate>
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg glass rounded-3xl p-8">
          <Logo />
          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step + 1} of 3
          </p>
          {step === 0 && (
            <>
              <h1 className="mt-2 text-2xl font-semibold">Name your workspace</h1>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ws">Workspace</Label>
                <Input id="ws" defaultValue={workspace?.name || "KoLink"} />
              </div>
              <Button className="mt-6 w-full" onClick={() => setStep(1)}>
                Continue
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="mt-2 text-2xl font-semibold">What do you want first?</h1>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {uses.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setUseCase(item.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left",
                      useCase === item.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                  </button>
                ))}
              </div>
              <Button className="mt-6 w-full" onClick={() => setStep(2)}>
                Continue
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="mt-2 text-2xl font-semibold">Connect a first channel</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Next you’ll connect a real account from Channels — Instagram, WhatsApp, X, LinkedIn, or
                Gmail.
              </p>
              <div className="mt-5 grid gap-2">
                {channels.slice(0, 6).map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setConnected(channel.id);
                      toast.success(`${channel.name} — continue to connect it`);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-left",
                      connected === channel.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.handle}</p>
                    </div>
                    <ChannelBadge channel={channel.id} />
                  </button>
                ))}
              </div>
              <Button
                className="mt-6 w-full"
                onClick={() => {
                  toast.success("You're in");
                  router.push("/channels");
                }}
              >
                Go to Channels
              </Button>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
