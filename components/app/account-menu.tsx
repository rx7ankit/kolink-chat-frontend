"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/provider";
import { cn, initials } from "@/lib/utils";

export function AccountMenu({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = user?.full_name ?? "User";
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={collapsed ? displayName : undefined}
          className={cn(
            "flex items-center rounded-xl text-left transition hover:bg-white/40",
            collapsed
              ? "h-9 w-9 shrink-0 justify-center p-0"
              : "w-full min-w-0 gap-2.5 px-2 py-1.5",
            className,
          )}
          aria-label={`Account: ${displayName}`}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-[11px] font-semibold">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-tight">
                  {displayName}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {email}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? "start" : "end"}
        side="top"
        className="w-52"
      >
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/settings/general">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
