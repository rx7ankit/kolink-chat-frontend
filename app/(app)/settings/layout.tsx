"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/settings/general", key: "settings.general" },
  { href: "/settings/channels", key: "settings.channels" },
  { href: "/settings/team", key: "settings.team" },
  { href: "/settings/fields", key: "settings.fields" },
  { href: "/settings/inbox", key: "settings.inbox" },
  { href: "/settings/billing", key: "settings.billing" },
  { href: "/settings/integrations", key: "settings.integrations" },
  { href: "/settings/notifications", key: "settings.notifications" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 page-shell md:flex-row md:gap-8">
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "bg-white/50 text-muted-foreground",
            )}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <aside className="glass hidden w-48 shrink-0 rounded-2xl p-3 md:block">
        <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("nav.settings")}
        </p>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                pathname === item.href
                  ? "bg-white/55 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-white/35 hover:text-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
