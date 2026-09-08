"use client";

import { useState } from "react";
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { toast } from "sonner";

import { AccountMenu } from "@/components/app/account-menu";
import { AppNav } from "@/components/app/sidebar";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/provider";
import { useSidebarCollapse } from "@/lib/sidebar/collapse";

export function AppTopbar() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <header className="glass flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/40 pl-1.5 pr-3 sm:pl-2 sm:pr-4">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 shrink-0 lg:inline-flex"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            className="h-8 border-transparent bg-muted pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toast("You're caught up — no new alerts.")}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="border-b border-white/30 px-3 py-3">
            <WorkspaceSwitcher />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <AppNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-white/30 px-3 py-3">
            <AccountMenu />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
