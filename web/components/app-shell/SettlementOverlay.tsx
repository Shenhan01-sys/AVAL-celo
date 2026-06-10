"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/api";
import Modal from "./Modal";

type Props = { info: any; onSettled: () => Promise<void> | void; onClose: () => void };

const PHASES = [
  { key: "sign", label: "Debtor authorising payment…", ms: 1000 },
  { key: "stream", label: "Paying invoice face value into escrow…", ms: 1600 },
  { key: "release", label: "Settling to investor + platform fee…", ms: 1600 },
  { key: "done", label: "Settled — investor repaid.", ms: 0 },
] as const;

function CoinStream({ active, count = 7, dur = 1.2 }: { active: boolean; count?: number; dur?: number }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <img key={i} src="/csprusd-coin.png" alt="" className="absolute w-6 h-6 rounded-full" style={{ top: "50%", transform: "translate(-50%,-50%)", animation: `payStream ${dur}s linear ${((i * dur) / count).toFixed(2)}s infinite` }} />
      ))}
    </div>
  );
}

function Node({ label, emoji, lit }: { label: string; emoji: string; lit: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className={`w-14 h-14 grid place-items-center border-2 border-ink text-[22px] transition-colors ${lit ? "bg-lime" : "bg-bone"}`} style={lit ? { animation: "payNodePulse 1.4s ease-in-out infinite" } : undefined}>{emoji}</div>
      <div className="mono text-[9px] font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function SettlementOverlay({ info, onSettled, onClose }: Props) {
  const [phase, setPhase] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    if (PHASES[phase].key === "stream" && !fired.current) {
      fired.current = true;
      Promise.resolve(onSettled()).catch(() => {});
    }
    if (phase < PHASES.length - 1) {
      const t = setTimeout(() => setPhase((p) => p + 1), PHASES[phase].ms);
      return () => clearTimeout(t);
    }
  }, [phase, onSettled]);

  const p = PHASES[phase];
  const done = p.key === "done";

  return (
    <Modal onClose={onClose} z={100} dismissable={done} backdrop="bg-ink/92" panelClassName="w-full max-w-[640px] border-2 border-ink bg-bone shadow-hard p-7 md:p-9">
      {(close) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <div className="mono text-[11px] font-bold uppercase tracking-wider text-inksoft">Repay · {info.invoice_number}</div>
            {done && <button onClick={close} className="mono text-[11px] font-bold uppercase border-2 border-ink px-2 py-0.5 hover:bg-ink hover:text-bone transition-colors">close ✕</button>}
          </div>
          <div className="display text-[clamp(28px,5vw,44px)] leading-none mb-7">{fmt(info.face)}<span className="text-[15px] text-inksoft"> csprUSD</span></div>

          <div className="flex items-center justify-between gap-2 mb-7">
            <Node label="Debtor" emoji="🏢" lit={!done} />
            <div className="relative flex-1 h-12 border-y-2 border-dashed border-ink/25"><CoinStream active={p.key === "stream"} /></div>
            <Node label="Escrow" emoji="🔒" lit={p.key === "stream" || p.key === "release" || done} />
            <div className="relative flex-1 h-12 border-y-2 border-dashed border-ink/25"><CoinStream active={p.key === "release"} /></div>
            <Node label="Investor" emoji="🧑‍💼" lit={p.key === "release" || done} />
          </div>

          <div className={`border-2 border-ink px-4 py-3 mono text-[13px] font-bold flex items-center gap-3 ${done ? "bg-lime" : "bg-bone2"}`}>
            {done ? <span>✓</span> : <span className="inline-block w-2 h-2 rounded-full bg-ink" style={{ animation: "blink 1s steps(1) infinite" }} />}
            {p.label}
          </div>

          {done && (
            <div className="grid grid-cols-3 gap-px bg-ink border-2 border-ink mt-5">
              {([["Investor", info.toInvestor], ["Platform fee", info.fee], ["Supplier reserve", info.reserve]] as [string, number][]).map(([l, v], i) => (
                <div key={i} className="bg-bone p-3 text-center">
                  <div className="mono text-[9px] font-bold uppercase text-inksoft">{l}</div>
                  <div className="mono text-[14px] font-bold mt-0.5">{fmt(v)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
