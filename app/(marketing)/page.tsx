import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, Workflow } from "lucide-react";

import { ChannelBadge, ChannelIcon } from "@/components/channel-badge";
import { Button } from "@/components/ui/button";
import { channels } from "@/lib/mock";
import type { ChannelId } from "@/lib/mock";

const highlights = [
  {
    title: "Comment to conversation",
    body: "A keyword on Instagram or X becomes a DM, then a WhatsApp thread if they want to buy.",
    icon: MessageCircle,
  },
  {
    title: "One shared inbox",
    body: "Human handoff, notes, tags, and canned replies — without hopping between native apps.",
    icon: Sparkles,
  },
  {
    title: "Flows that stay readable",
    body: "Triggers, delays, conditions, and actions on a canvas your team can actually follow.",
    icon: Workflow,
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
          <p className="mb-4 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">
            Meta · X · LinkedIn · Email
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Chat marketing, without the tab chaos.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-5 sm:text-lg">
            koLink Chat is a calm workspace to automate and reply across every place your audience
            already talks — then hand off to a human when it matters.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Every channel, one account
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
                  <ChannelIcon channel={channel.id as ChannelId} size={16} />
                </span>
                <ChannelBadge channel={channel.id as ChannelId} />
              </div>
              <p className="mt-3 font-medium">{channel.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="glass rounded-xl p-5 sm:p-6">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:rounded-[28px] sm:px-12 sm:py-12">
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
            Build the inbox first. Wire the APIs later.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-primary-foreground/80">
            This mockup uses realistic data so you can click through Home, Inbox, Flows, and
            Settings like a live product.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6 bg-card text-foreground hover:bg-card/90"
            asChild
          >
            <Link href="/signup">Create a workspace</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
