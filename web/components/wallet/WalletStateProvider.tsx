"use client";

// The stateful half — imports the CSPR.click hook. Only ever mounted inside AppRoot,
// which the layout loads with next/dynamic ssr:false, so this never runs on the server.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClickRef } from "@make-software/csprclick-ui";
import { upsertUser } from "@/lib/supabase";
import { WalletContext, shorten } from "./WalletContext";

// Exact event names from @make-software/csprclick-core-types (CSPRCLICK_EVENTS).
const EV = {
  LOADED: "csprclick:loaded",
  SIGNED_IN: "csprclick:signed_in",
  SWITCHED_ACCOUNT: "csprclick:switched_account",
  SWITCH_ACCOUNT: "csprclick:switch_account",
  UNSOLICITED: "csprclick:unsolicited_account_change",
  SIGNED_OUT: "csprclick:signed_out",
  DISCONNECTED: "csprclick:disconnected",
};

export function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const clickRef = useClickRef();
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Read the active key robustly: sync account first, then the async public-key call.
  const readKey = useCallback(async (): Promise<string | null> => {
    if (!clickRef) return null;
    try {
      const acc = clickRef.getActiveAccount?.();
      if (acc?.public_key) return acc.public_key;
    } catch {
      /* ignore */
    }
    try {
      const pk = await clickRef.getActivePublicKey?.();
      return pk || null;
    } catch {
      return null;
    }
  }, [clickRef]);

  const refresh = useCallback(
    async (redirectOnConnect = false) => {
      const pk = await readKey();
      setAddress(pk);
      setChecked(true);
      if (pk) {
        upsertUser(pk);
        if (redirectOnConnect) router.push("/app"); // land on the dashboard after a fresh sign-in
      }
    },
    [readKey, router]
  );

  useEffect(() => {
    if (!clickRef) return;
    refresh();

    const onSync = () => refresh(false); // load / account switch → update silently
    const onSignedIn = () => refresh(true); // fresh sign-in → go to dashboard
    const onOut = () => {
      setAddress(null);
      setChecked(true);
    };

    clickRef.on?.(EV.LOADED, onSync);
    clickRef.on?.(EV.SIGNED_IN, onSignedIn);
    clickRef.on?.(EV.SWITCHED_ACCOUNT, onSync);
    clickRef.on?.(EV.SWITCH_ACCOUNT, onSync);
    clickRef.on?.(EV.UNSOLICITED, onSync);
    clickRef.on?.(EV.SIGNED_OUT, onOut);
    clickRef.on?.(EV.DISCONNECTED, onOut);

    return () => {
      try {
        clickRef.removeListener?.(EV.LOADED, onSync);
        clickRef.removeListener?.(EV.SIGNED_IN, onSignedIn);
        clickRef.removeListener?.(EV.SWITCHED_ACCOUNT, onSync);
        clickRef.removeListener?.(EV.SWITCH_ACCOUNT, onSync);
        clickRef.removeListener?.(EV.UNSOLICITED, onSync);
        clickRef.removeListener?.(EV.SIGNED_OUT, onOut);
        clickRef.removeListener?.(EV.DISCONNECTED, onOut);
      } catch {
        /* best-effort teardown */
      }
    };
  }, [clickRef, refresh]);

  const connect = useCallback(() => {
    try {
      clickRef?.signIn();
    } catch {
      /* ignore */
    }
  }, [clickRef]);

  const signOut = useCallback(() => {
    try {
      clickRef?.signOut();
    } catch {
      /* ignore */
    }
    setAddress(null);
  }, [clickRef]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        checked: checked && !!clickRef,
        short: shorten(address),
        connect,
        signOut,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
