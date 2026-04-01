import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function parseApiError(
  err: unknown,
  fallback = "Something went wrong.",
): string {
  try {
    const e = err as Record<string, unknown>;
    return (Object.values(e).flat().join(" ") as string).trim() || fallback;
  } catch {
    return fallback;
  }
}
