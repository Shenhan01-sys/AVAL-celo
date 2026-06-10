"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API, fmt, daysTo, shortDue } from "@/lib/api";
import { buildPools, Pool } from "@/lib/pools";
import { useWallet } from "@/components/wallet/WalletContext";
import { recordPosition } from "@/lib/supabase";
import { useLiveChannel } from "@/lib/realtime";
import PaymentOverlay from "@/components/app-shell/PaymentOverlay";

const tierChip: Record<string, string> = { low: "bg-lime text-ink", medium: "bg-[#E5A823] text-ink", high: "bg-signal text-bone" };
const money = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round((n || 0) / 1000) + "k");

export default function PoolDetailPage({ params }: { params: { id: string } }) {
  const { address, short } = useWallet();
  const [deals, setDeals] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [util, setUtil] = useState<number | null>(null);
  const [pay, setPay] = useState<any>(null);
  const { events, broadcast } = useLiveChannel("aval:pools", short || "investor");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API + "/marketplace");
        const d = await r.json();
        if (Array.isArray(d)) setDeals(d);
      } catch {
        /* backend off */
      }
      setLoaded(true);
    })();
  }, []);

  const pool = useMemo(() => buildPools(deals).find((p) => p.id === params.id) || null, [deals, params.id]);
  const members = useMemo(() => (pool ? deals.filter((d) => pool.ids.includes(d.id)).sort((a, b) => daysTo(a.due_date) - daysTo(b.due_date)) : []), [pool, deals]);
  const watching = 1 + events.filter((e: any) => e?.poolId === params.id).length * 2;
  const u = pool ? (util ?? pool.utilization) : 0;

  function invest(tranche: "senior" | "junior") {
    if (!pool) return;
    const yieldRate = tranche === "senior" ? pool.seniorYield : pool.juniorYield;
    const amount = Math.max(10000, Math.round((pool.capacity * 0.05) / 1000) * 1000);
    setPay({
      tranche,
      deal: { id: `${pool.id}_${tranche}`, invoice_number: `${pool.name} · ${tranche}`, funding_amount: amount, expected_yield_amount: Math.round((amount * yieldRate) / 100), yield_rate: yieldRate, due_date: new Date(Date.now() + pool.weightedDays * 86400000).toISOString().slice(0, 10) },
    });
  }
  function confirmInvest() {
    if (!pay || !pool) return;
    setUtil(Math.min(1, u + 0.06));
    recordPosition(address || "anon", pay.deal);
    broadcast({ poolId: pool.id, poolName: pool.name, tranche: pay.tranche, amount: pay.deal.funding_amount, by: short || "an investor" });
  }

  if (loaded && !pool)
    return (
      <div className="px-6 md:px-10 py-12 mono text-inksoft">
        Pool not found. <Link href="/app/pools" className="underline hover:text-lime">Back to pools</Link>.
      </div>
    );
  if (!pool)
    return <div className="px-6 md:px-10 py-12 mono text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>Distilling pool…</div>;

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      {pay && <PaymentOverlay deal={pay.deal} onFunded={confirmInvest} onClose={() => setPay(null)} />}

      <Link href="/app/pools" className="mono text-[12px] font-bold uppercase tracking-wide text-inksoft hover:text-lime">← pools</Link>
      <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-1">
        <div className="flex items-end gap-4 flex-wrap">
          <h1 className="display uppercase text-[clamp(30px,5vw,58px)] leading-none">{pool.name}</h1>
          <span className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1 ${tierChip[pool.risk]}`}>{pool.risk}</span>
        </div>
        <div className="flex items-center gap-2 border-2 border-ink bg-bone px-3 py-2 shadow-hard2">
          <span className="w-2 h-2 rounded-full bg-lime border border-ink" style={{ animation: "blink 1.3s steps(1) infinite" }} />
          <span className="mono text-[12px] font-bold uppercase">{watching} watching</span>
        </div>
      </div>
      <p className="text-[15px] text-inksoft mb-8 uppercase mono">{pool.theme}</p>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border-2 border-ink divide-x-2 divide-ink mb-8">
        {([["Capacity", money(pool.capacity)], ["Invoices", String(pool.count)], ["Blended", pool.weightedYield + "%"], ["~Maturity", pool.weightedDays + "d"], ["Filled", Math.round(u * 100) + "%"]] as [string, string][]).map(([l, v], i) => (
          <div key={i} className={`p-4 ${i === 2 ? "bg-lime" : "bg-bone"} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""}`}>
            <div className="mono text-[10px] font-bold uppercase text-inksoft">{l}</div>
            <div className="display text-[clamp(20px,2.6vw,30px)] leading-none mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
        {/* capital structure + invest */}
        <div className="flex flex-col gap-6">
          <div className="border-2 border-ink bg-bone shadow-hard p-6">
            <div className="mono text-[11px] font-bold uppercase text-inksoft mb-4">Capital structure</div>
            {/* tranche stack bar */}
            <div className="relative h-[64px] border-2 border-ink flex overflow-hidden">
              <div className="bg-lime grid place-items-center relative" style={{ width: pool.seniorPct + "%" }}>
                <span className="mono text-[11px] font-bold uppercase text-ink">Senior {pool.seniorPct}%</span>
              </div>
              <div className="grid place-items-center relative border-l-2 border-ink" style={{ width: pool.juniorPct + "%", background: pool.risk === "high" ? "#FF5A1F" : "#E5A823" }}>
                <span className="mono text-[11px] font-bold uppercase text-ink">Junior {pool.juniorPct}%</span>
              </div>
              {/* unfilled mask */}
              <div className="absolute top-0 bottom-0 right-0 bg-bone/65 border-l-2 border-dashed border-ink" style={{ width: (1 - u) * 100 + "%", transition: "width .7s cubic-bezier(.2,1,.3,1)" }}>
                <span className="absolute top-1 left-2 mono text-[9px] font-bold uppercase text-inksoft">{Math.round((1 - u) * 100)}% open</span>
              </div>
            </div>
            <div className="flex justify-between mono text-[10px] font-bold uppercase text-inksoft mt-1.5">
              <span>← repaid first · lower risk</span>
              <span>first-loss · higher yield →</span>
            </div>

            {/* invest */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="border-2 border-ink p-4">
                <div className="mono text-[10px] font-bold uppercase text-inksoft">Senior yield</div>
                <div className="display text-[30px] leading-none mt-1">{pool.seniorYield}%</div>
                <button onClick={() => invest("senior")} className="w-full mt-3 mono text-[11px] font-bold uppercase border-2 border-ink bg-lime px-3 py-2.5 shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Pour senior →</button>
              </div>
              <div className="border-2 border-ink p-4">
                <div className="mono text-[10px] font-bold uppercase text-inksoft">Junior yield</div>
                <div className="display text-[30px] leading-none mt-1 text-signal">{pool.juniorYield}%</div>
                <button onClick={() => invest("junior")} className="w-full mt-3 mono text-[11px] font-bold uppercase border-2 border-ink bg-signal text-bone px-3 py-2.5 shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Pour junior →</button>
              </div>
            </div>
          </div>

          {/* live activity for this pool */}
          <div className="border-2 border-ink bg-bone shadow-hard p-5">
            <div className="mono text-[11px] font-bold uppercase text-inksoft mb-3">Live in this pool</div>
            {events.filter((e: any) => e.poolId === pool.id).length ? (
              events.filter((e: any) => e.poolId === pool.id).slice(0, 4).map((e: any, i: number) => (
                <div key={i} className="mono text-[12px] py-1.5 border-b border-ink/10 last:border-0">💧 {e.by} poured <b>{e.tranche}</b> · {money(e.amount)}</div>
              ))
            ) : (
              <div className="mono text-[12px] text-inksoft">No pours yet — be the first.</div>
            )}
          </div>
        </div>

        {/* invoices inside */}
        <section className="border-2 border-ink bg-bone shadow-hard">
          <div className="px-5 py-3 border-b-2 border-ink mono text-[11px] font-bold uppercase flex justify-between"><span>Invoices inside</span><span className="text-inksoft">{members.length}</span></div>
          <div className="divide-y-2 divide-ink/10 max-h-[460px] overflow-y-auto">
            {members.map((d) => (
              <Link key={d.id} href={`/app/deal/${d.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 hover:bg-bone2 transition-colors">
                <div className="min-w-0">
                  <div className="mono font-bold text-[13px] truncate">{d.invoice_number}</div>
                  <div className="mono text-[10px] text-inksoft uppercase truncate">{d.buyer_name} · {daysTo(d.due_date)}d</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="display text-[18px] leading-none">{Math.round(d.yield_rate)}%</div>
                  <div className="mono text-[10px] font-bold text-inksoft">{money(d.funding_amount)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
