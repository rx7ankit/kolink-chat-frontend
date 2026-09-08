"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountMenu } from "@/components/app/account-menu";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/provider";
import { appNavItems, isNavActive } from "@/lib/nav";
import { useSidebarCollapse } from "@/lib/sidebar/collapse";
import { cn } from "@/lib/utils";

function NavLabel({ children }: { children: ReactNode }) {
  return <span className="min-w-0 truncate text-left">{children}</span>;
}

export function AppNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className={cn(
        "flex flex-1 flex-col gap-0.5",
        collapsed && "items-center",
      )}
    >
      {appNavItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        const label = t(item.labelKey);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center overflow-hidden rounded-xl text-sm font-medium transition-colors",
              collapsed
                ? "h-9 w-9 shrink-0 justify-center p-0"
                : "w-full justify-start gap-2.5 px-2.5 py-2 text-left",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-white/40 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <NavLabel>{label}</NavLabel> : null}
          </Link>
        );

        if (!collapsed) return link;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const { t } = useI18n();
  const { collapsed } = useSidebarCollapse();

  return (
    <aside
      className={cn(
        "glass hidden h-full shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        collapsed ? "w-14" : "w-[232px]",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 border-b border-white/30 px-2 py-2",
          collapsed ? "justify-center" : "items-center",
        )}
      >
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden py-2",
          collapsed ? "items-center px-2" : "px-2",
        )}
      >
        <AppNav collapsed={collapsed} />
      </div>

      <div
        className={cn(
          "m-2 overflow-hidden rounded-xl bg-white/40 transition-[opacity,max-height,padding,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "pointer-events-none m-0 max-h-0 p-0 opacity-0"
            : "max-h-40 p-3 opacity-100",
        )}
      >
        <p className="text-xs font-medium text-primary">{t("plan.growth")}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t("plan.usage")}</p>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-white/30 px-2 py-2",
          collapsed ? "flex justify-center" : "",
        )}
      >
        <AccountMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
