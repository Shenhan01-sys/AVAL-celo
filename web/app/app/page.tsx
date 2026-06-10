"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt, jget } from "@/lib/api";
import { getPositions, getListings } from "@/lib/supabase";
import { useWallet } from "@/components/wallet/WalletContext";

export default function DashboardPage() {
  const { address, short } = useWallet();
  const [pos, setPos] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [acts, setActs] = useState<any[]>([]);

  useEffect(() => {
    if (!address) return;
    (async () => {
      setPos(await getPositions(address));
      setListings(await getListings(address));
    })();
  }, [address]);

  useEffect(() => {
    let on = true;
    const poll = async () => {
      const a = await jget<any[]>("/agent/activity?limit=6");
      if (on && Array.isArray(a)) setActs(a);
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => { on = false; clearInterval(t); };
  }, []);

  const deployed = pos.reduce((s, p) => s + Number(p.amount || 0), 0);
  const yieldSum = pos.reduce((s, p) => s + Number(p.expected_yield || 0), 0);

  const stats: [string, string, string, boolean][] = [
    ["Deployed", fmt(deployed), "/icons/safe.svg", false],
    ["Yield due", "+" + fmt(yieldSum), "/icons/money-wings.svg", true],
    ["Open positions", String(pos.length), "/icons/certificate.svg", false],
    ["Invoices listed", String(listings.length), "/icons/banknote.svg", false],
  ];

  const actions: [string, string, string, string, string][] = [
    ["/app/finance", "Finance an invoice", "Get funded in seconds", "/icons/money-transfer.svg", "bg-lime text-ink"],
    ["/app/market", "Fund a deal", "Read the whole book", "/icons/bullish.svg", "bg-ink text-bone"],
    ["/app/pools", "Pour into a pool", "Diversified tranches", "/icons/exchange.svg", "bg-bone text-ink"],
    ["/app/portfolio", "Your portfolio", "When cash comes home", "/icons/certificate.svg", "bg-bone text-ink"],
  ];

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      <div className="mono text-[11px] font-bold uppercase tracking-wider text-inksoft mb-2">Signed in as {short || "your wallet"}</div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,58px)]">Welcome back<span className="text-lime">.</span></h1>
        <div className="border-2 border-ink bg-bone shadow-hard2 px-4 py-2.5">
          <div className="mono text-[10px] font-bold uppercase text-inksoft">Portfolio value</div>
          <div className="display text-[clamp(20px,2.6vw,30px)] leading-none">{fmt(deployed + yieldSum)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-ink divide-x-2 divide-ink mb-10">
        {stats.map(([l, v, icon, accent], i) => (
          <div key={i} className={`p-5 flex items-center gap-3 ${accent ? "bg-lime" : "bg-bone"} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""}`}>
            <img src={icon} alt="" className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <div className="mono text-[10px] font-bold uppercase text-inksoft truncate">{l}</div>
              <div className="display text-[clamp(20px,2.6vw,30px)] leading-none mt-0.5">{v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
        {/* quick actions */}
        <div className="grid sm:grid-cols-2 gap-5">
          {actions.map(([href, title, sub, icon, bg]) => (
            <Link key={href} href={href} className={`group border-2 border-ink shadow-hard p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all ${bg}`}>
              <img src={icon} alt="" className="w-11 h-11 mb-3" />
              <div className="display text-[21px] leading-none mb-1.5">{title}</div>
              <div className={`mono text-[11px] font-bold uppercase ${bg.includes("text-bone") ? "text-bone/60" : "text-ink/60"}`}>{sub} →</div>
            </Link>
          ))}
        </div>

        {/* live agent feed */}
        <div className="border-2 border-ink bg-bone shadow-hard overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 border-b-2 border-ink">
            <img src="/icons/gem.svg" alt="" className="w-5 h-5" />
            <span className="mono text-[11px] font-bold uppercase">The Verifier · live</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime" style={{ animation: "blink 1.4s steps(1) infinite" }} />
          </div>
          <div className="divide-y-2 divide-ink/15">
            {(acts.length ? acts : [{ icon: "💸", message: "Waiting for the agent backend on :8000…" }]).slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="text-[16px] leading-none">{a.icon}</span>
                <span className="text-[13px] font-medium leading-snug">{a.message}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t-2 border-ink mono text-[10px] font-bold uppercase text-inksoft">Autonomous · ERC-8004 verifier identity</div>
        </div>
      </div>
    </div>
  );
}
