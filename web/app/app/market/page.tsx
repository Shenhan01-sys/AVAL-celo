"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { API, daysTo, shortDue, fmt } from "@/lib/api";
import { useWallet } from "@/components/wallet/WalletContext";
import { recordPosition } from "@/lib/supabase";
import CompareModal from "@/components/app-shell/CompareModal";

const RISK_RING: Record<string, string> = { low: "#BFF205", medium: "#E5A823", high: "#FF5A1F" };
const tierChip: Record<string, string> = { low: "bg-lime text-ink", medium: "bg-[#E5A823] text-ink", high: "bg-signal text-bone" };

const DMAX = 120;
const YMIN = 4;
const YMAX = 18;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const xFrac = (days: number) => 0.1 + clamp01(days / DMAX) * 0.82;
const yFrac = (y: number) => 0.84 - clamp01((y - YMIN) / (YMAX - YMIN)) * 0.66;
const baseSize = (amt: number) => 44 + clamp01((amt || 0) / 600000) * 50;
const kfmt = (n: number) => "$" + Math.round((n || 0) / 1000) + "k";
const money = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : kfmt(n));
const worstRisk = (arr: any[]) => (arr.some((d) => d.risk_tier === "high") ? "high" : arr.some((d) => d.risk_tier === "medium") ? "medium" : "low");

const YIELD_LINES = [6, 10, 14, 18];
const DAY_TICKS = [0, 30, 60, 90, 120];
const RISKS = ["all", "low", "medium", "high"] as const;
const CLUSTER_THRESHOLD = 16; // start aggregating above this many coins

