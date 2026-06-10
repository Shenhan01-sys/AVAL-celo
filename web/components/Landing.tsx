"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import anime from "animejs";
import Link from "next/link";
import PayAnything from "./PayAnything";

/* ---------- helpers ---------- */
const btnLime = "inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-ink bg-lime text-ink font-semibold shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all";
const btnInk = "inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-ink bg-ink text-bone font-semibold shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all";
const card = "border-2 border-ink bg-bone shadow-hard";
const tierChip: any = { low: "bg-lime text-ink", medium: "bg-bone2 text-ink", high: "bg-signal text-bone" };

function Reveal({ children, y = 30, delay = 0, className = "" }: any) {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!anime || !ref.current) return;
    const node = ref.current;
    node.style.opacity = "0";
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        anime({ targets: e.target, translateY: [y, 0], opacity: [0, 1], easing: "cubicBezier(.2,1,.3,1)", duration: 800, delay });
        io.unobserve(e.target);
      }
    }), { threshold: 0.14 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}

function CountUp({ to, prefix = "", suffix = "", dec = 0, className = "" }: any) {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!anime) { ref.current.textContent = prefix + Number(to).toFixed(dec) + suffix; return; }
    const o = { v: 0 };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        anime({ targets: o, v: to, duration: 1400, easing: "easeOutExpo", update: () => { ref.current.textContent = prefix + o.v.toFixed(dec) + suffix; } });
        io.unobserve(e.target);
      }
    }), { threshold: 0.4 });
    io.observe(ref.current);
  }, []);
  return <span ref={ref} className={className}>{prefix + "0" + suffix}</span>;
}

/* ---------- nav ---------- */
function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-bone border-b-2 border-ink">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-2.5"><img src="/logo-mark.png" alt="Aval" draggable={false} className="w-8 h-8" /><div className="display text-[28px] tracking-tight leading-none">AVAL<span className="text-lime">.</span></div></div>
        <div className="hidden md:flex gap-7 mono text-[12px] font-bold uppercase tracking-wide">
          <a href="#how" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">How</a>
          <a href="#market" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">Market</a>
          <a href="#portfolio" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">Invest</a>
          <a href="#activity" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">Agent</a>
          <a href="#trust" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">Trust</a>
          <a href="#pay" className="hover:text-lime hover:[text-shadow:1px_1px_0_#0b0b0a]">Pay</a>
        </div>
        <Link href="/app" className="inline-block px-5 py-2 border-2 border-ink bg-ink text-bone font-semibold text-[14px] shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Launch app</Link>
      </div>
    </nav>
  );
}

