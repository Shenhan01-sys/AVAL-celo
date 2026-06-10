"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/app-shell/Loading";

// Client-only: the wallet shell pulls in the CSPR.click SDK, which is not SSR-safe.
const AppRoot = dynamic(() => import("@/components/app-shell/AppRoot"), {
  ssr: false,
  loading: () => <Loading label="Starting Aval" />,
});

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppRoot>{children}</AppRoot>;
}
