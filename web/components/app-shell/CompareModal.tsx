"use client";

import { useEffect, useState } from "react";
import { fmt, daysTo, shortDue } from "@/lib/api";
import Modal from "./Modal";

const tierChip: Record<string, string> = { low: "bg-lime text-ink", medium: "bg-[#E5A823] text-ink", high: "bg-signal text-bone" };
const riskNum = (t: string) => ({ low: 1, medium: 2, high: 3 } as any)[t] || 2;

// rows: [label, display, numeric (or null), betterDir]
const ROWS: [string, (d: any) => string, ((d: any) => number) | null, "high" | "low" | "neutral"][] = [
  ["Yield (APR)", (d) => Math.round(d.yield_rate) + "%", (d) => d.yield_rate, "high"],
  ["Your yield", (d) => fmt(d.expected_yield_amount), (d) => d.expected_yield_amount, "high"],
  ["Risk tier", (d) => d.risk_tier, (d) => riskNum(d.risk_tier), "low"],
  ["Cash back in", (d) => daysTo(d.due_date) + "d", (d) => daysTo(d.due_date), "low"],
  ["Matures", (d) => shortDue(d.due_date), null, "neutral"],
  ["Fund now", (d) => fmt(d.funding_amount), (d) => d.funding_amount, "neutral"],
  ["Face value", (d) => fmt(d.amount), (d) => d.amount, "neutral"],
  ["Verifier", (d) => (d.verifier_accuracy ?? 96) + "%", (d) => d.verifier_accuracy ?? 96, "high"],
  ["Debtor", (d) => d.buyer_name, null, "neutral"],
];

function winner(a: any, b: any, num: ((d: any) => number) | null, dir: string): 0 | 1 | -1 {
  if (!num || dir === "neutral") return -1;
  const va = num(a), vb = num(b);
  if (va === vb) return -1;
  if (dir === "high") return va > vb ? 0 : 1;
  return va < vb ? 0 : 1; // low
}

export default function CompareModal({ a, b, onClose }: { a: any; b: any; onClose: () => void }) {
  const [view, setView] = useState<"split" | "summary">("split");
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setView("summary");
  }, []);

  // verdict
  const yW = a.yield_rate === b.yield_rate ? -1 : a.yield_rate > b.yield_rate ? 0 : 1;
  const rW = riskNum(a.risk_tier) === riskNum(b.risk_tier) ? -1 : riskNum(a.risk_tier) < riskNum(b.risk_tier) ? 0 : 1;
  const dW = daysTo(a.due_date) === daysTo(b.due_date) ? -1 : daysTo(a.due_date) < daysTo(b.due_date) ? 0 : 1;
  const nm = (i: number) => (i === 0 ? a.invoice_number : b.invoice_number);

  const Side = ({ d, other }: { d: any; other: any }) => (
    <div className="flex-1 min-w-0 p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="display text-[clamp(20px,3vw,28px)] leading-none truncate">{d.invoice_number}</div>
        <span className={`mono text-[10px] font-bold uppercase border-2 border-ink px-2 py-0.5 ${tierChip[d.risk_tier]}`}>{d.risk_tier}</span>
      </div>
      <div className="mono text-[11px] text-inksoft uppercase mb-4">{d.buyer_name} · debtor</div>
      <div className="display text-[clamp(34px,6vw,52px)] leading-none text-ink">{Math.round(d.yield_rate)}%<span className="display text-[16px] text-inksoft"> apr</span></div>
      <div className="grid grid-cols-2 gap-px bg-ink border-2 border-ink mt-4">
        {([["Fund now", fmt(d.funding_amount)], ["Your yield", fmt(d.expected_yield_amount)], ["Cash back", daysTo(d.due_date) + "d"], ["Verifier", (d.verifier_accuracy ?? 96) + "%"]] as [string, string][]).map(([l, v], i) => (
          <div key={i} className="bg-bone p-3">
            <div className="mono text-[9px] font-bold uppercase text-inksoft">{l}</div>
            <div className="mono text-[15px] font-bold mt-0.5">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose} z={115} panelClassName="w-full max-w-[880px] max-h-[94vh] flex flex-col border-2 border-ink bg-bone shadow-hard">
      {(close) => (
        <>
          {/* toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b-2 border-ink bg-bone2 shrink-0">
            <div className="mono text-[12px] font-bold uppercase">⇄ Compare</div>
            <div className="flex items-center gap-1.5">
              <div className="flex border-2 border-ink">
                {(["split", "summary"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`mono text-[10px] font-bold uppercase px-3 py-1.5 ${view === v ? "bg-ink text-bone" : "bg-bone hover:bg-lime"}`}>{v}</button>
                ))}
              </div>
              <button onClick={close} className="w-7 h-7 border-2 border-ink bg-ink text-bone hover:bg-signal mono font-bold leading-none">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {view === "split" ? (
              <div className="flex flex-col sm:flex-row divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-ink">
                <Side d={a} other={b} />
                <Side d={b} other={a} />
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-[1.1fr_1fr_1fr] border-2 border-ink">
                  <div className="bg-ink text-bone mono text-[10px] font-bold uppercase px-3 py-2.5">Metric</div>
                  <div className="bg-ink text-bone mono text-[10px] font-bold uppercase px-3 py-2.5 truncate border-l-2 border-bone/20">{a.invoice_number}</div>
                  <div className="bg-ink text-bone mono text-[10px] font-bold uppercase px-3 py-2.5 truncate border-l-2 border-bone/20">{b.invoice_number}</div>
                  {ROWS.map(([label, disp, num, dir], i) => {
                    const w = winner(a, b, num, dir);
                    return (
                      <div key={i} className="contents">
                        <div className="px-3 py-2.5 border-t-2 border-ink mono text-[11px] font-bold uppercase text-inksoft">{label}</div>
                        <div className={`px-3 py-2.5 border-t-2 border-l-2 border-ink mono text-[13px] font-bold ${w === 0 ? "bg-lime" : "bg-bone"}`}>{disp(a)}{w === 0 && " ✦"}</div>
                        <div className={`px-3 py-2.5 border-t-2 border-l-2 border-ink mono text-[13px] font-bold ${w === 1 ? "bg-lime" : "bg-bone"}`}>{disp(b)}{w === 1 && " ✦"}</div>
                      </div>
                    );
                  })}
                </div>
                {/* verdict */}
                <div className="mt-4 border-2 border-ink bg-bone2 p-4 text-[13px] leading-relaxed">
                  <span className="mono text-[10px] font-bold uppercase text-inksoft block mb-1">In short</span>
                  {yW >= 0 && <><b>{nm(yW)}</b> pays more ({Math.round((yW === 0 ? a : b).yield_rate)}% vs {Math.round((yW === 0 ? b : a).yield_rate)}%). </>}
                  {rW >= 0 && <><b>{nm(rW)}</b> is lower risk. </>}
                  {dW >= 0 && <><b>{nm(dW)}</b> returns cash sooner.</>}
                  {yW < 0 && rW < 0 && dW < 0 && "These two are near-identical on yield, risk, and timing."}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