/* ---------- hero · the value machine ---------- */
function ValueMachine() {
  const FACE = 500000, TENOR = 90, RATE = 0.07;
  const [pct, setPct] = useState(100);
  const track = useRef<any>(null);
  const drag = useRef(false);
  const day = Math.round((TENOR * pct) / 100);
  const early = TENOR - day;
  const fee = (FACE * RATE * early) / 365;
  const cash = FACE - fee;
  const setX = (x: number) => { const r = track.current.getBoundingClientRect(); setPct(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))); };
  useEffect(() => {
    const mv = (e: PointerEvent) => { if (drag.current) setX(e.clientX); };
    const up = () => { drag.current = false; };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    if (anime) {
      const o = { p: 100 };
      anime({ targets: o, p: 0, duration: 1500, delay: 600, easing: "cubicBezier(.2,1,.25,1)", update: () => { if (!drag.current) setPct(o.p); } });
      anime({ targets: "#vmcoin", translateY: [0, -8], rotate: [-7, 7], direction: "alternate", loop: true, duration: 2200, easing: "easeInOutSine" });
    }
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
  }, []);
  const M = (n: number) => (n / 1e3).toFixed(1);
  return (
    <div className={`${card} p-6 md:p-8`}>
      <div className="flex justify-between items-center mono text-[12px] font-bold uppercase tracking-wide mb-1">
        <span>INV-2042 · PT Maju Mall</span>
        <span className="inline-flex items-center gap-1.5 bg-lime border-2 border-ink px-2 py-0.5">● Verified</span>
      </div>
      <div className="mono text-[12px] text-inksoft mb-4">500,000 csprUSD invoice · due +90 days</div>

      <div className="text-inksoft mono text-[11px] font-bold uppercase tracking-wider">You receive now</div>
      <div className="slam flex items-baseline gap-1.5">
        <span className="display text-[clamp(20px,3vw,30px)]">$</span>
        <span className="mono font-bold leading-[.9] tabular-nums text-[clamp(58px,13vw,128px)]">{M(cash)}</span>
        <span className="display text-[clamp(26px,4vw,44px)]">K</span>
        <img id="vmcoin" src="/csprusd-coin.png" alt="csprUSD" className="self-center ml-2 w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-ink object-cover" draggable={false} />
      </div>

      {/* spatial: future invoice cash being pulled back to today */}
      <div className="relative h-11 mt-5">
        <div className="absolute left-2 right-12 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-ink/35" />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-ink rounded-full" />
        <span className="absolute left-0 -bottom-1 mono text-[8px] font-bold uppercase text-inksoft">today</span>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <span className="w-8 h-9 border-2 border-ink bg-white flex flex-col justify-center gap-[3px] px-1.5"><i className="h-[2px] bg-ink/40" /><i className="h-[2px] bg-ink/40 w-2/3" /><i className="h-[2px] bg-ink/40" /></span>
          <span className="mono text-[8px] font-bold uppercase text-inksoft leading-tight">invoice<br />+90d</span>
        </div>
        <img className="vflow vflow1" src="/csprusd-coin.png" alt="" aria-hidden draggable={false} />
        <img className="vflow vflow2" src="/csprusd-coin.png" alt="" aria-hidden draggable={false} />
        <img className="vflow vflow3" src="/csprusd-coin.png" alt="" aria-hidden draggable={false} />
      </div>

      <div ref={track} onPointerDown={(e) => { drag.current = true; setX(e.clientX); }} className="relative h-5 bg-bone2 border-2 border-ink cursor-ew-resize mt-3" style={{ touchAction: "none" }}>
        <div className="absolute left-0 top-0 bottom-0 bg-lime" style={{ width: pct + "%" }} />
        <div className="vm-knob absolute top-1/2 w-8 h-8 bg-lime border-2 border-ink shadow-hard2 cursor-grab" style={{ left: pct + "%", transform: "translate(-50%,-50%)" }} />
      </div>
      <div className="flex justify-between mono text-[10px] font-bold uppercase mt-1.5 text-inksoft"><span>◀ paid today</span><span>wait to due ▶</span></div>

      <div className="flex flex-wrap items-stretch gap-2.5 mt-6">
        <div className="border-2 border-ink px-3 py-1.5"><div className="mono text-[9px] font-bold uppercase text-inksoft">cash out</div><div className="font-semibold">{day === 0 ? "TODAY" : "+" + day + "d"}</div></div>
        <div className="border-2 border-ink px-3 py-1.5"><div className="mono text-[9px] font-bold uppercase text-inksoft">fee</div><div className="font-semibold mono">{((fee / FACE) * 100).toFixed(1)}%</div></div>
        <div className="border-2 border-ink bg-lime px-3 py-1.5"><div className="mono text-[9px] font-bold uppercase">investor yield</div><div className="font-semibold mono">7% APR</div></div>
        <button className={`${btnInk} ml-auto`}>Fund this →</button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="max-w-[1280px] mx-auto px-6 md:px-10 pt-12 pb-16">
      <div className="mono text-[12px] font-bold uppercase tracking-wider mb-6 inline-flex items-center gap-2"><span className="w-2.5 h-2.5 bg-lime border-2 border-ink" />Autonomous RWA financing · Casper</div>
      <h1 className="display uppercase leading-[.9] tracking-tight text-[clamp(52px,12.5vw,168px)] mb-9">
        <span className="block">Get paid</span>
        <span className="block w-fit bg-lime border-2 border-ink px-3 my-1.5">ninety days</span>
        <span className="block">early.</span>
      </h1>
      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 items-end">
        <div>
          <p className="text-[20px] md:text-[24px] font-medium max-w-[22ch] leading-[1.25]">An AI agent verifies, prices &amp; funds your invoices. <span className="bg-ink text-bone px-1.5">Drag the bar</span> — watch the cash land.</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/app/finance" className={btnLime}>Get paid now →</Link>
            <button className={btnInk}>Browse deals</button>
          </div>
          <div className="grid grid-cols-3 mt-10 border-2 border-ink divide-x-2 divide-ink max-w-[440px]">
            {([["$", 2.4, "M", "financed", 1], ["", 96, "%", "accuracy", 0], ["", 60, "s", "verify→fund", 0]] as any[]).map(([p, v, s, l], i) => (
              <div key={i} className="px-4 py-3">
                <CountUp prefix={p} to={v} suffix={s} className="display text-[26px] md:text-[30px]" />
                <div className="mono text-[10px] font-bold uppercase text-inksoft mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <ValueMachine />
      </div>
    </header>
  );
}

/* ---------- marquee ---------- */
function Marquee() {
  const phrase = "GET PAID EARLY ✦ NO WAITING ✦ AUTONOMOUS FINANCING ✦ REAL-WORLD YIELD ✦ ";
  return (
    <div className="bg-ink text-bone border-y-2 border-ink overflow-hidden py-4 select-none">
      <div className="marquee-track">
        <span className="display text-[26px] md:text-[34px] uppercase whitespace-pre">{phrase.repeat(6)}</span>
        <span className="display text-[26px] md:text-[34px] uppercase whitespace-pre">{phrase.repeat(6)}</span>
      </div>
    </div>
  );
}

/* ---------- immersive brand video band ---------- */
function ImmersiveVideo() {
  return (
    <section className="relative border-b-2 border-ink overflow-hidden bg-bone">
      <video className="vidzoom block w-full h-[55vh] md:h-[68vh] object-cover" autoPlay loop muted playsInline preload="metadata" poster="/brand-poster.jpg">
        <source src="/brand.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none" style={{ background: "linear-gradient(#F1EEE5,transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none" style={{ background: "linear-gradient(transparent,#F1EEE5)" }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
        <div className="bg-bone border-2 border-ink shadow-hard px-7 md:px-12 py-5 md:py-8 text-center">
          <h2 className="display uppercase leading-[.82] text-[clamp(34px,7.5vw,104px)]">Money<br />shouldn&apos;t wait<span className="text-lime">.</span></h2>
        </div>
      </div>
    </section>
  );
}

/* ---------- section wrapper ---------- */
function Section({ id, kicker, title, children }: any) {
  return (
    <section id={id} className="border-t-2 border-ink">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-20 md:py-28">
        {kicker && <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-6">{kicker}</div>}
        {title && <h2 className="display uppercase leading-[.92] text-[clamp(34px,6vw,80px)] max-w-[15ch] mb-12">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

/* ---------- §how · representational steps ---------- */
const STEPS = [
  { n: "01", t: "Drop the invoice", d: "The agent scans it and lifts out buyer, amount & due date." },
  { n: "02", t: "Verify & price", d: "Pays for OCR, registry & fraud data via x402, scores the risk." },
  { n: "03", t: "Fund & mint", d: "Capital pools in, the token mints, milestone one pays out." },
  { n: "04", t: "Release — itself", d: "On proof of delivery it unlocks each milestone on-chain." },
];
function StepMotif({ i }: any) {
  if (i === 0) return (
    <div className="relative h-16 border-2 border-ink bg-bone2 overflow-hidden">
      {[60, 80, 50].map((w, k) => <div key={k} className="h-1.5 bg-ink/30 mt-2 ml-2" style={{ width: w + "%" }} />)}
      <div className="absolute left-0 right-0 h-0.5 bg-ink" style={{ animation: "scanY 3.6s ease-in-out infinite" }} />
    </div>
  );
  if (i === 1) return (
    <div className="relative h-16 border-2 border-ink bg-bone2 flex items-center justify-center gap-4">
      <span className="w-6 h-6 bg-ink text-lime grid place-items-center font-bold">x</span>
      <span className="w-4 h-4 rounded-full bg-lime" style={{ ["--cx" as any]: "26px", ["--cy" as any]: "0px", animation: "coinShoot 2.8s ease-in infinite" }} />
      <span className="w-7 h-7 bg-lime border-2 border-ink grid place-items-center" style={{ animation: "popChk 2.8s ease-in-out infinite" }}><svg width="12" height="12" viewBox="0 0 8 8"><path d="M1 4l2 2 4-5" stroke="#0b0b0a" strokeWidth="1.6" fill="none" /></svg></span>
    </div>
  );
  if (i === 2) return (
    <div className="relative h-16 border-2 border-ink bg-bone2 flex items-end justify-center p-2 gap-2">
      {["55%", "78%", "40%"].map((h, k) => <div key={k} className="w-6 bg-lime border-2 border-ink self-end" style={{ ["--fh" as any]: h, height: 4, animation: `fillUp 3s ease-out ${k * 0.25}s infinite` }} />)}
    </div>
  );
  return (
    <div className="relative h-16 border-2 border-ink bg-bone2 flex items-center justify-center gap-3">
      {[0, 1, 2].map((k) => <span key={k} className="w-7 h-7 border-2 border-ink grid place-items-center" style={{ animation: `popChk 3.6s ease-in-out ${k * 0.5}s infinite` }}><svg width="12" height="12" viewBox="0 0 8 8"><path d="M1 4l2 2 4-5" stroke="#0b0b0a" strokeWidth="1.6" fill="none" /></svg></span>)}
    </div>
  );
}
function HowItWorks() {
  return (
    <Section id="how" kicker="How it works" title="The agent does the whole thing.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-ink divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-ink">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 90} className={`p-6 ${i === 1 ? "bg-lime" : "bg-bone"}`}>
            <div className="display text-[44px] leading-none">{s.n}</div>
            <StepMotif i={i} />
            <h3 className="display uppercase text-[20px] mt-4 leading-tight">{s.t}</h3>
            <p className="text-[14px] mt-2 leading-snug text-ink/80">{s.d}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------- §market · maturity ladder ---------- */
const DEALS = [
  { inv: "INV-3310", buyer: "Karya Logistik", tier: "high", days: 52, due: "Jul 30", funding: 139.5, yield: 15 },
  { inv: "PO-7781", buyer: "Sinar Retail", tier: "medium", days: 73, due: "Aug 20", funding: 210, yield: 12 },
  { inv: "INV-2042", buyer: "Maju Mall", tier: "low", days: 89, due: "Sep 05", funding: 465, yield: 7 },
];
const API = "http://localhost:8000";
const daysTo = (due: string) => Math.max(0, Math.round((new Date(due).getTime() - Date.now()) / 86400000));
const shortDue = (due: string) => { const d = new Date(due); return isNaN(d.getTime()) ? due : d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); };
function Market() {
  const [deals, setDeals] = useState<any[]>(DEALS);
  const [funded, setFunded] = useState<Record<string, boolean>>({});
  const ref = useRef<any>(null);
  useEffect(() => {
    fetch(API + "/marketplace").then((r) => r.json()).then((data) => {
      if (Array.isArray(data) && data.length) {
        const mapped = data.map((d: any) => ({ id: d.id, inv: d.invoice_number, buyer: d.buyer_name || "—", tier: d.risk_tier, days: daysTo(d.due_date), due: shortDue(d.due_date), yield: Math.round(d.yield_rate), status: d.status })).sort((a: any, b: any) => a.days - b.days);
        setDeals(mapped);
        setFunded(Object.fromEntries(mapped.filter((m: any) => m.status === "funded").map((m: any) => [m.id, true])));
      }
    }).catch(() => {});
  }, []);
  useEffect(() => { if (anime && ref.current) anime({ targets: ref.current.querySelectorAll(".mbar"), width: (el: any) => el.dataset.w + "%", easing: "cubicBezier(.2,1,.3,1)", duration: 1000, delay: anime.stagger(100) }); }, [deals]);
  async function fund(id: string) {
    setFunded((f) => ({ ...f, [id]: true }));
    try { await fetch(API + "/financing/" + id + "/fund", { method: "POST" }); } catch {}
  }
  return (
    <Section id="market" kicker="Marketplace" title="Pick when your cash comes back.">
      <div ref={ref} className="border-2 border-ink divide-y-2 divide-ink">
        {deals.slice(0, 6).map((d, i) => (
          <div key={d.id || d.inv} className="grid md:grid-cols-[180px_1fr_180px] gap-4 md:gap-6 items-center p-5 hover:bg-bone2 transition-colors">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                {d.id ? <Link href={`/app/deal/${d.id}`} className="mono font-bold underline-offset-2 hover:underline hover:text-lime">{d.inv}</Link> : <span className="mono font-bold">{d.inv}</span>}
                <span className={`mono text-[9px] font-bold uppercase border-2 border-ink px-1.5 py-0.5 ${tierChip[d.tier]}`}>{d.tier}</span>
              </div>
              <span className="text-[13px] text-inksoft">{d.buyer}</span>
            </div>
            <div>
              <div className="relative h-6 bg-bone2 border-2 border-ink overflow-hidden">
                <div className="mbar absolute left-0 top-0 bottom-0 bg-ink/80" data-w={(d.days / 120) * 100} style={{ width: 0 }} />
                <img src="/casper-coin.png" alt="" aria-hidden className="mcoin w-5 h-5 rounded-full border-2 border-ink object-cover" style={{ ["--mw" as any]: (d.days / 120) * 100 + "%", animationDelay: i * 0.7 + "s" }} />
              </div>
              <div className="flex justify-between mono text-[11px] font-bold uppercase mt-1.5 text-inksoft"><span>cash back in {d.days}d</span><span>{d.due}</span></div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-5">
              <div><div className="mono text-[9px] font-bold uppercase text-inksoft">yield</div><div className="display text-[24px] leading-none">{d.yield}%</div></div>
              {funded[d.id] ? (
                <span className="mono text-[12px] font-bold uppercase bg-ink text-bone px-3 py-2 whitespace-nowrap">Funded ✓</span>
              ) : (
                <button onClick={() => d.id && fund(d.id)} className="px-4 py-2 border-2 border-ink bg-lime font-semibold shadow-hard2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Fund</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- §portfolio · capital-return timeline ---------- */
const POS = [
  { d: 52, due: "Jul 30", amt: "+$21K" },
  { d: 73, due: "Aug 20", amt: "+$25K" },
  { d: 89, due: "Sep 05", amt: "+$35K" },
];
function Portfolio() {
  const [pos, setPos] = useState<any[]>(POS);
  const [stats, setStats] = useState<any[] | null>(null);
  useEffect(() => {
    fetch(API + "/marketplace").then((r) => r.json()).then((data: any) => {
      if (!Array.isArray(data)) return;
      const funded = data.filter((d: any) => d.status === "funded");
      if (!funded.length) return; // none funded yet → keep the demo
      const ps = funded.map((d: any) => ({ d: daysTo(d.due_date), due: shortDue(d.due_date), amt: "+$" + Math.round((d.expected_yield_amount || 0) / 1000) + "K" })).sort((a: any, b: any) => a.d - b.d);
      const deployed = funded.reduce((s: number, d: any) => s + (d.funding_amount || 0), 0);
      const yieldSum = funded.reduce((s: number, d: any) => s + (d.expected_yield_amount || 0), 0);
      const avgMat = ps.length ? Math.round(ps.reduce((s: number, p: any) => s + p.d, 0) / ps.length) : 0;
      setPos(ps);
      setStats([["Deployed", "$", deployed / 1000, "K", 1, "bg-bone"], ["Yield", "+$", yieldSum / 1000, "K", 1, "bg-lime"], ["Avg maturity", "", avgMat, "d", 0, "bg-bone"], ["Positions", "", funded.length, "", 0, "bg-bone"]]);
    }).catch(() => {});
  }, []);
  const statRows: any[] = stats || [["Deployed", "$", 814.5, "K", 1, "bg-bone"], ["Yield", "+$", 81.2, "K", 1, "bg-lime"], ["Avg maturity", "", 71, "d", 0, "bg-bone"], ["Positions", "", 3, "", 0, "bg-bone"]];
  return (
    <Section id="portfolio" kicker="For investors" title="Watch your money come home.">
      <Reveal className="border-2 border-ink bg-bone shadow-hard p-6 md:p-10 mb-8">
        <div className="flex justify-between mono text-[11px] font-bold uppercase text-inksoft mb-3"><span>● today</span><span>your capital returns →</span></div>
        <div className="relative h-[120px]">
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-ink" />
          <div className="absolute left-0 top-1/2 w-4 h-4 bg-ink rounded-full" style={{ transform: "translate(-50%,-50%)" }} />
          {pos.map((p, i) => (
            <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: Math.min(98, (p.d / 120) * 100) + "%", transform: "translate(-50%,-50%)" }}>
              <div className="mono text-[13px] font-bold whitespace-nowrap absolute -top-9">{p.amt}</div>
              <div className="w-10 h-10 bg-lime border-2 border-ink rounded-full grid place-items-center shadow-hard2" style={{ animation: `coinPulse 2.4s ease-in-out ${i * 0.3}s infinite` }}>
                <span className="mono font-bold text-[14px]">$</span>
              </div>
              <div className="mono text-[10px] font-bold whitespace-nowrap absolute -bottom-8 text-inksoft">{p.due} · {p.d}d</div>
            </div>
          ))}
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-4 border-2 border-ink divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-ink">
        {statRows.map(([l, p, v, s, dec, bg]: any, i: number) => (
          <div key={i} className={`p-6 ${bg}`}>
            <div className="mono text-[10px] font-bold uppercase text-inksoft">{l}</div>
            <CountUp key={String(v)} prefix={p} to={v} suffix={s} dec={dec} className="display text-[clamp(28px,3.4vw,40px)] leading-none mt-1" />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- §activity · AGENT CORE hub · live machine-to-machine economy ---------- */
const ICON: any = {
  registry: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0b0a" strokeWidth="1.6"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Z" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>),
  ocr: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0b0a" strokeWidth="1.6"><rect x="4" y="3" width="11" height="18" rx="1.5" /><path d="M7 8h5M7 12h3" strokeLinecap="round" /><circle cx="16" cy="16" r="3.2" /><path d="M18.4 18.4 21 21" strokeLinecap="round" /></svg>),
  fraud: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0b0a" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.4-3 7-7 8.5C8 18 5 15.4 5 11V6l7-3Z" /><path d="M9 11.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  pool: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0b0a" strokeWidth="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.4" /><ellipse cx="12" cy="11.5" rx="7" ry="2.4" /><ellipse cx="12" cy="17" rx="7" ry="2.4" /></svg>),
  supplier: (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0b0a" strokeWidth="1.6"><path d="M3 21V10l5 3.2V10l5 3.2V7l5 3.2V21Z" strokeLinejoin="round" /><path d="M3 21h18" strokeLinecap="round" /></svg>),
};
const NODES = [
  { k: "registry", x: 120, y: 90, label: "Registry" },
  { k: "ocr", x: 320, y: 58, label: "OCR" },
  { k: "fraud", x: 520, y: 90, label: "Fraud DB" },
  { k: "pool", x: 132, y: 392, label: "Pool" },
  { k: "supplier", x: 508, y: 392, label: "Supplier" },
];
const LINKS = [
  { d: "M320,210 Q210,140 126,98", s: [320, 210], amt: "0.02", img: "/csprusd-coin.png", delay: 0 },
  { d: "M320,210 Q320,140 320,66", s: [320, 210], amt: "0.02", img: "/csprusd-coin.png", delay: 0.55 },
  { d: "M320,210 Q430,140 514,98", s: [320, 210], amt: "0.02", img: "/csprusd-coin.png", delay: 1.1 },
  { d: "M140,384 Q230,300 314,214", s: [140, 384], amt: "$210K", img: "/casper-coin.png", delay: 1.7 },
  { d: "M320,214 Q420,300 500,384", s: [320, 214], amt: "$139.5K", img: "/casper-coin.png", delay: 2.3 },
];
const FALLBACK_ACTS = [
  { icon: "💸", message: "Paid 0.02 csprUSD via x402 — buyer registry lookup" },
  { icon: "✅", message: "Verified INV-2042 → risk LOW (82), priced 7% APR" },
  { icon: "🟢", message: "Investor funded PO-7781 — M1 auto-released" },
  { icon: "⭐", message: "Verifier online — 96% accuracy, 5,000 CSPR staked" },
];
function AgentHub() {
  const [acts, setActs] = useState<any[]>([]);
  useEffect(() => {
    let alive = true;
    const poll = () => fetch(API + "/agent/activity?limit=6").then((r) => r.json()).then((d: any) => { if (alive && Array.isArray(d) && d.length) setActs(d); }).catch(() => {});
    poll();
    const pid = setInterval(poll, 3500);
    return () => { alive = false; clearInterval(pid); };
  }, []);
  useEffect(() => {
    if (!anime) return;
    const anims: any[] = [];
    LINKS.forEach((l, i) => {
      const p = anime.path(`#hp${i}`);
      // travel along the wire (the part that worked before)
      anims.push(anime({ targets: `#coin${i}`, translateX: p("x"), translateY: p("y"), easing: "easeInOutSine", duration: 2800, delay: l.delay * 1000, loop: true }));
      // appear → hold → bounce → get sucked into the node, in lock-step (same 2800ms)
      anims.push(anime({
        targets: `#coinin${i}`,
        scale: [{ value: 1, duration: 2450 }, { value: 1.4, duration: 130, easing: "easeOutQuad" }, { value: 0, duration: 220, easing: "easeInBack" }],
        opacity: [{ value: 1, duration: 60 }, { value: 1, duration: 2520 }, { value: 0, duration: 220 }],
        delay: l.delay * 1000, loop: true,
      }));
    });
    return () => anims.forEach((a) => a.pause());
  }, []);
  return (
    <Section id="activity" kicker="Live agent core" title="It never stops working.">
      <p className="text-[16px] md:text-[19px] font-medium mb-10 max-w-[46ch]">The agent runs a tiny economy by itself — paying machines for data over <span className="font-bold">x402</span>, pooling capital, releasing cash. Watch the <span className="bg-lime border-2 border-ink px-1.5 mono text-[14px] font-bold">csprUSD</span> move.</p>
      <div className="overflow-x-hidden">
        <div className="hub-stage">
          <svg viewBox="0 0 640 480" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {LINKS.map((l, i) => (<path key={i} id={`hp${i}`} className="hub-link" d={l.d} />))}
          </svg>
          {NODES.map((n, i) => (
            <div key={n.k} className="hub-node" style={{ left: n.x, top: n.y }}>
              <span className="hub-ring" style={{ animationDelay: i * 0.6 + "s" }} />
              <span className="w-[66px] h-[66px] rounded-full bg-bone border-2 border-ink grid place-items-center shadow-hard2">{ICON[n.k]}</span>
              <span className="mono text-[9px] font-bold uppercase mt-2 whitespace-nowrap">{n.label}</span>
            </div>
          ))}
          {LINKS.map((l, i) => (
            <div key={i} id={`coin${i}`} className="hub-coin">
              <div id={`coinin${i}`} className="relative w-9 h-9 opacity-0">
                <div className="w-9 h-9 rounded-full border-2 border-ink overflow-hidden bg-bone">
                  <img src={l.img} alt="coin" className="w-full h-full object-cover" draggable={false} />
                </div>
                <span className="absolute top-[108%] left-1/2 -translate-x-1/2 mono text-[8px] font-bold bg-ink text-bone px-1 whitespace-nowrap">{l.amt}</span>
              </div>
            </div>
          ))}
          <div className="hub-core" style={{ left: 320, top: 210 }}>
            <span className="hub-corering" /><span className="hub-corering r2" />
            <span className="hub-live">● LIVE</span>
            <span className="relative z-10 w-[92px] h-[92px] rounded-[20px] bg-ink grid place-items-center shadow-hard">
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#BFF205" strokeWidth="1.6"><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M12 8V4M9.5 4h5" strokeLinecap="round" /><circle cx="9.2" cy="13.5" r="1.2" fill="#BFF205" stroke="none" /><circle cx="14.8" cy="13.5" r="1.2" fill="#BFF205" stroke="none" /></svg>
            </span>
            <span className="hub-corelabel">AGENT CORE</span>
          </div>
        </div>
      </div>
      <div className="mt-7 max-w-[680px] mx-auto border-2 border-ink bg-ink text-bone shadow-hard">
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-bone/20">
          <span className="flex items-center gap-2 mono text-[10px] font-bold uppercase tracking-wide text-lime"><span className="w-1.5 h-1.5 bg-lime rounded-full" />Live · agent activity</span>
          <span className="mono text-[10px] text-bone/40">aval-verifier</span>
        </div>
        {(acts.length ? acts : FALLBACK_ACTS).slice(0, 4).map((a: any, i: number) => (
          <div key={a.time ?? i} className="flex items-center gap-3 px-4 py-2.5 border-b border-bone/10 last:border-0" style={i === 0 ? { animation: "slamIn .5s cubic-bezier(.2,1,.3,1)" } : undefined}>
            <span className="text-[14px] shrink-0">{a.icon}</span>
            <span className="mono text-[11px] md:text-[12px] flex-1 leading-snug">{a.message}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- §trust ---------- */
function Trust() {
  return (
    <Section id="trust" kicker="Trust-minimized" title="An oracle with skin in the game.">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-stretch">
        <div className="border-2 border-ink bg-ink text-bone p-8 shadow-hard flex flex-col justify-between">
          <div className="mono text-[12px] font-bold uppercase tracking-wide text-lime">Aval Verifier · on-chain</div>
          <div className="flex items-baseline gap-2 my-6"><span className="display text-[clamp(70px,12vw,150px)] leading-[.8] text-lime">96</span><span className="display text-[40px]">%</span><span className="mono text-[12px] uppercase ml-2 self-end mb-3">accuracy<br />on 1,204 verdicts</span></div>
          <div className="grid grid-cols-2 gap-4 mono text-[13px]"><div className="border-2 border-bone/30 p-3"><div className="text-bone/50 text-[10px] uppercase font-bold">staked</div><div className="text-[20px] font-bold">5,000 CSPR</div></div><div className="border-2 border-bone/30 p-3"><div className="text-bone/50 text-[10px] uppercase font-bold">disputes</div><div className="text-[20px] font-bold text-lime">0</div></div></div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="border-2 border-ink bg-bone shadow-hard p-6">
            <div className="flex justify-between items-center mb-5">
              <span className="mono text-[11px] font-bold uppercase tracking-wide">Staked behind every verdict</span>
              <span className="mono text-[12px] font-bold bg-ink text-bone px-2.5 py-1">5,000 CSPR</span>
            </div>
            <div className="flex gap-3 justify-center py-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`stake-coin relative w-12 h-12 ${i === 2 ? "slash" : ""}`}>
                  <img src="/casper-coin.png" alt="" aria-hidden draggable={false} className="w-full h-full rounded-full border-2 border-ink object-cover" />
                  {i === 2 && <span className="slash-mark" />}
                  {i === 2 && <span className="slash-tag mono text-[8px] font-bold">SLASHED</span>}
                </div>
              ))}
            </div>
            <div className="flex justify-between mono text-[10px] font-bold uppercase mt-4 pt-3 border-t-2 border-ink/10">
              <span className="text-emerald">● honest → stake safe</span>
              <span className="text-crimson">✕ wrong → CSPR slashed</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[["Stake & slash", "wrong burns CSPR"], ["Public record", "soulbound reputation"], ["No double-spend", "every hash registered"]].map(([h, d], i) => (
              <div key={i} className="border-2 border-ink p-4 bg-bone">
                <div className="display uppercase text-[15px] leading-tight">{h}</div>
                <div className="mono text-[11px] text-inksoft mt-1.5">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- brand showcase band (generated hero key-visual) ---------- */
function BrandBand() {
  return (
    <section className="relative border-t-2 border-ink overflow-hidden bg-bone">
      <img src="/hero.png" alt="Aval — money in motion" draggable={false} className="block w-full h-[48vh] md:h-[62vh] object-cover" />
      <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none" style={{ background: "linear-gradient(#F1EEE5,transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none" style={{ background: "linear-gradient(transparent,#F1EEE5)" }} />
    </section>
  );
}

/* ---------- the stack · integrations strip ---------- */
const STACK = [
  { img: "/casper-coin.png", name: "Casper" },
  { img: "/csprusd-coin.png", name: "csprUSD" },
  { img: "/tokens/usdc.png", name: "Circle CCTP" },
  { img: "/logos/lifi.png", name: "Li.Fi" },
];
function StackStrip() {
  return (
    <section className="border-t-2 border-ink bg-bone">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <span className="mono text-[11px] font-bold uppercase tracking-[.22em] text-inksoft">The stack</span>
        {STACK.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <img src={s.img} alt={s.name} draggable={false} className="w-8 h-8 rounded-full border-2 border-ink object-cover bg-white" />
            <span className="mono text-[13px] font-bold uppercase">{s.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2.5">
          <span className="bg-ink text-bone mono text-[12px] font-bold px-2 py-1">x402</span>
          <span className="mono text-[13px] font-bold uppercase">micropayments</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- §cta + footer ---------- */
function CTA() {
  return (
    <Section id="cta" kicker="Casper Agentic Buildathon" title="Pick your side.">
      <div className="grid md:grid-cols-2 gap-0 border-2 border-ink divide-y-2 md:divide-y-0 md:divide-x-2 divide-ink">
        <div className="bg-lime p-9 md:p-12">
          <div className="mono text-[12px] font-bold uppercase tracking-wide">For suppliers</div>
          <h3 className="display uppercase text-[clamp(30px,4vw,52px)] leading-[.95] mt-3">Get paid<br />today.</h3>
          <Link href="/app/finance" className="inline-block mt-7 px-6 py-3.5 border-2 border-ink bg-ink text-bone font-semibold shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">Upload an invoice →</Link>
        </div>
        <div className="bg-ink text-bone p-9 md:p-12">
          <div className="mono text-[12px] font-bold uppercase tracking-wide text-lime">For investors</div>
          <h3 className="display uppercase text-[clamp(30px,4vw,52px)] leading-[.95] mt-3">Earn real<br />yield.</h3>
          <button className="mt-7 px-6 py-3.5 border-2 border-bone bg-lime text-ink font-semibold shadow-[4px_4px_0_#BFF205] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">Browse the market →</button>
        </div>
      </div>
      <footer className="flex flex-wrap justify-between items-center gap-4 mt-12 pt-8 border-t-2 border-ink">
        <div className="flex items-center gap-2.5"><img src="/logo-mark.png" alt="Aval" draggable={false} className="w-9 h-9" /><div className="display text-[30px]">AVAL<span className="text-lime">.</span></div></div>
        <div className="mono text-[12px] font-bold uppercase text-inksoft">Autonomous Verification & Lending · © 2026</div>
        <div className="mono text-[12px] font-bold uppercase border-2 border-ink px-3 py-1.5 inline-flex items-center gap-2"><span className="w-2 h-2 bg-lime border border-ink" />Casper testnet</div>
      </footer>
    </Section>
  );
}

/* ---------- page ---------- */
/* ---------- onboarding / loading screen ---------- */
const RAIN = [
  { img: "/csprusd-coin.png", left: "6%", size: 38, dur: 2.3, delay: 0 },
  { img: "/casper-coin.png", left: "16%", size: 28, dur: 2.9, delay: 0.7 },
  { img: "/tokens/eth.png", left: "27%", size: 34, dur: 2.5, delay: 1.3 },
  { img: "/tokens/usdc.png", left: "38%", size: 26, dur: 3.1, delay: 0.3 },
  { img: "/tokens/sol.png", left: "50%", size: 32, dur: 2.6, delay: 1.0 },
  { img: "/csprusd-coin.png", left: "61%", size: 28, dur: 2.4, delay: 0.5 },
  { img: "/tokens/bnb.png", left: "72%", size: 34, dur: 2.8, delay: 1.5 },
  { img: "/tokens/matic.png", left: "82%", size: 26, dur: 3.0, delay: 0.2 },
  { img: "/casper-coin.png", left: "91%", size: 30, dur: 2.5, delay: 0.9 },
  { img: "/tokens/btc.png", left: "45%", size: 24, dur: 3.2, delay: 1.8 },
];
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
function Loader() {
  const [gone, setGone] = useState(false); // initial render matches SSR → no hydration mismatch
  useIso(() => { if (typeof window !== "undefined" && sessionStorage.getItem("aval_booted")) setGone(true); }, []); // hide before paint on client re-mounts → no flicker
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("aval_booted")) return;
    const finish = () => { try { sessionStorage.setItem("aval_booted", "1"); } catch {} setGone(true); };
    if (!anime) { const t0 = setTimeout(finish, 400); return () => clearTimeout(t0); }
    anime({ targets: "#ldr-bar", width: ["0%", "100%"], easing: "easeInOutQuad", duration: 2400 });
    const o = { v: 0 };
    anime({ targets: o, v: 100, easing: "easeInOutQuad", duration: 2400, update: () => { const e = document.getElementById("ldr-pct"); if (e) e.textContent = String(Math.round(o.v)); } });
    anime({ targets: "#ldr-logo", scale: [1, 1.05], direction: "alternate", loop: true, duration: 1000, easing: "easeInOutSine" });
    const t = setTimeout(() => {
      anime.timeline({ complete: finish })
        .add({ targets: "#ldr-logo", scale: [1.05, 1.22, 1], duration: 440, easing: "easeOutBack" })
        .add({ targets: "#ldr-ring", scale: [0, 2.6], opacity: [0.55, 0], duration: 640, easing: "easeOutQuad" }, "-=320")
        .add({ targets: "#ldr", translateY: ["0%", "-100%"], duration: 760, easing: "cubicBezier(.7,0,.25,1)" }, "-=360");
    }, 2750);
    const safety = setTimeout(finish, 5200);
    return () => { clearTimeout(t); clearTimeout(safety); };
  }, []);
  if (gone) return null;
  return (
    <div id="ldr" className="fixed inset-0 z-[100] bg-bone flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {RAIN.map((c, i) => (
          <img key={i} src={c.img} alt="" aria-hidden draggable={false} className="ldr-coin rounded-full border-2 border-ink object-cover bg-white" style={{ left: c.left, width: c.size, height: c.size, animationDuration: c.dur + "s", animationDelay: c.delay + "s" }} />
        ))}
      </div>
      <div className="relative">
        <span id="ldr-ring" className="absolute inset-[-8px] rounded-full border-2 border-ink" style={{ opacity: 0 }} />
        <img id="ldr-logo" src="/logo-mark.png" alt="Aval" draggable={false} className="relative w-36 h-36 md:w-48 md:h-48" />
      </div>
      <div className="display uppercase text-[clamp(30px,5vw,56px)] mt-5 leading-none">Aval<span className="text-lime">.</span></div>
      <div className="mono text-[11px] font-bold uppercase tracking-[.22em] text-inksoft mt-3">Booting the autonomous verifier</div>
      <div className="w-[260px] md:w-[340px] h-4 border-2 border-ink mt-7 relative bg-bone2">
        <div id="ldr-bar" className="absolute left-0 top-0 bottom-0 bg-lime" style={{ width: "0%" }} />
      </div>
      <div className="mono text-[13px] font-bold mt-2.5">SETTLING · <span id="ldr-pct">0</span>%</div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative">
      <Loader />
      <div className="dotgrid fixed inset-0 -z-10 pointer-events-none" />
      <Nav />
      <Hero />
      <Marquee />
      <ImmersiveVideo />
      <HowItWorks />
      <Market />
      <Portfolio />
      <AgentHub />
      <Trust />
      <PayAnything />
      <BrandBand />
      <StackStrip />
      <CTA />
    </div>
  );
}
