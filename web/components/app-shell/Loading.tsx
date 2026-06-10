"use client";

// Branded Aval loading screen — used for the wallet-boot / connecting states
// (replaces the plain "Booting…" / "Connecting…" text).
export default function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-bone relative overflow-hidden">
      {/* faint coin rain (landing-page flavour) */}
      {[10, 28, 46, 64, 82, 92].map((x, i) => (
        <img
          key={i}
          src="/csprusd-coin.png"
          alt=""
          aria-hidden
          className="absolute w-9 h-9 rounded-full pointer-events-none"
          style={{ left: x + "%", top: -50, animation: `loadRain ${3.4 + (i % 3) * 0.8}s linear ${i * 0.5}s infinite` }}
        />
      ))}

      <div className="relative flex flex-col items-center gap-5">
        <img src="/logo-mark.png" alt="Aval" draggable={false} className="w-16 h-16" style={{ animation: "logoBob 1.6s ease-in-out infinite" }} />
        <div className="display text-[30px] leading-none">
          AVAL<span className="text-lime">.</span>
        </div>
        <div className="w-[180px] h-2.5 border-2 border-ink bg-bone2 overflow-hidden">
          <div className="h-full w-2/5 bg-lime" style={{ animation: "loadBar 1.1s ease-in-out infinite" }} />
        </div>
        <div className="mono text-[11px] font-bold uppercase tracking-[0.22em] text-inksoft">{label}…</div>
      </div>
    </div>
  );
}
