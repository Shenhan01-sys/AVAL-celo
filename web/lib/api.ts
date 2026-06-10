export const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const fmt = (n: number) => "$" + Math.round(n || 0).toLocaleString("en-US");
export const fmtK = (n: number) => "$" + ((n || 0) / 1000).toFixed(1) + "K";

export const tierCls: Record<string, string> = {
  low: "bg-lime text-ink",
  medium: "bg-bone2 text-ink",
  high: "bg-signal text-bone",
  reject: "bg-signal text-bone",
};

export function daysTo(due?: string): number {
  if (!due) return 0;
  const ms = new Date(due).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function shortDue(due?: string): string {
  if (!due) return "—";
  try {
    return new Date(due).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}

export async function jget<T = any>(path: string): Promise<T | null> {
  try {
    const r = await fetch(API + path);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
