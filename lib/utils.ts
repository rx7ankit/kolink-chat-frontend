import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string) {
  const cleaned = name.replace(/\s*\(@[^)]+\)\s*/g, " ").replace(/\s*\([^)]*@[^)]+\)\s*/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part.replace(/^@/, "").match(/[A-Za-z0-9]/)?.[0])
    .filter(Boolean);
  if (letters.length) return letters.join("").toUpperCase();
  const fromHandle = cleaned.match(/@([A-Za-z0-9])/);
  if (fromHandle) return fromHandle[1].toUpperCase();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}
