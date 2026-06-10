// Curate live invoices into diversified, tranched pools (Centrifuge/Goldfinch model).
// Pools partition the book by risk tier × maturity bucket, so the set grows with the book.
import { daysTo } from "./api";

export type Pool = {
  id: string;
  name: string;
  theme: string;
  accent: string;
  ids: string[];
  count: number;
  capacity: number;
  weightedYield: number;
  seniorYield: number;
  juniorYield: number;
  seniorPct: number;
  juniorPct: number;
  weightedDays: number;
  risk: "low" | "medium" | "high";
  utilization: number;
};

const BUCKETS = [
  { k: "a", label: "≤30d", lo: 0, hi: 30 },
  { k: "b", label: "30–60d", lo: 31, hi: 60 },
  { k: "c", label: "60–90d", lo: 61, hi: 90 },
  { k: "d", label: "90d+", lo: 91, hi: 99999 },
];
const THEME: Record<string, { name: string; accent: string }> = {
  low: { name: "Prime", accent: "#BFF205" },
  medium: { name: "Growth", accent: "#E5A823" },
  high: { name: "Frontier", accent: "#FF5A1F" },
};
const RISKS = ["low", "medium", "high"] as const;
const SENIOR_PCT = 70;
const JUNIOR_PCT = 30;

export function buildPools(deals: any[]): Pool[] {
  const out: Pool[] = [];
  let idx = 0;
  for (const risk of RISKS) {
    for (const b of BUCKETS) {
      const members = deals.filter((d) => d.risk_tier === risk && daysTo(d.due_date) >= b.lo && daysTo(d.due_date) <= b.hi);
      if (members.length < 1) continue;
      const capacity = members.reduce((s, d) => s + (d.funding_amount || 0), 0) || 1;
      const wYield = members.reduce((s, d) => s + d.yield_rate * (d.funding_amount || 0), 0) / capacity;
      const wDays = Math.round(members.reduce((s, d) => s + daysTo(d.due_date) * (d.funding_amount || 0), 0) / capacity);
      const seniorYield = Math.max(4, +(wYield * 0.6).toFixed(1));
      const juniorYield = +((wYield - (SENIOR_PCT / 100) * seniorYield) / (JUNIOR_PCT / 100)).toFixed(1);
      out.push({
        id: `${risk}_${b.k}`,
        name: `${THEME[risk].name} · ${b.label}`,
        theme: `${risk}-risk · matures ${b.label}`,
        accent: THEME[risk].accent,
        ids: members.map((d) => d.id),
        count: members.length,
        capacity,
        weightedYield: +wYield.toFixed(1),
        seniorYield,
        juniorYield,
        seniorPct: SENIOR_PCT,
        juniorPct: JUNIOR_PCT,
        weightedDays: wDays,
        risk,
        utilization: 0.2 + ((idx++ * 29) % 62) / 100, // 0.20..0.82 seeded
      });
    }
  }
  return out;
}
