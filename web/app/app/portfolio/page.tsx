"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fmt, daysTo, shortDue } from "@/lib/api";
import { supabaseReady, getPositions, getListings } from "@/lib/supabase";
import { useWallet } from "@/components/wallet/WalletContext";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const riskColor = (y: number) => (y >= 14 ? "#FF5A1F" : y >= 8 ? "#E5A823" : "#BFF205");
const money = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round((n || 0) / 1000) + "k");
const MONTHS = 6;
const BAR_PX = 250;

export default function PortfolioPage() {
  const { address } = useWallet();
  const [pos, setPos] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState<any>(null);

  useEffect(() => {
    if (!address) return;
    (async () => {
      setPos(await getPositions(address));
      setListings(await getListings(address));
      setLoaded(true);
    })();
  }, [address]);

  const deployed = pos.reduce((s, p) => s + Number(p.amount || 0), 0);
  const yieldSum = pos.reduce((s, p) => s + Number(p.expected_yield || 0), 0);
  const nextDays = pos.length ? Math.min(...pos.map((p) => (p.due_date ? daysTo(p.due_date) : 30))) : 0;
  const ret = (p: any) => Number(p.amount || 0) + Number(p.expected_yield || 0);

  const cols = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: MONTHS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { key: d.getFullYear() + "-" + d.getMonth(), label: d.toLocaleString("en-US", { month: "short" }), year: d.getFullYear(), ms: d.getTime(), items: [] as any[] };
    });
    pos.forEach((p) => {
      const dd = p.due_date ? new Date(p.due_date) : new Date(Date.now() + 30 * 86400000);
      const key = dd.getFullYear() + "-" + dd.getMonth();
      let m = months.find((x) => x.key === key);
      if (!m) m = dd.getTime() < now.getTime() ? months[0] : months[months.length - 1];
      m.items.push(p);
    });
    return months.map((m) => ({ ...m, total: m.items.reduce((s, p) => s + ret(p), 0) }));
  }, [pos]);

  const maxTotal = Math.max(1, ...cols.map((c) => c.total));

  const stats: [string, string, string][] = [
    ["Deployed", fmt(deployed), "/icons/safe.svg"],
    ["Due back", "+" + fmt(yieldSum), "/icons/money-wings.svg"],
    ["Positions", String(pos.length), "/icons/certificate.svg"],
    ["Next return", nextDays + "d", "/icons/exchange.svg"],
  ];

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-5">Your portfolio</div>
      <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,60px)] mb-2">When your cash comes home.</h1>
      <p className="text-[16px] md:text-[18px] font-medium max-w-[58ch] mb-8 text-inksoft">Your incoming returns, month by month. Each bar is the cash landing that month — stacked by holding, coloured by risk. Click a block to inspect it.</p>

      {!supabaseReady && <div className="border-2 border-ink bg-signal/15 px-4 py-2.5 mb-8 mono text-[11px] font-bold uppercase">⚠ Supabase not configured — positions won&apos;t persist.</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-ink divide-x-2 divide-ink mb-8 max-w-[820px]">
        {stats.map(([l, v, icon], i) => (
          <div key={i} className={`p-4 flex items-center gap-3 ${i === 1 ? "bg-lime" : "bg-bone"} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""}`}>
            <img src={icon} alt="" className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <div className="mono text-[10px] font-bold uppercase text-inksoft truncate">{l}</div>
              <div className="display text-[clamp(18px,2.2vw,26px)] leading-none mt-0.5">{v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ===== cashflow calendar ===== */}
        <div className="relative border-2 border-ink bg-bone shadow-hard p-6">
          <div className="flex items-center justify-between mono text-[10px] font-bold uppercase text-inksoft mb-4">
            <span>↑ cash returning</span>
            <span>next {MONTHS} months →</span>
          </div>
          {!loaded ? (
            <div className="grid place-items-center mono text-[12px] text-inksoft" style={{ height: BAR_PX + 60, animation: "blink 1s steps(1) infinite" }}>Loading your returns…</div>
          ) : pos.length === 0 ? (
            <div className="grid place-items-center text-center" style={{ height: BAR_PX + 60 }}>
              <div>
                <img src="/icons/money-wings.svg" alt="" className="w-14 h-14 mx-auto mb-3 opacity-60" />
                <div className="mono text-[12px] text-inksoft">No returns scheduled.<br /><Link href="/app/market" className="underline hover:text-lime">Fund a deal</Link> or <Link href="/app/pools" className="underline hover:text-lime">pour into a pool →</Link></div>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 sm:gap-4" style={{ height: BAR_PX + 44 }}>
              {cols.map((c) => (
                <div key={c.key} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                  <div className={`mono text-[11px] font-bold mb-1.5 ${c.total ? "" : "text-inksoft/40"}`}>{c.total ? money(c.total) : "—"}</div>
                  <div className="w-full max-w-[64px] flex flex-col justify-end" style={{ height: BAR_PX }}>
                    {c.items.length === 0 && <div className="w-full border-b-2 border-dashed border-ink/20" />}
                    {c.items
                      .slice()
                      .sort((a, b) => ret(b) - ret(a))
                      .map((p, j) => {
                        const h = (ret(p) / maxTotal) * BAR_PX;
                        const active = sel?.financing_id === p.financing_id;
                        return (
                          <button
                            key={j}
                            onClick={() => setSel(p)}
                            className="w-full border-2 border-ink relative group transition-all hover:brightness-105"
                            style={{ height: Math.max(8, h), background: riskColor(Number(p.yield_rate || 8)), marginTop: j === 0 ? 0 : -2, zIndex: active ? 20 : 1, outline: active ? "3px solid #0b0b0a" : "none" }}
                            title={`${p.invoice_number || p.financing_id} · ${money(ret(p))}`}
                          >
                            {h > 26 && <span className="absolute inset-0 grid place-items-center mono text-[9px] font-bold text-ink/80 truncate px-1">{money(ret(p))}</span>}
                          </button>
                        );
                      })}
                  </div>
                  <div className="mono text-[12px] font-bold uppercase mt-2">{c.label}</div>
                  <div className="mono text-[9px] font-bold text-inksoft">{c.items.length ? c.items.length + " in" : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== inspector ===== */}
        <aside className="border-2 border-ink bg-bone shadow-hard p-6 lg:sticky lg:top-6 min-h-[300px]">
          {!sel ? (
            <div className="text-center py-10">
              <img src="/icons/certificate.svg" alt="" className="w-14 h-14 mx-auto mb-4" />
              <div className="mono text-[12px] uppercase tracking-wide text-inksoft leading-relaxed">Click a block in a month<br />to inspect that holding</div>
              <div className="mt-6 pt-5 border-t-2 border-ink/15 mono text-[12px] font-bold uppercase">
                Total returning<br /><span className="display text-[28px] normal-case">{fmt(deployed + yieldSum)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <img src="/icons/certificate.svg" alt="" className="w-9 h-9" />
                <div className="display text-[clamp(20px,2.6vw,28px)] leading-none min-w-0 truncate">{sel.invoice_number || sel.financing_id}</div>
              </div>
              <div className="mono text-[11px] text-inksoft uppercase mb-5">lands {sel.due_date ? shortDue(sel.due_date) : "—"} · {sel.due_date ? daysTo(sel.due_date) : 30}d</div>
              <div className="grid grid-cols-2 gap-px bg-ink border-2 border-ink mb-5">
                {([["Deployed", fmt(sel.amount), false], ["Yield due", "+" + fmt(sel.expected_yield), true], ["Total back", fmt(ret(sel)), false], ["Yield", Math.round(Number(sel.yield_rate || 0)) + "%", false]] as [string, string, boolean][]).map(([l, v, a], i) => (
                  <div key={i} className={`p-3 ${a ? "bg-lime" : "bg-bone"}`}>
                    <div className="mono text-[9px] font-bold uppercase text-inksoft">{l}</div>
                    <div className="display text-[22px] leading-none mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <Link href={`/app/deal/${sel.financing_id}`} className="block text-center mono text-[11px] font-bold uppercase border-2 border-ink bg-ink text-bone py-2.5 hover:bg-lime hover:text-ink transition-colors">Open deal →</Link>
            </>
          )}
        </aside>
      </div>

      {/* ===== listings ===== */}
      <section className="border-2 border-ink bg-bone shadow-hard mt-8">
        <div className="px-5 py-3 border-b-2 border-ink mono text-[11px] font-bold uppercase flex justify-between"><span>Invoices you listed</span><span className="text-inksoft">{listings.length}</span></div>
        {listings.length === 0 ? (
          <div className="p-7 text-center mono text-[12px] text-inksoft">{loaded ? "Nothing listed yet." : "Loading…"} <Link href="/app/finance" className="underline hover:text-lime">Finance an invoice →</Link></div>
        ) : (
          <div className="divide-y-2 divide-ink/10">
            {listings.map((l, i) => (
              <Link key={i} href={`/app/deal/${l.id}`} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 hover:bg-bone2 transition-colors">
                <img src="/icons/certificate.svg" alt="" className="w-6 h-6" />
                <span className="mono font-bold truncate">{l.invoice_number}</span>
                <span className="mono text-[11px] font-bold uppercase text-inksoft">{l.status}</span>
                <span className="mono text-[13px] font-bold">{fmt(l.funding_amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
