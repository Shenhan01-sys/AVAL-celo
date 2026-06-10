"use client";

import Providers from "@/components/wallet/Providers";
import AppShell from "./AppShell";

// Everything that touches the CSPR.click SDK lives under here. The layout loads this
// with next/dynamic ssr:false so the SDK (which references window) never hits the server.
export default function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
