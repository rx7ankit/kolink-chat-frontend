import type { Metadata } from "next";
import {
  Inbox,
  LineChart,
  Megaphone,
  Radio,
  Users,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = { title: "Features" };

const features = [
  {
    title: "Unified inbox",
    body: "Open, closed, assigned, labeled. Reply to Instagram, WhatsApp, and X in one thread list.",
    icon: Inbox,
  },
  {
    title: "Automations",
    body: "Keywords, sequences, rules, and a visual flow canvas with triggers, delays, and conditions.",
    icon: Workflow,
  },
  {
    title: "Broadcasts",
    body: "Send a campaign to a segment, schedule it, and watch delivery without leaving the workspace.",
    icon: Megaphone,
  },
  {
    title: "Contacts",
    body: "Tags, custom fields, segments, and a profile that spans every connected identity.",
    icon: Users,
  },
  {
    title: "Insights",
    body: "Messages by channel, net contacts, conversion events, and a revenue snapshot.",
    icon: LineChart,
  },
  {
    title: "Channels",
    body: "Connect Meta, X, Telegram, LinkedIn, and email from one settings surface.",
    icon: Radio,
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything in one calm product</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Modeled after ManyChat&apos;s working surface — Home, Inbox, Contacts, Automations,
        Broadcasts, and Settings — with X as a first-class channel.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="glass rounded-xl p-6">
            <feature.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
