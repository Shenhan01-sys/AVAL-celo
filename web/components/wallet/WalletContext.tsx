"use client";

// Context + hook ONLY — no CSPR.click import here, so pages can import useWallet()
// without dragging the wallet SDK (which touches window) into the server bundle.

import { createContext, useContext } from "react";

export type WalletCtxValue = {
  address: string | null;
  isConnected: boolean;
  checked: boolean; // first session probe finished — avoids a gate flash for returning users
  short: string;
  connect: () => void;
  signOut: () => void;
};

export const WalletContext = createContext<WalletCtxValue>({
  address: null,
  isConnected: false,
  checked: false,
  short: "",
  connect: () => {},
  signOut: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const shorten = (a?: string | null) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
