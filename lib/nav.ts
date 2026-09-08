import {
  Home,
  Inbox,
  LayoutGrid,
  LineChart,
  Megaphone,
  Radio,
  Settings,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";

export const appNavItems = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/inbox", labelKey: "nav.inbox", icon: Inbox },
  { href: "/contacts", labelKey: "nav.contacts", icon: Users },
  { href: "/team", labelKey: "nav.team", icon: UsersRound },
  { href: "/automations", labelKey: "nav.automations", icon: Workflow },
  { href: "/broadcasts", labelKey: "nav.broadcasts", icon: Megaphone },
  { href: "/templates", labelKey: "nav.templates", icon: LayoutGrid },
  { href: "/channels", labelKey: "nav.channels", icon: Radio },
  { href: "/insights", labelKey: "nav.insights", icon: LineChart },
  { href: "/settings/general", labelKey: "nav.settings", icon: Settings },
] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/settings/general") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}
