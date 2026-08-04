import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | string | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatVolume(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

export function formatChange(n: number | string | null | undefined): { text: string; positive: boolean | null } {
  if (n === null || n === undefined || n === "") return { text: "—", positive: null };
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return { text: "—", positive: null };
  const text = (num >= 0 ? "+" : "") + num.toFixed(2);
  return { text, positive: num > 0 ? true : num < 0 ? false : null };
}

export function formatPct(n: number | string | null | undefined): { text: string; positive: boolean | null } {
  if (n === null || n === undefined || n === "") return { text: "—", positive: null };
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return { text: "—", positive: null };
  const text = (num >= 0 ? "+" : "") + num.toFixed(2) + "%";
  return { text, positive: num > 0 ? true : num < 0 ? false : null };
}

export function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 4);
  return `${d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
