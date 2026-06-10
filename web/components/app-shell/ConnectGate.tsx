"use client";

import Link from "next/link";
import { useWallet } from "@/components/wallet/WalletContext";

export default function ConnectGate() {
  const { connect } = useWallet();
  return (
    <div className="min-h-[calc(100vh-0px)] grid place-items-center px-6 py-16">
      <div className="max-w-[540px] w-full text-center border-2 border-ink bg-bone shadow-hard p-8 md:p-12">
        <img src="/logo-mark.png" alt="" draggable={false} className="w-16 h-16 mx-auto mb-6" />
        <div className="inline-block mono text-[11px] font-bold uppercase tracking-wider bg-ink text-bone px-3 py-1 mb-5">
          Casper wallet
        </div>
        <h1 className="display uppercase text-[clamp(28px,5vw,46px)] leading-[.95] mb-4">
          Connect to
          <br />
          enter Aval<span className="text-lime">.</span>
        </h1>
        <p className="text-[15px] md:text-[16px] text-inksoft max-w-[44ch] mx-auto mb-8">
          Your wallet is your identity. One account does both — finance your invoices and fund other people&apos;s deals.
        </p>
        <button
          onClick={connect}
          className="px-7 py-4 border-2 border-ink bg-lime font-bold uppercase tracking-wide shadow-hard2 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
        >
          Connect wallet →
        </button>
        <div className="mt-6 mono text-[11px] text-inksoft">
          <Link href="/" className="underline hover:text-lime">
            ← back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
