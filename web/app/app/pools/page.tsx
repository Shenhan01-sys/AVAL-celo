"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API, fmt } from "@/lib/api";
import { buildPools, Pool } from "@/lib/pools";
import { useWallet } from "@/components/wallet/WalletContext";
import { recordPosition } from "@/lib/supabase";
import { useLiveChannel } from "@/lib/realtime";
import PaymentOverlay from "@/components/app-shell/PaymentOverlay";

const tierChip: Record<string, string> = { low: "bg-lime text-ink", medium: "bg-[#E5A823] text-ink", high: "bg-signal text-bone" };
const money = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round((n || 0) / 1000) + "k");
const juniorColor = (risk: string) => (risk === "high" ? "#FF5A1F" : "#E5A823");
const TANK_H = 320;

export default function PoolsPage() {
  const { address, short } = useWallet();
  const [deals, setDeals] = useState<any[]>([]);
  const [util, setUtil] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<Pool | null>(null);
  const [pay, setPay] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"yield" | "size" | "filled" | "soon">("yield");
  const [riskF, setRiskF] = useState<"all" | "low" | "medium" | "high">("all");
  const { online, events, broadcast } = useLiveChannel("aval:pools", short || "investor");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API + "/marketplace");
        const d = await r.json();
        if (Array.isArray(d)) setDeals(d);
      } catch {
        /* backend off */
      }
    })();
  }, []);

  const pools = useMemo(() => buildPools(deals), [deals]);
  const maxCap = useMemo(() => Math.max(...pools.map((p) => p.capacity), 1), [pools]);

  const heat = useMemo(() => {
    const h: Record<string, number> = {};
    pools.forEach((p, i) => (h[p.id] = 1 + ((i * 13) % 3)));
    events.forEach((e: any) => { if (e?.poolId) h[e.poolId] = (h[e.poolId] || 0) + 2; });
    return h;
  }, [pools, events]);

  const view = useMemo(() => {
    const v = pools.filter((p) => riskF === "all" || p.risk === riskF);
    return [...v].sort((a, b) => {
      if (sortBy === "yield") return b.weightedYield - a.weightedYield;
      if (sortBy === "size") return b.capacity - a.capacity;
      if (sortBy === "filled") return (util[b.id] ?? b.utilization) - (util[a.id] ?? a.utilization);
      return a.weightedDays - b.weightedDays;
    });
  }, [pools, riskF, sortBy, util]);
  const baseW = view.length > 14 ? 46 : view.length > 9 ? 56 : view.length > 6 ? 70 : 96;
  const wOf = (c: number) => Math.round(baseW * (0.7 + 0.6 * (c / maxCap)));

  function invest(pool: Pool, tranche: "senior" | "junior") {
    const yieldRate = tranche === "senior" ? pool.seniorYield : pool.juniorYield;
    const amount = Math.max(10000, Math.round((pool.capacity * 0.05) / 1000) * 1000);
    setPay({ pool, tranche, deal: { id: `${pool.id}_${tranche}`, invoice_number: `${pool.name} · ${tranche}`, funding_amount: amount, expected_yield_amount: Math.round((amount * yieldRate) / 100), yield_rate: yieldRate, due_date: new Date(Date.now() + pool.weightedDays * 86400000).toISOString().slice(0, 10) } });
  }
  function confirmInvest() {
    if (!pay) return;
    const { pool, tranche, deal } = pay;
    setUtil((u) => ({ ...u, [pool.id]: Math.min(1, (u[pool.id] ?? pool.utilization) + 0.06) }));
    recordPosition(address || "anon", deal);
    broadcast({ poolId: pool.id, poolName: pool.name, tranche, amount: deal.funding_amount, by: short || "an investor" });
  }

  const lastFor = (id: string) => events.find((e: any) => e.poolId === id);

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      {pay && <PaymentOverlay deal={pay.deal} onFunded={confirmInvest} onClose={() => setPay(null)} />}

      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-4">Pools · the refinery</div>
          <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,60px)]">Pour capital into a book.</h1>
        </div>
        <div className="flex items-center gap-2 border-2 border-ink bg-bone px-3 py-2 shadow-hard2">
          <span className="w-2.5 h-2.5 rounded-full bg-lime border border-ink" style={{ animation: "blink 1.3s steps(1) infinite" }} />
          <span className="mono text-[12px] font-bold uppercase">{online} live</span>
        </div>
      </div>
      <p className="text-[16px] md:text-[18px] font-medium max-w-[60ch] mb-6 text-inksoft">
        Each tank is a diversified pool — <b className="text-ink">width = size</b>, <b className="text-ink">liquid = how funded</b>, split into <span className="font-bold" style={{ color: "#7a9c00" }}>senior</span> (bottom, protected) and <span className="font-bold text-signal">junior</span> (top, first-loss). Compare them at a glance, then pour in.
      </p>

      {/* live ticker */}
      <div className="border-2 border-ink bg-ink text-bone px-4 py-2.5 mb-7 flex items-center gap-3 overflow-hidden">
        <span className="mono text-[10px] font-bold uppercase text-lime shrink-0">● live</span>
        <div className="mono text-[12px] truncate">
          {events.length ? (
            <span>{events[0].by} poured into <b className="text-lime">{events[0].poolName}</b> {events[0].tranche} · {money(events[0].amount)}</span>
          ) : (
            <span className="text-bone/50">Quiet for now — pour into a tranche to broadcast live to every investor here.</span>
          )}
        </div>
      </div>

      {/* sort + filter (handles many pools) */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <span className="mono text-[10px] font-bold uppercase text-inksoft mr-1">Sort</span>
        {([["yield", "Yield"], ["size", "Size"], ["filled", "Filled"], ["soon", "Soonest"]] as [typeof sortBy, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setSortBy(k)} className={`mono text-[11px] font-bold uppercase border-2 border-ink px-3 py-1.5 transition-all ${sortBy === k ? "bg-ink text-bone shadow-hard2" : "bg-bone hover:bg-bone2"}`}>{l}</button>
        ))}
        <span className="mono text-[10px] font-bold uppercase text-inksoft mx-1">Risk</span>
        {(["all", "low", "medium", "high"] as const).map((t) => (
          <button key={t} onClick={() => setRiskF(t)} className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1.5 transition-all flex items-center gap-1.5 ${riskF === t ? "bg-ink text-bone shadow-hard2" : "bg-bone hover:bg-bone2"}`}>
            {t !== "all" && <i className="w-2.5 h-2.5 rounded-full border-2 border-current" style={{ background: t === "low" ? "#BFF205" : t === "medium" ? "#E5A823" : "#FF5A1F" }} />}{t}
          </button>
        ))}
        <span className="mono text-[11px] font-bold uppercase text-inksoft ml-auto">{view.length} pools</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6 items-start">
        {/* ===== THE REFINERY ===== */}
        <div className="relative border-2 border-ink bg-bone shadow-hard overflow-hidden" style={{ height: TANK_H + 120 }}>
          {/* fill reference lines */}
          {[25, 50, 75].map((pct) => (
            <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-ink/15 flex justify-start pointer-events-none" style={{ bottom: 56 + (TANK_H * pct) / 100 }}>
              <span className="mono text-[9px] font-bold text-inksoft bg-bone px-1 -translate-y-1/2">{pct}%</span>
            </div>
          ))}

          {view.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center mono text-[12px] text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>{pools.length === 0 ? "Distilling pools from live invoices…" : "No pools match your filter."}</div>
          ) : (
            <div className={`absolute inset-x-0 bottom-0 flex items-end gap-2 px-6 ${view.length > 8 ? "justify-start overflow-x-auto" : "justify-around"}`} style={{ paddingBottom: 36 }}>
              {view.map((p) => {
                const u = util[p.id] ?? p.utilization;
                const hot = (heat[p.id] || 0) >= 4;
                const active = sel?.id === p.id;
                return (
                  <button key={p.id} onClick={() => setSel(p)} className="group relative flex flex-col items-center focus:outline-none shrink-0" style={{ width: wOf(p.capacity) }}>
                    <div className="text-center mb-2">
                      <div className="display text-[clamp(16px,2vw,22px)] leading-none">{p.weightedYield}%</div>
                      <div className="mono text-[10px] font-bold uppercase leading-tight mt-0.5">{p.name.split(" ")[0]}</div>
                    </div>
                    <div
                      className="relative border-2 border-ink bg-bone2 overflow-hidden w-full transition-all group-hover:-translate-y-1"
                      style={{ height: TANK_H, boxShadow: active ? "5px 5px 0 #0b0b0a" : undefined, outline: active ? "3px solid #0b0b0a" : undefined }}
                    >
                      {/* liquid */}
                      <div className="absolute left-0 right-0 bottom-0 flex flex-col" style={{ height: u * 100 + "%", transition: "height .8s cubic-bezier(.2,1,.3,1)" }}>
                        <div className="relative w-full" style={{ flexBasis: p.juniorPct + "%", background: juniorColor(p.risk) }}>
                          <div className="absolute -top-1 left-0 right-0 h-2 bg-bone/50" style={{ animation: "slosh 3.6s ease-in-out infinite" }} />
                          <span className="absolute top-1.5 left-1.5 mono text-[8px] font-bold uppercase text-ink/75">jr {p.juniorYield}%</span>
                        </div>
                        <div className="relative w-full bg-lime" style={{ flexBasis: p.seniorPct + "%" }}>
                          <span className="absolute bottom-1.5 left-1.5 mono text-[8px] font-bold uppercase text-ink/75">sr {p.seniorYield}%</span>
                        </div>
                      </div>
                      {/* bubbles when hot */}
                      {hot && [18, 50, 78].map((x, i) => (
                        <span key={i} className="absolute bottom-2 w-2 h-2 rounded-full bg-bone/70 border border-ink" style={{ left: x + "%", animation: `bubble ${2 + i * 0.4}s ease-in ${i * 0.5}s infinite` }} />
                      ))}
                      {hot && <span className="absolute top-1.5 right-1.5 text-[12px]">🔥</span>}
                    </div>
                    <div className="mono text-[11px] font-bold mt-1.5">{Math.round(u * 100)}%</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="absolute bottom-2 right-4 mono text-[9px] font-bold uppercase tracking-wider text-inksoft pointer-events-none">tank width = pool size</div>
        </div>

        {/* ===== inspector ===== */}
        <aside className="border-2 border-ink bg-bone shadow-hard p-6 lg:sticky lg:top-6 min-h-[320px]">
          {!sel ? (
            <div className="text-center py-10">
              <div className="text-[34px] mb-3">⌖</div>
              <div className="mono text-[12px] uppercase tracking-wide text-inksoft leading-relaxed">Click a tank to inspect<br />the pool & pour in</div>
              <div className="mt-6 pt-5 border-t-2 border-ink/15 text-left">
                <div className="mono text-[10px] font-bold uppercase text-inksoft mb-2">Recent activity</div>
                {events.length ? events.slice(0, 4).map((e: any, i: number) => (
                  <div key={i} className="mono text-[11px] py-1 border-b border-ink/10 truncate">💧 {e.by} · {e.poolName} {e.tranche}</div>
                )) : <div className="mono text-[11px] text-inksoft">No pours yet.</div>}
              </div>
            </div>
          ) : (
            (() => {
              const p = sel;
              const u = util[p.id] ?? p.utilization;
              const last = lastFor(p.id);
              return (
                <>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="display text-[clamp(22px,2.6vw,30px)] leading-none">{p.name}</div>
                    <span className={`mono text-[10px] font-bold uppercase border-2 border-ink px-2 py-0.5 ${tierChip[p.risk]}`}>{p.risk}</span>
                  </div>
                  <div className="mono text-[11px] text-inksoft uppercase mb-5">{p.theme}</div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                    {([["Capacity", money(p.capacity)], ["Invoices", String(p.count)], ["Blended", p.weightedYield + "%"], ["~Maturity", p.weightedDays + "d"], ["Filled", Math.round(u * 100) + "%"], ["Watching", String(Math.max(1, heat[p.id] || 1))]] as [string, string][]).map(([l, v], i) => (
                      <div key={i}>
                        <div className="mono text-[9px] font-bold uppercase text-inksoft">{l}</div>
                        <div className="mono text-[15px] font-bold leading-tight">{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="border-2 border-ink divide-y-2 divide-ink mb-3">
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-bone">
                      <div className="min-w-0"><div className="mono text-[11px] font-bold uppercase">Senior · {p.seniorPct}%</div><div className="mono text-[9px] text-inksoft uppercase">protected · paid first</div></div>
                      <span className="display text-[20px] leading-none">{p.seniorYield}%</span>
                      <button onClick={() => invest(p, "senior")} className="mono text-[10px] font-bold uppercase border-2 border-ink bg-lime px-3 py-1.5 shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0">Pour</button>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-bone">
                      <div className="min-w-0"><div className="mono text-[11px] font-bold uppercase">Junior · {p.juniorPct}%</div><div className="mono text-[9px] text-inksoft uppercase">first-loss · max yield</div></div>
                      <span className="display text-[20px] leading-none text-signal">{p.juniorYield}%</span>
                      <button onClick={() => invest(p, "junior")} className="mono text-[10px] font-bold uppercase border-2 border-ink bg-signal text-bone px-3 py-1.5 shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0">Pour</button>
                    </div>
                  </div>
                  <div className="mono text-[10px] text-inksoft uppercase">{last ? `💧 ${last.by} just poured ${last.tranche}` : `${p.count} invoices · senior repaid before junior`}</div>
                  <Link href={`/app/pools/${p.id}`} className="block text-center mt-3 mono text-[11px] font-bold uppercase text-inksoft hover:text-lime underline underline-offset-2">Open pool · see invoices →</Link>
                </>
              );
            })()
          )}
        </aside>
      </div>
    </div>
  );
}
