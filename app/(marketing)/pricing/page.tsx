import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

const plans = [
  {
    name: "Starter",
    price: "$0",
    detail: "1,000 active contacts",
    cta: "Start mockup",
    featured: false,
    perks: ["2 channels", "Basic inbox", "Quick automations", "koLink watermark"],
  },
  {
    name: "Growth",
    price: "$149",
    detail: "25,000 active contacts",
    cta: "Use Growth workspace",
    featured: true,
    perks: [
      "Unlimited channels incl. X",
      "Shared team inbox",
      "Broadcasts + AI replies",
      "5 seats",
    ],
  },
  {
    name: "Scale",
    price: "$399",
    detail: "Custom active contacts",
    cta: "Talk to sales",
    featured: false,
    perks: ["SSO + roles", "Priority routing", "Pixel + revenue", "Dedicated success"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple plans, contact-based</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Pricing is illustrative for the mockup. Growth is pre-selected in the product chrome.
      </p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
              className={`glass rounded-xl p-6 ${
              plan.featured ? "border-primary ring-4 ring-primary/15" : ""
            }`}
          >
            <p className="text-sm font-medium text-primary">{plan.name}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {plan.price}
              <span className="text-sm font-normal text-muted-foreground"> / mo</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{plan.detail}</p>
            <ul className="mt-6 space-y-2">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  {perk}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={plan.featured ? "default" : "outline"} asChild>
              <Link href="/signup">{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
