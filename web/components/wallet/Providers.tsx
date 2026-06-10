"use client";

import { useEffect, useState } from "react";
import { ClickProvider } from "@make-software/csprclick-ui";
import { CONTENT_MODE } from "@make-software/csprclick-core-types";
import { WalletStateProvider } from "./WalletStateProvider";
import Loading from "@/components/app-shell/Loading";

const clickOptions = {
  appName: "Aval",
  // 'csprclick-template' is the official local-dev placeholder; swap for your own appId in prod.
  appId: process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID || "csprclick-template",
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "metamask-snap", "casperdash"],
};

/** Client-only boundary: the CSPR.click runtime touches window, so we mount it after hydration. */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Loading label="Starting Aval" />;

  return (
    <ClickProvider options={clickOptions as any}>
      <WalletStateProvider>{children}</WalletStateProvider>
    </ClickProvider>
  );
}
