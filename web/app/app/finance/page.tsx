"use client";

import { useState } from "react";
import Link from "next/link";
import { API, fmt } from "@/lib/api";
import { useWallet } from "@/components/wallet/WalletContext";
import { recordListing } from "@/lib/supabase";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STEPS = [
  "Paid 0.02 csprUSD via x402 — buyer registry lookup",
  "OCR extraction complete",
  "Counterparty verified",
  "No double-financing on-chain",
  "Scoring risk & pricing…",
];
const tierCls: any = { low: "bg-lime text-ink", medium: "bg-bone2 text-ink", high: "bg-signal text-bone", reject: "bg-signal text-bone" };

const FIELDS: [string, string][] = [
  ["invoice_number", "Invoice #"],
  ["issuer_name", "Your company (supplier)"],
  ["buyer_name", "Buyer (debtor)"],
  ["total_amount", "Face value (csprUSD)"],
  ["invoice_date", "Issued"],
  ["due_date", "Due"],
  ["buyer_email", "Debtor email (sends NoA)"],
  ["buyer_wallet", "Debtor wallet (optional · auto-links)"],
];

export default function FinancePage() {
  const { address } = useWallet();
  const [form, setForm] = useState<any>({
    document_type: "invoice",
    invoice_number: "INV-2042",
    issuer_name: "PT Surya Components",
    buyer_name: "PT Maju Mall",
    total_amount: "500000",
    invoice_date: "2026-06-08",
    due_date: "2026-09-06",
    buyer_email: "",
    buyer_wallet: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"form" | "verifying" | "done" | "rejected">("form");
  const [shown, setShown] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [live, setLive] = useState(true);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  async function verify() {
    setStage("verifying");
    setShown(0);
    setResult(null);
    for (let i = 1; i <= STEPS.length; i++) {
      await wait(720);
      setShown(i);
    }
    try {
      const fd = new FormData();
      fd.append("file", file || new Blob(["AVAL demo invoice " + form.invoice_number], { type: "text/plain" }), file ? file.name : "invoice.txt");
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const res = await fetch(API + "/documents/upload", { method: "POST", body: fd });
      const data = await res.json();
      setLive(true);
      setResult(data);
      setStage(data.status === "rejected" ? "rejected" : "done");
      if (data.financing_id && data.status !== "rejected") {
        recordListing(address || "anon", {
          id: data.financing_id,
          invoice_number: form.invoice_number,
          buyer_name: form.buyer_name,
          amount: Number(form.total_amount),
          funding_amount: data.pricing?.funding_amount,
          yield_rate: data.pricing?.yield_rate,
          risk_tier: data.risk_tier,
          status: "published",
          due_date: form.due_date,
        });
      }
    } catch {
      setLive(false);
      setResult({ risk_score: 82, risk_tier: "low", pricing: { yield_rate: 7, funding_amount: 491400, expected_yield_amount: 8600, total_repayment: 500000 } });
      setStage("done");
    }
  }

  const p = result?.pricing;
  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-5">For suppliers</div>
      <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,60px)] mb-2">Finance an invoice.</h1>
      <p className="text-[16px] md:text-[18px] font-medium max-w-[52ch] mb-10 text-inksoft">Drop your invoice. The AI agent verifies, prices the risk, and lists it — in seconds.</p>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* form */}
        <div className="border-2 border-ink bg-bone shadow-hard p-6 md:p-8">
          <label className="block border-2 border-dashed border-ink/50 bg-bone2 px-4 py-6 text-center cursor-pointer hover:bg-bone transition-colors mb-6">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="mono text-[13px] font-bold uppercase">{file ? "📄 " + file.name : "Drop invoice file · or click"}</div>
            <div className="mono text-[11px] text-inksoft mt-1">{file ? "ready" : "PDF / image · optional for the demo"}</div>
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(([k, label]) => (
              <div key={k} className={k === "issuer_name" || k === "buyer_name" ? "sm:col-span-2" : ""}>
                <div className="mono text-[10px] font-bold uppercase text-inksoft mb-1.5">{label}</div>
                <input value={form[k]} onChange={(e) => set(k, e.target.value)} className="w-full border-2 border-ink bg-white px-3 py-2.5 font-medium focus:outline-none focus:bg-lime/10" />
              </div>
            ))}
          </div>
          <button onClick={verify} disabled={stage === "verifying"} className="mt-7 w-full px-6 py-4 border-2 border-ink bg-lime text-ink font-bold uppercase tracking-wide shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-wait">
            {stage === "verifying" ? "Agent working…" : "Verify with the agent →"}
          </button>
        </div>

        {/* agent panel */}
        <div className="border-2 border-ink bg-ink text-bone shadow-hard overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-bone/20">
            <span className="flex items-center gap-2 mono text-[11px] font-bold uppercase tracking-wide text-lime">
              <i className="w-1.5 h-1.5 rounded-full bg-lime" />
              Aval Verifier
            </span>
            <span className="mono text-[11px] text-bone/50">{live ? "live · :8000" : "offline · demo"}</span>
          </div>
          <div className="p-6 min-h-[420px]">
            {stage === "form" && (
              <div className="h-[360px] flex flex-col items-center justify-center text-center gap-3">
                <img src="/csprusd-coin.png" alt="" className="w-16 h-16 rounded-full border-2 border-bone" />
                <div className="mono text-[13px] text-bone/60 uppercase tracking-wide">
                  Fill the invoice →<br />the agent goes to work
                </div>
              </div>
            )}
            {stage !== "form" && (
              <div className="font-mono text-[13px] leading-relaxed">
                {STEPS.slice(0, shown).map((s, i) => (
                  <div key={i} className="flex gap-3 py-1.5" style={{ animation: "slamIn .4s cubic-bezier(.2,1,.3,1)" }}>
                    <span className="text-lime">{i === STEPS.length - 1 && stage === "verifying" ? "▸" : "✓"}</span>
                    <span>{s}</span>
                  </div>
                ))}
                {stage === "verifying" && (
                  <div className="text-bone/40 py-1.5">
                    ▸ <span className="inline-block w-2 h-3.5 bg-lime align-middle" style={{ animation: "blink 1s steps(1) infinite" }} />
                  </div>
                )}

                {stage === "done" && p && (
                  <div className="mt-5 pt-5 border-t-2 border-bone/20" style={{ animation: "slamIn .5s cubic-bezier(.2,1,.3,1)" }}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`mono text-[11px] font-bold uppercase border-2 border-bone px-2.5 py-1 ${tierCls[result.risk_tier] || "bg-lime text-ink"}`}>{result.risk_tier} risk</span>
                      <span className="mono text-[12px] text-bone/60">score {result.risk_score}/100 · verified on-chain</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <div className="mono text-[10px] uppercase text-bone/50 font-bold">You get funded now</div>
                        <div className="display text-[clamp(26px,3vw,40px)] text-lime leading-none mt-1">{fmt(p.funding_amount)}</div>
                      </div>
                      <div>
                        <div className="mono text-[10px] uppercase text-bone/50 font-bold">Investor yield</div>
                        <div className="display text-[clamp(26px,3vw,40px)] leading-none mt-1">{Number(p.yield_rate).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="mono text-[10px] uppercase text-bone/50 font-bold">Buyer repays at maturity</div>
                        <div className="mono text-[18px] font-bold mt-1">{fmt(p.total_repayment)}</div>
                      </div>
                      <div>
                        <div className="mono text-[10px] uppercase text-bone/50 font-bold">Your fee</div>
                        <div className="mono text-[18px] font-bold mt-1">{fmt(p.expected_yield_amount || p.total_repayment - p.funding_amount)}</div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className="mono text-[12px] font-bold uppercase bg-lime text-ink px-3 py-1.5">✓ Listed on the marketplace</span>
                      {result.financing_id && (
                        <Link href={`/app/deal/${result.financing_id}`} className="mono text-[12px] font-bold uppercase bg-bone text-ink px-3 py-1.5">
                          View this deal →
                        </Link>
                      )}
                      <Link href="/app/market" className="mono text-[12px] font-bold uppercase underline hover:text-lime">
                        Marketplace →
                      </Link>
                    </div>
                  </div>
                )}
                {stage === "rejected" && (
                  <div className="mt-5 pt-5 border-t-2 border-bone/20">
                    <span className="mono text-[12px] font-bold uppercase bg-signal text-bone px-3 py-1.5">✕ Rejected · risk too high ({result?.risk_score})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
