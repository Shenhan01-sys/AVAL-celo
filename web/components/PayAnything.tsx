"use client";

import dynamic from "next/dynamic";

// Li.Fi widget is client-only (uses browser APIs) → load without SSR.
const LiFiWidget = dynamic(
  () => import("@lifi/widget").then((m) => m.LiFiWidget),
  { ssr: false, loading: () => <div className="h-[580px] grid place-items-center bg-white mono text-inksoft text-sm">Loading cross-chain swap…</div> }
);

// Casper isn't on Li.Fi's chain list, so the widget's job is the FRONT hop:
// route any token on any chain → USDC (here on Arbitrum). The agent does the
// last mile (USDC → csprUSD on Casper via Circle CCTP).
const config: any = {
  variant: "compact",
  appearance: "light",
  theme: {
    palette: {
      primary: { main: "#0B0B0A" },
      secondary: { main: "#BFF205" },
      background: { default: "#FFFFFF", paper: "#FFFFFF" },
      text: { primary: "#0B0B0A", secondary: "#6B6862" },
    },
    shape: { borderRadius: 2, borderRadiusSecondary: 2 },
    typography: { fontFamily: "var(--font-hanken), sans-serif" },
  },
  toChain: 42161, // Arbitrum
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // native USDC on Arbitrum
};

const STEPS: [string, string, string][] = [
  ["01", "Pay with anything", "ETH, SOL, USDC, BNB — any token on any chain you already hold."],
  ["02", "Li.Fi routes it", "Best route across bridges & DEXs converts it to USDC in one click."],
  ["03", "Agent settles on Casper", "It bridges to csprUSD (Circle CCTP) and funds your deal — autonomously."],
];

const TOKENS = ["eth", "sol", "usdc", "usdt", "bnb", "matic", "avax", "dai", "btc", "xrp", "ltc", "trx"];

export default function PayAnything() {
  return (
    <section id="pay" className="border-t-2 border-ink">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="inline-block mono text-[12px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-6">Frictionless onboarding · Li.Fi</div>
        <h2 className="display uppercase leading-[.92] text-[clamp(34px,6vw,76px)] max-w-[14ch] mb-8">Pay with any coin, anywhere.</h2>
        <div className="flex items-center gap-2.5 flex-wrap mb-12">
          <span className="mono text-[12px] font-bold uppercase text-inksoft mr-1">Any of these</span>
          {TOKENS.map((t, i) => (
            <img key={t} src={`/tokens/${t}.png`} alt={t} draggable={false} className="token-bob w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-ink bg-white p-1" style={{ animationDelay: i * 0.18 + "s" }} />
          ))}
          <span className="display text-[26px] mx-1">→</span>
          <img src="/csprusd-coin.png" alt="csprUSD" draggable={false} className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-ink object-cover" />
          <span className="bg-lime border-2 border-ink px-2.5 py-1 mono text-[13px] font-bold">csprUSD</span>
        </div>
        <div className="grid lg:grid-cols-[1fr_440px] gap-12 items-start">
          <div className="flex flex-col gap-4">
            {STEPS.map(([n, t, d], i) => (
              <div key={n} className={`flex gap-5 p-5 border-2 border-ink ${i === 1 ? "bg-lime" : "bg-bone"}`}>
                <span className="display text-[42px] leading-none">{n}</span>
                <div>
                  <h3 className="display uppercase text-[22px] leading-tight">{t}</h3>
                  <p className="text-[15px] mt-1.5 text-ink/80 leading-snug">{d}</p>
                </div>
              </div>
            ))}
            <p className="mono text-[12px] text-inksoft mt-1 leading-relaxed">⚠ Li.Fi doesn&apos;t list Casper yet — the widget does the front hop (any token → USDC); the agent bridges the last mile via Circle CCTP. csprUSD is on testnet.</p>
          </div>
          <div className="border-2 border-ink shadow-hard bg-white overflow-hidden">
            <LiFiWidget integrator="aval-casper" config={config} />
          </div>
        </div>
      </div>
    </section>
  );
}
