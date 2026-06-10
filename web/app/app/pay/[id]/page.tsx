"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API, fmt, daysTo } from "@/lib/api";
import SettlementOverlay from "@/components/app-shell/SettlementOverlay";

export default function PayPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [fin, setFin] = useState<any>(null);
  const [err, setErr] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(API + "/financing/" + id);
      const d = await r.json();
      if (d && d.id) setFin(d);
      else setErr(true);
    } catch {
      setErr(true);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const confirm = useCallback(async () => {
    setConfirming(true);
    try {
      await fetch(API + "/financing/" + id + "/confirm", { method: "POST" });
      await new Promise((r) => setTimeout(r, 500));
      await load();
    } catch {
      /* ignore */
    }
    setConfirming(false);
  }, [id, load]);

  const settle = useCallback(async () => {
    try {
      await fetch(API + "/financing/" + id + "/repay", { method: "POST" });
      await new Promise((r) => setTimeout(r, 400));
      await load();
    } catch {
      /* ignore */
    }
  }, [id, load]);

  if (err) return <div className="px-6 md:px-10 py-12 mono text-inksoft">Invoice not found. <Link href="/app/pay" className="underline hover:text-lime">Back</Link>.</div>;
  if (!fin) return <div className="px-6 md:px-10 py-12 mono text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>Loading invoice {id}…</div>;

  const face = Number(fin.amount || fin.total_repayment || 0);
  const totalRep = Number(fin.total_repayment || 0);
  const fee = Math.round(Number(fin.expected_yield_amount || 0) * 0.1);
  const toInvestor = Math.round(totalRep - fee);
  const reserve = Math.max(0, Math.round(face - totalRep));
  const settled = fin.status === "settled";
  const confirmed = fin.buyer_status === "confirmed";
  const info = { invoice_number: fin.invoice_number, face, toInvestor, fee, reserve };

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      {overlay && <SettlementOverlay info={info} onSettled={settle} onClose={() => { setOverlay(false); load(); }} />}

      <Link href="/app/pay" className="mono text-[12px] font-bold uppercase tracking-wide text-inksoft hover:text-lime">← invoices to pay</Link>
      <div className="flex flex-wrap items-end gap-3 mt-4 mb-2">
        <h1 className="display uppercase text-[clamp(30px,5vw,58px)] leading-none">{fin.invoice_number}</h1>
        <span className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1 ${settled ? "bg-ink text-bone" : "bg-lime text-ink"}`}>{settled ? "Settled ✓" : "Due"}</span>
        <span className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1 ${confirmed ? "bg-lime text-ink" : "bg-bone2 text-ink"}`}>{confirmed ? "✓ NoA accepted" : "NoA pending"}</span>
      </div>
      <p className="text-[16px] text-inksoft mb-9">{fin.issuer_name} → you ({fin.buyer_name}) · due {fin.due_date} · {daysTo(fin.due_date)}d</p>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
        {/* what you owe / confirm gate */}
        <div className="border-2 border-ink bg-ink text-bone shadow-hard p-7">
          <div className="mono text-[11px] font-bold uppercase text-bone/50 mb-2">You owe · face value</div>
          <div className="display text-[clamp(40px,8vw,72px)] leading-none">{fmt(face)}</div>
          <div className="mono text-[12px] text-bone/50 mt-1">csprUSD · payable to the receivable holder</div>

          {settled ? (
            <div className="mt-7 w-full text-center mono text-[13px] font-bold uppercase bg-lime text-ink py-4">Settled on-chain ✓</div>
          ) : !confirmed ? (
            <div className="mt-7 border-2 border-bone/30 p-4">
              <div className="mono text-[11px] font-bold uppercase text-lime mb-2">⚠ Notice of Assignment — confirm first</div>
              <p className="text-[12px] text-bone/70 leading-relaxed mb-4">This receivable was assigned to an investor. By confirming, you acknowledge the debt and agree to pay <b className="text-bone">Aval</b> — not the supplier. Paying the supplier won&apos;t discharge it.</p>
              <button onClick={confirm} disabled={confirming} className="w-full px-5 py-3.5 border-2 border-bone bg-bone text-ink font-bold uppercase tracking-wide hover:bg-lime transition-colors disabled:opacity-60">{confirming ? "Confirming…" : "Confirm — I owe this, accept NoA ✍"}</button>
            </div>
          ) : (
            <button onClick={() => setOverlay(true)} className="mt-7 w-full px-6 py-4 border-2 border-bone bg-lime text-ink font-bold uppercase tracking-wide hover:bg-bone transition-colors">Pay {fmt(face)} csprUSD →</button>
          )}
        </div>

        {/* where it goes */}
        <div className="border-2 border-ink bg-bone shadow-hard p-6">
          <div className="mono text-[11px] font-bold uppercase text-inksoft mb-4">Where your payment goes</div>
          <div className="flex flex-col gap-3">
            {([["🧑‍💼", "Investor (principal + yield)", toInvestor, "bg-lime"], ["🏦", "Platform fee", fee, "bg-bone2"], ["🏭", "Supplier reserve released", reserve, "bg-bone2"]] as [string, string, number, string][]).map(([e, l, v, bg], i) => (
              <div key={i} className={`flex items-center gap-3 border-2 border-ink p-3 ${bg}`}>
                <span className="text-[20px]">{e}</span>
                <span className="flex-1 mono text-[12px] font-bold uppercase">{l}</span>
                <span className="display text-[20px] leading-none">{fmt(v)}</span>
              </div>
            ))}
          </div>
          <p className="mono text-[11px] text-inksoft mt-5 leading-relaxed">
            🔒 Notified factoring: paying here settles the investor directly on-chain — no middleman, no diversion risk. The agent verifies the payment (ERC-8004 validation). Unique invoice reference auto-matches the exact amount.
          </p>
        </div>
      </div>
    </div>
  );
}
