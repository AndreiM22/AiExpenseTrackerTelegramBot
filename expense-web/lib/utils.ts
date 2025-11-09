import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value?: number | null,
  currency: string = "MDL"
) {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDateLabel(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }
  return format(date, "dd MMM");
}

export function formatFullDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }
  return format(date, "dd MMM yyyy");
}

export function getTrendColor(trend?: "up" | "down" | "stable") {
  switch (trend) {
    case "up":
      return "text-emerald-400";
    case "down":
      return "text-rose-400";
    default:
      return "text-slate-400";
  }
}
