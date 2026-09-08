export type TeamRole = "Owner" | "Admin" | "Editor" | "Inbox Agent" | "Viewer";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  inboxSeat: boolean;
  lastActive: string;
};

export const team: TeamMember[] = [
  {
    id: "u1",
    name: "Ankit Tiwari",
    email: "ankit@getkolink.com",
    role: "Owner",
    inboxSeat: true,
    lastActive: "Just now",
  },
  {
    id: "u2",
    name: "Aisha Rahman",
    email: "aisha@getkolink.com",
    role: "Admin",
    inboxSeat: true,
    lastActive: "12m ago",
  },
  {
    id: "u3",
    name: "Leo Park",
    email: "leo@getkolink.com",
    role: "Editor",
    inboxSeat: false,
    lastActive: "Yesterday",
  },
  {
    id: "u4",
    name: "Mira Cole",
    email: "mira@getkolink.com",
    role: "Inbox Agent",
    inboxSeat: true,
    lastActive: "3h ago",
  },
];

export const currentUser = team[0];

export const workspace = {
  name: "KoLink",
  timezone: "America/Los_Angeles",
  language: "English",
  plan: "Growth",
  activeContactsUsed: 12840,
  activeContactsLimit: 25000,
};

export const invoices = [
  { id: "INV-2041", date: "Aug 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2033", date: "Jul 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2024", date: "Jun 1, 2026", amount: "$99.00", status: "Paid" },
];

export const userFields = [
  { id: "f1", name: "plan", type: "Text" },
  { id: "f2", name: "source", type: "Text" },
  { id: "f3", name: "company", type: "Text" },
  { id: "f4", name: "order_count", type: "Number" },
];

export const botFields = [
  { id: "bf1", name: "store_url", value: "https://getkolink.com" },
  { id: "bf2", name: "support_hours", value: "Tue–Sat 10–6 PT" },
];

export const integrations = [
  { id: "i1", name: "Shopify", detail: "Orders, checkout, products", connected: true },
  { id: "i2", name: "Stripe", detail: "Payment links in chat", connected: true },
  { id: "i3", name: "Google Sheets", detail: "Sync new leads", connected: false },
  { id: "i4", name: "Zapier", detail: "Catch-all automations", connected: false },
];