export default function MarketPage() {
  const { address } = useWallet();
  const [deals, setDeals] = useState<any[]>([]);
  const [funded, setFunded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any>(null);
  const [compare, setCompare] = useState<any[]>([]);
  const [cmpOpen, setCmpOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<(typeof RISKS)[number]>("all");
  const [focus, setFocus] = useState<{ members: any[]; label: string; ox: number; oy: number } | null>(null);
  const [spawning, setSpawning] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 760, h: 560 });

  async function load() {
    try {
      const r = await fetch(API + "/marketplace");
      const d = await r.json();
      if (Array.isArray(d)) {
        setDeals(d);
        const f: Record<string, boolean> = {};
        d.forEach((x: any) => { if (x.status === "funded") f[x.id] = true; });
        setFunded((p) => ({ ...f, ...p }));
      }
    } catch {
      /* backend off */
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // changing the filter exits any drilled-in cluster
  useEffect(() => { setFocus(null); }, [q, risk]);

  // FLIP-style drill-in: members start at the cluster's position, then glide out to their spots
  useEffect(() => {
    if (!focus) { setSpawning(false); return; }
    setSpawning(true);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setSpawning(false)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [focus]);

  async function fund(d: any) {
    setFunded((f) => ({ ...f, [d.id]: true }));
    try {
      await fetch(API + `/financing/${d.id}/fund`, { method: "POST" });
      recordPosition(address || "anon", d);
    } catch {
      /* ignore */
    }
  }

  const inCompare = (d: any) => compare.some((x) => x.id === d.id);
  const toggleCompare = (d: any) => setCompare((c) => (c.some((x) => x.id === d.id) ? c.filter((x) => x.id !== d.id) : c.length < 2 ? [...c, d] : c));

  const [confirmedOnly, setConfirmedOnly] = useState(false);

  const filtered = useMemo(
    () =>
      deals.filter(
        (d) =>
          (risk === "all" || d.risk_tier === risk) &&
          (!confirmedOnly || d.buyer_status === "confirmed") &&
          (!q || `${d.invoice_number} ${d.buyer_name}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [deals, risk, q, confirmedOnly]
  );

  const working = focus ? focus.members : filtered;

  // build render nodes — singles, or grid-aggregated clusters when crowded — then de-overlap them.
  const nodes = useMemo(() => {
    const { w, h } = dims;
    const mL = w * 0.1 + 4, mR = 14, mT = 14, mB = 26;
    const scale = working.length > 40 ? 0.62 : working.length > 24 ? 0.78 : 1;

    const pts = working.map((d) => {
      const days = daysTo(d.due_date);
      return { d, days, tx: xFrac(days) * w, ty: yFrac(d.yield_rate) * h };
    });

    let raw: any[];
    const doCluster = !focus && working.length > CLUSTER_THRESHOLD;
    if (doCluster) {
      const cols = 7, rows = 4;
      const cw = w / cols, ch = h / rows;
      const bins = new Map<string, any[]>();
      for (const p of pts) {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.tx / cw)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.ty / ch)));
        const k = cx + "-" + cy;
        if (!bins.has(k)) bins.set(k, []);
        bins.get(k)!.push(p);
      }
      raw = [];
      for (const arr of bins.values()) {
        if (arr.length === 1) {
          const p = arr[0];
          raw.push({ type: "single", key: p.d.id, d: p.d, days: p.days, r: (baseSize(p.d.funding_amount) * scale) / 2, tx: p.tx, ty: p.ty });
        } else {
          const tx = arr.reduce((s, a) => s + a.tx, 0) / arr.length;
          const ty = arr.reduce((s, a) => s + a.ty, 0) / arr.length;
          const vol = arr.reduce((s, a) => s + (a.d.funding_amount || 0), 0);
          const avgY = Math.round(arr.reduce((s, a) => s + a.d.yield_rate, 0) / arr.length);
          raw.push({ type: "cluster", key: "c" + tx.toFixed(0) + ty.toFixed(0), members: arr.map((a) => a.d), count: arr.length, vol, avgY, risk: worstRisk(arr.map((a) => a.d)), r: (56 + clamp01(arr.length / 18) * 44) / 2, tx, ty });
        }
      }
    } else {
      raw = pts.map((p) => ({ type: "single", key: p.d.id, d: p.d, days: p.days, r: (baseSize(p.d.funding_amount) * scale) / 2, tx: p.tx, ty: p.ty }));
    }

    for (let it = 0; it < 90; it++) {
      for (let a = 0; a < raw.length; a++) {
        for (let b = a + 1; b < raw.length; b++) {
          const A = raw[a], B = raw[b];
          const ddx = (B.x ?? B.tx) - (A.x ?? A.tx);
          const ddy = (B.y ?? B.ty) - (A.y ?? A.ty);
          const dist = Math.hypot(ddx, ddy) || 0.01;
          const min = A.r + B.r + 8;
          if (dist < min) {
            const push = (min - dist) / 2, ux = ddx / dist, uy = ddy / dist;
            A.x = (A.x ?? A.tx) - ux * push; A.y = (A.y ?? A.ty) - uy * push;
            B.x = (B.x ?? B.tx) + ux * push; B.y = (B.y ?? B.ty) + uy * push;
          }
        }
      }
      for (const n of raw) {
        n.x = (n.x ?? n.tx) + (n.tx - (n.x ?? n.tx)) * 0.16;
        n.y = (n.y ?? n.ty) + (n.ty - (n.y ?? n.ty)) * 0.06;
        n.x = Math.max(mL + n.r, Math.min(w - mR - n.r, n.x));
        n.y = Math.max(mT + n.r, Math.min(h - mB - n.r, n.y));
      }
    }
    return raw;
  }, [working, focus, dims]);

  const avgYield = deals.length ? Math.round(deals.reduce((s, d) => s + d.yield_rate, 0) / deals.length) : 0;
  const volume = deals.reduce((s, d) => s + (d.funding_amount || 0), 0);
  const nextDays = deals.length ? Math.min(...deals.map((d) => daysTo(d.due_date))) : 0;
  const stats: [string, string, boolean][] = [
    ["Open deals", String(deals.length), false],
    ["Avg yield", avgYield + "%", true],
    ["Total volume", money(volume), false],
    ["Soonest cash-back", nextDays + "d", false],
  ];

  const youX = dims.w * 0.085;

  return (
    <div className="px-6 md:px-10 py-10 md:py-12">
      <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-5">Marketplace</div>
      <h1 className="display uppercase leading-[.92] text-[clamp(30px,5vw,60px)] mb-2">Read the whole book.</h1>
      <p className="text-[16px] md:text-[18px] font-medium max-w-[58ch] mb-8 text-inksoft">
        Every invoice is a coin — placed by <b className="text-ink">when your cash returns</b> and <b className="text-ink">how much it yields</b>. When it gets crowded, nearby deals stack into a cluster — click to dive in.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 border-2 border-ink divide-x-2 divide-ink mb-6 max-w-[760px]">
        {stats.map(([l, v, accent], i) => (
          <div key={i} className={`p-4 ${accent ? "bg-lime" : "bg-bone"} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""}`}>
            <div className="mono text-[10px] font-bold uppercase text-inksoft">{l}</div>
            <div className="display text-[clamp(22px,2.6vw,30px)] leading-none mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice # or buyer…" className="w-[260px] max-w-full border-2 border-ink bg-white pl-9 pr-3 py-2 font-medium text-[14px] focus:outline-none focus:bg-lime/10" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[13px] text-inksoft">⌕</span>
        </div>
        <div className="flex items-center gap-2">
          {RISKS.map((t) => (
            <button key={t} onClick={() => setRisk(t)} className={`mono text-[11px] font-bold uppercase border-2 border-ink px-3 py-1.5 transition-all flex items-center gap-1.5 ${risk === t ? "bg-ink text-bone shadow-hard2" : "bg-bone hover:bg-bone2"}`}>
              {t !== "all" && <i className="w-2.5 h-2.5 rounded-full border-2 border-current" style={{ background: RISK_RING[t] }} />}
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setConfirmedOnly((v) => !v)} className={`mono text-[11px] font-bold uppercase border-2 border-ink px-3 py-1.5 transition-all ${confirmedOnly ? "bg-lime text-ink shadow-hard2" : "bg-bone hover:bg-bone2"}`}>✓ confirmed only</button>
        <div className="mono text-[11px] font-bold uppercase text-inksoft ml-auto">
          {filtered.length} / {deals.length} shown
          {(q || risk !== "all") && <button onClick={() => { setQ(""); setRisk("all"); }} className="ml-3 underline hover:text-lime">clear</button>}
        </div>
      </div>

      {/* drill-down breadcrumb */}
      {focus && (
        <div className="flex items-center gap-3 mb-3 border-2 border-ink bg-ink text-bone px-4 py-2">
          <button onClick={() => setFocus(null)} className="mono text-[11px] font-bold uppercase hover:text-lime">← all deals</button>
          <span className="mono text-[11px] text-bone/60">/ cluster · {focus.label} · {focus.members.length} deals</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ===== THE BOOK ===== */}
        <div ref={fieldRef} className="relative border-2 border-ink bg-bone shadow-hard h-[480px] sm:h-[560px]">
          {YIELD_LINES.map((v) => (
            <div key={v} className="absolute left-0 right-0 border-t border-dashed border-ink/15 flex justify-end pointer-events-none" style={{ top: yFrac(v) * 100 + "%" }}>
              <span className="mono text-[13px] font-bold text-inksoft -translate-y-1/2 bg-bone px-1.5">{v}%</span>
            </div>
          ))}
          <span className="absolute top-3 left-[11.5%] display uppercase text-[clamp(16px,2vw,22px)] leading-none text-ink/65 pointer-events-none">↑ Yield</span>
          <span className="absolute bottom-7 right-4 display uppercase text-[clamp(16px,2vw,22px)] leading-none text-ink/65 pointer-events-none">Maturity →</span>

          {DAY_TICKS.map((d) => (
            <div key={d} className="absolute bottom-0 flex flex-col items-center pointer-events-none" style={{ left: xFrac(d) * 100 + "%", transform: "translateX(-50%)" }}>
              <div className="w-px h-2.5 bg-ink/40" />
              <span className="mono text-[12px] font-bold text-inksoft pb-1.5">{d === 0 ? "today" : d + "d"}</span>
            </div>
          ))}

          <div className="absolute top-0 bottom-6 left-0 w-[10%] border-r-2 border-ink/30 bg-ink/[.03] grid place-items-center pointer-events-none">
            <div className="mono text-[12px] font-bold uppercase tracking-[.25em] text-inksoft" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>you · today</div>
          </div>

          <svg className="absolute inset-0 pointer-events-none" width={dims.w} height={dims.h}>
            {nodes.map((n) => <line key={n.key} className="mkt-flow" x1={n.x} y1={n.y} x2={youX} y2={n.y} />)}
          </svg>

          {loading ? (
            <div className="absolute inset-0 grid place-items-center mono text-[12px] text-inksoft" style={{ animation: "blink 1s steps(1) infinite" }}>Loading the book…</div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div className="mono text-[12px] text-inksoft">{deals.length === 0 ? <>No live deals — agent backend on :8000?<br /><Link href="/app/finance" className="underline hover:text-lime">Finance an invoice →</Link></> : "No deals match your filter."}</div>
            </div>
          ) : (
            <div className="absolute inset-0" key={focus ? "focus" : "overview"} style={{ animation: "ovIn .32s ease" }}>
            {nodes.map((n, idx) => {
              const hovered = hover === n.key;
              if (n.type === "cluster") {
                const cardBelow = n.y < dims.h * 0.42;
                return (
                  <div key={n.key} className="absolute" style={{ left: n.x, top: n.y, transform: "translate(-50%,-50%)", transition: "left .5s cubic-bezier(.2,1,.3,1), top .5s cubic-bezier(.2,1,.3,1)", zIndex: hovered ? 40 : 7 }} onMouseEnter={() => setHover(n.key)} onMouseLeave={() => setHover((h) => (h === n.key ? null : h))}>
                    {hovered && (
                      <div className="absolute left-1/2 -translate-x-1/2 z-50 w-[210px] border-2 border-ink bg-bone shadow-hard p-3 pointer-events-none" style={cardBelow ? { top: n.r * 2 + 12 } : { bottom: n.r * 2 + 12 }}>
                        <div className="display text-[20px] leading-none mb-1">{n.count} deals</div>
                        <div className="grid grid-cols-2 gap-2 mono text-[11px]">
                          <div><div className="text-[8px] uppercase text-inksoft font-bold">Total</div><div className="font-bold">{money(n.vol)}</div></div>
                          <div><div className="text-[8px] uppercase text-inksoft font-bold">Avg yield</div><div className="font-bold">{n.avgY}%</div></div>
                        </div>
                        <div className="mt-2 pt-2 border-t-2 border-ink/15 mono text-[9px] font-bold uppercase text-inksoft">click to expand →</div>
                      </div>
                    )}
                    <button onClick={() => setFocus({ members: n.members, label: `${money(n.vol)} · ${n.avgY}%`, ox: n.x, oy: n.y })} className="block focus:outline-none" aria-label={`Cluster of ${n.count} deals`}>
                      <div className="relative grid place-items-center hover:scale-105 transition-transform" style={{ width: n.r * 2, height: n.r * 2, animation: `mktFloat ${3 + (idx % 3) * 0.5}s ease-in-out ${idx * 0.2}s infinite` }}>
                        <img src="/csprusd-coin.png" alt="" className="absolute rounded-full" style={{ width: "82%", height: "82%", transform: "translate(-7px,-7px) rotate(-12deg)", opacity: 0.5 }} />
                        <img src="/csprusd-coin.png" alt="" className="absolute rounded-full" style={{ width: "82%", height: "82%", transform: "translate(7px,7px) rotate(12deg)", opacity: 0.5 }} />
                        <img src="/csprusd-coin.png" alt="" draggable={false} className="w-full h-full rounded-full object-cover relative" />
                        <span className="absolute rounded-full" style={{ inset: -3, border: `3px solid ${RISK_RING[n.risk]}` }} />
                        <span className="absolute inset-0 rounded-full bg-ink/55 grid place-items-center">
                          <span className="display text-bone leading-none" style={{ fontSize: Math.max(15, n.r * 0.7) }}>×{n.count}</span>
                        </span>
                      </div>
                      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap mono text-[10px] font-bold text-ink pointer-events-none px-1 bg-bone/80" style={{ top: n.r * 2 + 6 }}>{money(n.vol)}</span>
                    </button>
                  </div>
                );
              }
              // single
              const d = n.d;
              const active = sel?.id === d.id;
              const cardBelow = n.y < dims.h * 0.42;
              return (
                <div key={n.key} className="absolute" style={{ left: spawning && focus ? focus.ox : n.x, top: spawning && focus ? focus.oy : n.y, opacity: spawning && focus ? 0 : 1, transform: "translate(-50%,-50%)", transition: "left .5s cubic-bezier(.2,1,.3,1), top .5s cubic-bezier(.2,1,.3,1), opacity .45s ease", zIndex: hovered || active ? 40 : 6 }} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover((h) => (h === d.id ? null : h))}>
                  {hovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 z-50 w-[230px] border-2 border-ink bg-bone shadow-hard p-3 pointer-events-none" style={cardBelow ? { top: n.r * 2 + 12 } : { bottom: n.r * 2 + 12 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="mono text-[13px] font-bold">{d.invoice_number}</span>
                        <span className={`mono text-[9px] font-bold uppercase border-2 border-ink px-1.5 py-0.5 ${tierChip[d.risk_tier]}`}>{d.risk_tier}</span>
                      </div>
                      <div className="mono text-[10px] font-bold uppercase text-inksoft mb-2">{d.buyer_name} · debtor</div>
                      <div className="grid grid-cols-2 gap-2 mono text-[11px]">
                        <div><div className="text-[8px] uppercase text-inksoft font-bold">Face value</div><div className="font-bold">{fmt(d.amount)}</div></div>
                        <div><div className="text-[8px] uppercase text-inksoft font-bold">Fund now</div><div className="font-bold">{fmt(d.funding_amount)}</div></div>
                        <div><div className="text-[8px] uppercase text-inksoft font-bold">Yield</div><div className="font-bold text-ink">{Math.round(d.yield_rate)}%</div></div>
                        <div><div className="text-[8px] uppercase text-inksoft font-bold">Cash back</div><div className="font-bold">{n.days}d · {shortDue(d.due_date)}</div></div>
                      </div>
                      <div className="mt-2 pt-2 border-t-2 border-ink/15 mono text-[9px] font-bold uppercase flex items-center justify-between"><span className={d.buyer_status === "confirmed" ? "text-ink" : "text-inksoft"}>{d.buyer_status === "confirmed" ? "✓ buyer-confirmed" : "⚠ pending NoA"}</span><span className="text-inksoft">⭐ {d.verifier_accuracy ?? 96}%</span></div>
                    </div>
                  )}
                  <button onClick={() => setSel(d)} className="block focus:outline-none" aria-label={`${d.invoice_number} · ${Math.round(d.yield_rate)}% · ${n.days}d`}>
                    <div className="relative grid place-items-center transition-transform duration-200 hover:scale-[1.12]" style={{ width: n.r * 2, height: n.r * 2, animation: `mktFloat ${3 + (idx % 3) * 0.5}s ease-in-out ${idx * 0.3}s infinite` }}>
                      <img src="/csprusd-coin.png" alt="" draggable={false} className="w-full h-full rounded-full object-cover" />
                      <span className="absolute rounded-full" style={{ inset: -3, border: `3px solid ${RISK_RING[d.risk_tier] || "#0b0b0a"}`, boxShadow: active ? "0 0 0 3px #0b0b0a" : "none" }} />
                      {funded[d.id] && <span className="absolute inset-0 rounded-full bg-lime/85 grid place-items-center mono font-bold text-ink text-[16px] border-[3px] border-ink">✓</span>}
                      {d.buyer_status === "confirmed" && !funded[d.id] && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lime border-2 border-ink grid place-items-center mono text-[8px] font-bold text-ink">✓</span>}
                    </div>
                  </button>
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap mono text-[10px] font-bold text-ink pointer-events-none px-1 bg-bone/80" style={{ top: n.r * 2 + 6 }}>{kfmt(d.funding_amount)}</span>
                </div>
              );
            })}
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-3 border-2 border-ink bg-bone px-2.5 py-1.5 mono text-[9px] font-bold uppercase pointer-events-none">
            {(["low", "medium", "high"] as const).map((t) => (
              <span key={t} className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full border-2 border-ink" style={{ background: RISK_RING[t] }} />{t}</span>
            ))}
          </div>
        </div>

        {/* ===== inspector ===== */}
        <aside className="border-2 border-ink bg-bone shadow-hard p-6 lg:sticky lg:top-6 min-h-[280px]">
          {!sel ? (
            <div className="text-center py-12">
              <img src="/csprusd-coin.png" alt="" className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-ink" style={{ animation: "mktFloat 3s ease-in-out infinite" }} />
              <div className="mono text-[12px] uppercase tracking-wide text-inksoft leading-relaxed">Click a coin to inspect.<br />Click a cluster to dive in.</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="display text-[clamp(26px,3vw,34px)] leading-none">{sel.invoice_number}</div>
                <span className={`mono text-[10px] font-bold uppercase border-2 border-ink px-2 py-0.5 ${tierChip[sel.risk_tier]}`}>{sel.risk_tier}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[13px] text-inksoft">{sel.buyer_name} · debtor</span>
                <span className={`mono text-[9px] font-bold uppercase border-2 border-ink px-1.5 py-0.5 ${sel.buyer_status === "confirmed" ? "bg-lime text-ink" : "bg-bone2 text-ink"}`}>{sel.buyer_status === "confirmed" ? "✓ confirmed" : "pending NoA"}</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-ink border-2 border-ink mb-6">
                {([["Yield", Math.round(sel.yield_rate) + "%", true], ["Cash back in", daysTo(sel.due_date) + "d", false], ["Fund now", fmt(sel.funding_amount), false], ["Matures", shortDue(sel.due_date), false]] as [string, string, boolean][]).map(([l, v, a], i) => (
                  <div key={i} className={`p-3 ${a ? "bg-lime" : "bg-bone"}`}>
                    <div className="mono text-[9px] font-bold uppercase text-inksoft">{l}</div>
                    <div className="display text-[24px] leading-none mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              {sel.buyer_status !== "confirmed" && !funded[sel.id] && (
                <div className="mb-3 border-2 border-ink bg-bone2 px-3 py-2 mono text-[10px] font-bold uppercase leading-snug">⚠ Buyer hasn&apos;t accepted the NoA — higher risk, recourse-backed.</div>
              )}
              {funded[sel.id] ? (
                <div className="w-full text-center mono text-[12px] font-bold uppercase bg-ink text-bone py-3.5">Funded ✓ · position opened</div>
              ) : (
                <button onClick={() => fund(sel)} className="w-full px-5 py-3.5 border-2 border-ink bg-lime font-bold uppercase tracking-wide shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">Fund {fmt(sel.funding_amount)} →</button>
              )}
              <button onClick={() => toggleCompare(sel)} className={`w-full mt-3 mono text-[11px] font-bold uppercase border-2 border-ink px-3 py-2 transition-colors ${inCompare(sel) ? "bg-ink text-bone" : "bg-bone hover:bg-ink hover:text-bone"}`}>{inCompare(sel) ? "✓ In compare — remove" : "⇄ Add to compare"}</button>
              <Link href={`/app/deal/${sel.id}`} className="block text-center mt-3 mono text-[11px] font-bold uppercase text-inksoft hover:text-lime underline underline-offset-2">Open full deal →</Link>
            </>
          )}
        </aside>
      </div>

      {/* compare tray */}
      {compare.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2 sm:gap-3 border-2 border-ink bg-ink text-bone shadow-hard px-4 py-3 max-w-[92vw]">
          <span className="mono text-[11px] font-bold uppercase">⇄ Compare</span>
          {compare.map((d) => (
            <span key={d.id} className="mono text-[11px] font-bold uppercase bg-bone text-ink px-2 py-1 flex items-center gap-1.5">{d.invoice_number}<button onClick={() => toggleCompare(d)} className="hover:text-signal">✕</button></span>
          ))}
          {compare.length < 2 && <span className="mono text-[10px] text-bone/50 uppercase">pick 1 more</span>}
          <button disabled={compare.length < 2} onClick={() => setCmpOpen(true)} className="mono text-[11px] font-bold uppercase bg-lime text-ink border-2 border-bone px-3 py-1.5 disabled:opacity-40">Compare →</button>
          <button onClick={() => setCompare([])} className="mono text-[10px] uppercase text-bone/60 hover:text-bone underline">clear</button>
        </div>
      )}
      {cmpOpen && compare.length === 2 && <CompareModal a={compare[0]} b={compare[1]} onClose={() => setCmpOpen(false)} />}
    </div>
  );
}
