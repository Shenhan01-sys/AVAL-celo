"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletContext";

const NAV = [
  { href: "/app", label: "Dashboard", icon: "◆", exact: true },
  { href: "/app/market", label: "Marketplace", icon: "▦" },
  { href: "/app/pools", label: "Pools", icon: "≋" },
  { href: "/app/portfolio", label: "Portfolio", icon: "▲" },
  { href: "/app/finance", label: "Finance invoice", icon: "＋" },
  { href: "/app/pay", label: "Pay invoice", icon: "↩" },
];

export default function Sidebar() {
  const path = usePathname();
  const { short, signOut } = useWallet();

  return (
    <aside className="w-[240px] shrink-0 border-r-2 border-ink bg-bone flex flex-col sticky top-0 self-start h-screen">
      <Link href="/" className="flex items-center gap-2.5 px-5 h-[64px] border-b-2 border-ink shrink-0">
        <img src="/logo-mark.png" alt="Aval" draggable={false} className="w-8 h-8" />
        <span className="display text-[24px] leading-none">AVAL<span className="text-lime">.</span></span>
      </Link>

      <nav className="p-3 flex flex-col gap-1.5">
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 mono text-[12px] font-bold uppercase tracking-wide border-2 transition-all ${
                active ? "border-ink bg-lime shadow-hard2" : "border-transparent hover:border-ink hover:bg-bone2"
              }`}
            >
              <span className="text-[13px] w-4 text-center">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t-2 border-ink flex flex-col gap-2">
        <div className="mono text-[10px] font-bold uppercase text-inksoft">Signed in</div>
        <div className="mono text-[12px] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime border border-ink" />
          {short || "—"}
        </div>
        <button
          onClick={signOut}
          className="mt-1 mono text-[11px] font-bold uppercase border-2 border-ink px-3 py-2 hover:bg-ink hover:text-bone transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
