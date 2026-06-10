"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API, fmt, daysTo, shortDue } from "@/lib/api";
import { useWallet } from "@/components/wallet/WalletContext";

const statusChip: Record<string, string> = { confirmed: "bg-lime text-ink", pending: "bg-bone2 text-ink" };
const statusLabel: Record<string, string> = { confirmed: "✓ confirmed", pending: "pending NoA" };

function Row({ d }: { d: any }) {
  const st = d.buyer_status || "pending";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 sm:gap-4 px-5 py-4">
      <img src="/icons/banknote.svg" alt="" className="w-8 h-8" />
      <div className="min-w-0">
        <div className="mono font-bold flex items-center gap-2">{d.invoice_number}<span className={`mono text-[9px] font-bold uppercase border-2 border-ink px-1.5 py-0.5 ${statusChip[st]}`}>{statusLabel[st]}</span></div>
        <div className="mono text-[11px] text-inksoft uppercase truncate">you owe · debtor {d.buyer_name}</div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="display text-[clamp(18px,2.2vw,24px)] leading-none">{fmt(d.amount)}</div>
        <div className="mono text-[10px] font-bold text-inksoft">due {shortDue(d.due_date)} · {daysTo(d.due_date)}d</div>
      </div>
      <div className="sm:hidden display text-[18px]">{fmt(d.amount)}</div>
      <Link href={`/app/pay/${d.id}`} className="mono text-[11px] font-bold uppercase border-2 border-ink bg-lime px-4 py-2.5 shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all whitespace-nowrap">{st === "pending" ? "Confirm & pay →" : "Pay →"}</Link>
    </div>
  );
}

export default function PayLandingPage() {
  const { address } = useWallet();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API + "/marketplace");
        const d = await r.json();
        if (Array.isArray(d)) setDeals(d.filter((x: any) => x.status === "funded"));
      } catch {
        /* backend off */
      }
      setLoading(false);
    })();
  }, []);

  const { linked, others } = useMemo(() => {
    const sorted = [...deals].sort((a, b) => daysTo(a.due_date) - daysTo(b.due_date));
    const linked = sorted.filter((d) => d.buyer_wallet && address && d.buyer_wallet === address);
    const others = sorted.filter((d) => !(d.buyer_wallet && address && d.buyer_wallet === address));
    return { linked, others };
  }, [deals, address]);

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-5">For debtors · buyers</div>
      <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,60px)] mb-2">Pay an invoice you owe.</h1>
      <p className="text-[16px] md:text-[18px] font-medium max-w-[60ch] mb-8 text-inksoft">These receivables were financed — sold to an investor. Pay the face value here; it settles to the investor automatically, on-chain. Invoices addressed to your wallet appear below — <b className="text-ink">no searching</b>.</p>

      {loading ? (
        <div className="mono text-[13px] text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>Loading invoices due…</div>
      ) : (
        <>
          {/* linked to you (auto) */}
          <div className="mono text-[11px] font-bold uppercase text-inksoft mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-lime border border-ink" />Linked to your wallet</div>
          {linked.length === 0 ? (
            <div className="border-2 border-ink bg-bone shadow-hard p-6 mb-8 mono text-[12px] text-inksoft">No invoices addressed to your wallet. A supplier links one to you by entering your wallet when they finance it.</div>
          ) : (
            <div className="border-2 border-ink bg-bone shadow-hard divide-y-2 divide-ink mb-8">{linked.map((d) => <Row key={d.id} d={d} />)}</div>
          )}

          {/* all outstanding (demo) */}
          <div className="mono text-[11px] font-bold uppercase text-inksoft mb-2">All outstanding · demo (act as any debtor)</div>
          {others.length === 0 ? (
            <div className="border-2 border-ink bg-bone shadow-hard p-8 text-center mono text-[13px] text-inksoft">Nothing outstanding. Fund a deal in the <Link href="/app/market" className="underline hover:text-lime">marketplace</Link> first.</div>
          ) : (
            <div className="border-2 border-ink bg-bone shadow-hard divide-y-2 divide-ink">{others.map((d) => <Row key={d.id} d={d} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
