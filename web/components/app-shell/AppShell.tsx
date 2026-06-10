"use client";

import { ThemeProvider } from "styled-components";
import { ClickUI, CsprClickThemes, ThemeModeType } from "@make-software/csprclick-ui";
import { useWallet } from "@/components/wallet/WalletContext";
import Sidebar from "./Sidebar";
import ConnectGate from "./ConnectGate";
import Loading from "./Loading";

const MODE = ThemeModeType.light;
// CsprClickThemes is keyed by mode ({ light, dark }); fall back to the object itself just in case.
const scTheme = (CsprClickThemes as any)?.[MODE] ?? (CsprClickThemes as any);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { checked, isConnected } = useWallet();

  return (
    <ThemeProvider theme={scTheme}>
      <div id="aval-app-root" className="min-h-screen bg-bone">
        {/* CSPR.click top bar + all wallet modals live here */}
        <ClickUI themeMode={MODE} rootAppElement="#aval-app-root" />

        {!checked ? (
          <Loading label="Connecting wallet" />
        ) : !isConnected ? (
          <ConnectGate />
        ) : (
          <div className="flex items-stretch">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
