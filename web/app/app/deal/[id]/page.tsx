"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API, fmt, tierCls } from "@/lib/api";
import { useWallet } from "@/components/wallet/WalletContext";
import { recordPosition } from "@/lib/supabase";
import PaymentOverlay from "@/components/app-shell/PaymentOverlay";
import InvoicePreviewModal from "@/components/app-shell/InvoicePreviewModal";
import { lineItems, dateMinus } from "@/lib/invoice";

function InvoiceDoc({ fin, onPreview }: { fin: any; onPreview: () => void }) {
  const isPO = fin.product_type === "po";
  const items = lineItems(fin.amount, isPO);
  return (
    <div onClick={onPreview} className="group relative border-2 border-ink bg-white shadow-hard p-6 md:p-8 overflow-hidden cursor-zoom-in">
      <div
        className="absolute top-7 right-7 border-[3px] border-lime mono font-bold uppercase text-[11px] leading-tight text-center px-3 py-2"
        style={{ animation: "stampPop .5s ease-out", transform: "rotate(-8deg)" }}
      >
        Agent
        <br />
        verified ✓
      </div>

      <div className="mono text-[11px] font-bold uppercase tracking-[.2em] text-inksoft mb-1">{isPO ? "Purchase Order" : "Invoice"}</div>
      <div className="display text-[clamp(26px,4vw,36px)] leading-none mb-7">{fin.invoice_number}</div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-7">
        <div>
          <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">From · supplier</div>
          <div className="font-bold text-[14px]">{fin.issuer_name}</div>
        </div>
        <div>
          <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Bill to · debtor</div>
          <div className="font-bold text-[14px]">{fin.buyer_name}</div>
        </div>
        <div>
          <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Issued</div>
          <div className="mono text-[13px]">{dateMinus(fin.due_date, 60)}</div>
        </div>
        <div>
          <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Due</div>
          <div className="mono text-[13px]">{fin.due_date}</div>
        </div>
      </div>

      <div className="border-2 border-ink">
        <div className="grid grid-cols-[1fr_64px_104px] bg-ink text-bone mono text-[10px] font-bold uppercase">
          <div className="px-3 py-2">Description</div>
          <div className="px-2 py-2">Unit</div>
          <div className="px-3 py-2 text-right">Amount</div>
        </div>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_64px_104px] border-t-2 border-ink/10 text-[13px]">
            <div className="px-3 py-2.5">{it[0]}</div>
            <div className="px-2 py-2.5 mono text-inksoft">{it[1]}</div>
            <div className="px-3 py-2.5 text-right mono font-bold">{fmt(it[2])}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <div className="w-[240px]">
          <div className="flex justify-between text-[13px] py-1"><span className="mono text-inksoft uppercase text-[11px]">Subtotal</span><span className="mono font-bold">{fmt(fin.amount)}</span></div>
          <div className="flex justify-between text-[13px] py-1"><span className="mono text-inksoft uppercase text-[11px]">Tax</span><span className="mono font-bold">incl.</span></div>
          <div className="flex justify-between items-center border-t-2 border-ink pt-2 mt-1">
            <span className="mono text-[11px] font-bold uppercase">Total due</span>
            <span className="display text-[22px] leading-none">{fmt(fin.amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t-2 border-dashed border-ink/15 flex items-center justify-between gap-3">
        <span className="mono text-[10px] text-inksoft uppercase leading-relaxed">🔒 Supplier disclosed to funders · hidden on the marketplace</span>
        <span className="mono text-[10px] font-bold uppercase bg-ink text-bone group-hover:bg-lime group-hover:text-ink px-2.5 py-1 transition-colors whitespace-nowrap">⤢ open file</span>
      </div>
    </div>
  );
}

export default function DealPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const { address } = useWallet();
  const [fin, setFin] = useState<any>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState(false);
  const [pay, setPay] = useState(false);
  const [preview, setPreview] = useState(false);

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

  const doFund = useCallback(async () => {
    try {
      await fetch(API + "/financing/" + id + "/fund", { method: "POST" });
      if (fin) recordPosition(address || "anon", fin);
      await new Promise((r) => setTimeout(r, 400));
      await load();
    } catch {
      /* ignore */
    }
  }, [id, fin, address, load]);

  async function release(idx: number) {
    setBusy(idx);
    try {
      const fd = new FormData();
      fd.append("file", new Blob(["delivery proof M" + idx], { type: "text/plain" }), "proof.txt");
      await fetch(API + "/financing/" + id + "/milestone-proof?milestone_idx=" + idx, { method: "POST", body: fd });
      await new Promise((r) => setTimeout(r, 850));
      await load();
    } catch {
      /* ignore */
    }
    setBusy(null);
  }

  if (err)
    return (
      <div className="px-6 md:px-10 py-12 mono text-inksoft">
        Deal not found — backend may be off. <Link href="/app/market" className="underline hover:text-lime">Back to marketplace</Link>.
      </div>
    );
  if (!fin)
    return (
      <div className="px-6 md:px-10 py-12 mono text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>
        Loading deal {id}…
      </div>
    );

  const funded = fin.status === "funded";
  const hashRef = "casper:0x" + String(fin.invoice_number).replace(/\W/g, "").toLowerCase().padEnd(8, "0").slice(0, 8) + "…" + String(id).slice(-4);

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      {pay && <PaymentOverlay deal={fin} onFunded={doFund} onClose={() => { setPay(false); load(); }} />}
      {preview && <InvoicePreviewModal fin={fin} funded={funded} onClose={() => setPreview(false)} />}

      <Link href="/app/market" className="mono text-[12px] font-bold uppercase tracking-wide text-inksoft hover:text-lime">← marketplace</Link>
      <div className="flex flex-wrap items-end gap-4 mt-4 mb-2">
        <h1 className="display uppercase text-[clamp(30px,5vw,60px)] leading-none">{fin.invoice_number}</h1>
        <span className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1 ${tierCls[fin.risk_tier]}`}>{fin.risk_tier} · {fin.risk_score}/100</span>
        <span className={`mono text-[11px] font-bold uppercase border-2 border-ink px-2.5 py-1 ${funded ? "bg-ink text-bone" : "bg-bone"}`}>{funded ? "Funded" : "Open"}</span>
      </div>
      <p className="text-[16px] text-inksoft mb-9">{fin.issuer_name} → {fin.buyer_name} · due {fin.due_date}</p>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
        {/* invoice document */}
        <InvoiceDoc fin={fin} onPreview={() => setPreview(true)} />

        {/* terms + fund + provenance */}
        <div className="flex flex-col gap-6">
          <div className="border-2 border-ink bg-bone shadow-hard p-6">
            <div className="mono text-[11px] font-bold uppercase text-inksoft mb-4">Financing terms</div>
            <div className="grid grid-cols-2 gap-5 mb-6">
              {([["Funded now", fmt(fin.funding_amount)], ["Investor yield", Math.round(fin.yield_rate) + "% APR"], ["Repaid at maturity", fmt(fin.total_repayment)], ["Supplier fee", fmt(fin.expected_yield_amount)]] as any[]).map(([l, v], i) => (
                <div key={i}>
                  <div className="mono text-[10px] uppercase text-inksoft font-bold">{l}</div>
                  <div className="display text-[clamp(20px,2.4vw,28px)] leading-none mt-1">{v}</div>
                </div>
              ))}
            </div>
            {funded ? (
              <div className="w-full text-center mono text-[12px] font-bold uppercase bg-ink text-bone py-3.5">Funded ✓ · position opened</div>
            ) : (
              <button onClick={() => setPay(true)} className="w-full px-5 py-4 border-2 border-ink bg-lime font-bold uppercase tracking-wide shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
                Fund {fmt(fin.funding_amount)} →
              </button>
            )}
          </div>

          {/* provenance / identity */}
          <div className="border-2 border-ink bg-bone shadow-hard p-6">
            <div className="mono text-[11px] font-bold uppercase text-inksoft mb-4">Provenance · agent verdict</div>
            {([["Document authenticity", fin.ai_report?.doc_score], ["Counterparty", fin.ai_report?.counterparty_score], ["Relationship", fin.ai_report?.relationship_score]] as any[]).map(([l, s], i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between mono text-[11px] font-bold uppercase mb-1"><span>{l}</span><span>{s}</span></div>
                <div className="h-3 border-2 border-ink bg-bone2"><div className="h-full bg-lime" style={{ width: (s || 0) + "%" }} /></div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="border-2 border-ink p-3"><div className="mono text-[9px] uppercase text-inksoft font-bold">Verifier oracle</div><div className="mono text-[14px] font-bold mt-0.5">⭐ {fin.oracle?.accuracy_pct}%</div></div>
              <div className="border-2 border-ink p-3"><div className="mono text-[9px] uppercase text-inksoft font-bold">Staked</div><div className="mono text-[14px] font-bold mt-0.5">🔒 {fin.oracle?.stake_cspr?.toLocaleString()} CSPR</div></div>
            </div>
            <div className="mt-3 border-2 border-ink bg-ink text-bone p-3">
              <div className="mono text-[9px] uppercase text-bone/50 font-bold">On-chain reference</div>
              <div className="mono text-[12px] font-bold mt-0.5 break-all text-lime">{hashRef}</div>
            </div>
          </div>
        </div>
      </div>

      {/* milestones */}
      <div className="border-2 border-ink bg-ink text-bone shadow-hard p-6 md:p-8 mt-8">
        <div className="mono text-[11px] font-bold uppercase tracking-wide text-lime mb-6">Milestones · auto-released by the agent</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {(fin.milestones || []).map((m: any) => {
            const released = m.status === "released";
            const canRelease = funded && !released && m.idx >= 2;
            return (
              <div key={m.idx} className={`border-2 p-4 flex items-center gap-4 ${released ? "border-lime bg-lime/10" : "border-bone/25"}`} style={released ? { animation: "slamIn .45s cubic-bezier(.2,1,.3,1)" } : undefined}>
                <span className={`mono font-bold text-[14px] w-9 h-9 grid place-items-center border-2 shrink-0 ${released ? "border-lime bg-lime text-ink" : "border-bone/40"}`}>{released ? "✓" : "M" + m.idx}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{m.name} <span className="text-bone/50 mono text-[12px]">· {m.percentage}%</span></div>
                  <div className="mono text-[12px] text-bone/60">{fmt(m.payout_amount)}{released ? " · released on-chain" : ""}</div>
                </div>
                {released ? (
                  <span className="mono text-[11px] font-bold uppercase text-lime shrink-0">Released</span>
                ) : m.idx === 1 ? (
                  <span className="mono text-[11px] text-bone/40 uppercase shrink-0">on funding</span>
                ) : canRelease ? (
                  <button onClick={() => release(m.idx)} disabled={busy !== null} className="mono text-[11px] font-bold uppercase bg-bone text-ink px-3 py-1.5 disabled:opacity-60 shrink-0">
                    {busy === m.idx ? "Verifying…" : "Submit proof"}
                  </button>
                ) : (
                  <span className="mono text-[11px] text-bone/40 uppercase shrink-0">locked</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mono text-[11px] text-bone/40 mt-6 leading-relaxed">On proof of delivery, the AI Verifier checks it and releases the milestone on-chain — autonomously, no human approval.</p>
      </div>
    </div>
  );
}
