"use client";

import { useState } from "react";
import { fmt } from "@/lib/api";
import { lineItems, dateMinus, sensitive } from "@/lib/invoice";
import Modal from "./Modal";

export default function InvoicePreviewModal({ fin, funded, onClose }: { fin: any; funded: boolean; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const isPO = fin.product_type === "po";
  const items = lineItems(fin.amount, isPO);
  const s = sensitive(fin);

  const Red = ({ value, w = 150 }: { value: string; w?: number }) =>
    funded ? (
      <span className="mono text-[12px] font-bold">{value}</span>
    ) : (
      <span className="inline-flex items-center gap-2 align-middle">
        <span className="inline-block h-3.5 bg-ink" style={{ width: w }} />
        <span className="mono text-[8px] font-bold uppercase text-inksoft border border-ink px-1">funders only</span>
      </span>
    );

  return (
    <Modal onClose={onClose} z={110} panelClassName="w-full max-w-[780px] max-h-[94vh] flex flex-col border-2 border-ink bg-bone shadow-hard">
      {(close) => (
        <>
          {/* toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b-2 border-ink bg-bone2 shrink-0">
            <div className="mono text-[12px] font-bold flex items-center gap-2 min-w-0">
              <span>📄</span>
              <span className="truncate">{fin.invoice_number}.pdf</span>
              <span className="text-inksoft hidden sm:inline">· 1 page · {isPO ? "purchase order" : "invoice"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} className="w-7 h-7 border-2 border-ink bg-bone hover:bg-lime mono font-bold leading-none">−</button>
              <span className="mono text-[11px] font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))} className="w-7 h-7 border-2 border-ink bg-bone hover:bg-lime mono font-bold leading-none">+</button>
              <span className="w-7 h-7 border-2 border-ink bg-bone grid place-items-center text-[12px] opacity-50 cursor-not-allowed" title="Download is funders-only">🔒</span>
              <button onClick={close} className="w-7 h-7 border-2 border-ink bg-ink text-bone hover:bg-signal mono font-bold leading-none">✕</button>
            </div>
          </div>

          {/* privacy banner */}
          <div className="bg-lime border-b-2 border-ink px-4 py-2 mono text-[11px] font-bold leading-snug shrink-0">
            {funded
              ? "✓ You funded this deal — original invoice fully disclosed."
              : "🔒 Watermarked preview · bank details, contacts & signature redacted until you fund. The AI Verifier already inspected the original."}
          </div>

          {/* document scroll area */}
          <div className="flex-1 overflow-auto p-5 sm:p-8 bg-[#cfccc3]">
            <div className="mx-auto bg-white border-2 border-ink shadow-hard w-[620px] max-w-full" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <div className="relative overflow-hidden p-8">
                {/* watermark */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="absolute whitespace-nowrap mono font-bold uppercase text-ink" style={{ top: i * 58 - 40, left: -60, opacity: 0.05, fontSize: 26, transform: "rotate(-24deg)", letterSpacing: ".22em" }}>
                      AVAL · VERIFIED PREVIEW · {fin.invoice_number} &nbsp;&nbsp; AVAL · VERIFIED PREVIEW · {fin.invoice_number}
                    </div>
                  ))}
                </div>

                <div className="absolute top-7 right-7 border-[3px] border-lime mono font-bold uppercase text-[10px] leading-tight text-center px-2.5 py-1.5" style={{ transform: "rotate(-8deg)" }}>
                  Agent
                  <br />
                  verified ✓
                </div>

                <div className="relative">
                  <div className="mono text-[11px] font-bold uppercase tracking-[.22em] text-inksoft mb-1">{isPO ? "Purchase Order" : "Invoice"}</div>
                  <div className="display text-[34px] leading-none mb-7">{fin.invoice_number}</div>

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

                  <div className="border-2 border-ink mb-4">
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

                  <div className="flex justify-end mb-7">
                    <div className="w-[240px]">
                      <div className="flex justify-between text-[13px] py-1"><span className="mono text-inksoft uppercase text-[11px]">Subtotal</span><span className="mono font-bold">{fmt(fin.amount)}</span></div>
                      <div className="flex justify-between text-[13px] py-1"><span className="mono text-inksoft uppercase text-[11px]">Tax</span><span className="mono font-bold">incl.</span></div>
                      <div className="flex justify-between items-center border-t-2 border-ink pt-2 mt-1">
                        <span className="mono text-[11px] font-bold uppercase">Total due</span>
                        <span className="display text-[22px] leading-none">{fmt(fin.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-ink/20 pt-5 grid sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Remit payment to</div>
                      <div className="text-[13px]"><Red value={`${s.bankName} · ${s.account}`} w={170} /></div>
                    </div>
                    <div>
                      <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Accounts contact</div>
                      <div className="text-[13px]"><Red value={`${s.email} · ${s.phone}`} w={150} /></div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="mono text-[10px] uppercase text-inksoft font-bold mb-1">Authorized signature</div>
                      {funded ? (
                        <div className="font-bold text-[15px]" style={{ fontFamily: "cursive" }}>{s.signatory} ✍</div>
                      ) : (
                        <div className="inline-flex items-center gap-2"><span className="inline-block h-7 bg-ink" style={{ width: 180 }} /><span className="mono text-[8px] font-bold uppercase text-inksoft border border-ink px-1">funders only</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
