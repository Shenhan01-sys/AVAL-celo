"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, supabaseReady } from "./supabase";

/**
 * Supabase Realtime presence + broadcast on a named channel.
 * - `online`: distinct connected clients (each tab/user counts).
 * - `events`: recent broadcast activity (newest first).
 * - `broadcast(payload)`: send an "activity" event to everyone (incl. self).
 * Presence/broadcast are ephemeral — no DB table or RLS needed, just the anon key.
 */
export function useLiveChannel(name: string, selfLabel: string) {
  const [online, setOnline] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const chanRef = useRef<any>(null);

  useEffect(() => {
    if (!supabaseReady) return;
    const presenceKey = "u" + Math.random().toString(36).slice(2, 9);
    const channel = supabase.channel(name, { config: { presence: { key: presenceKey }, broadcast: { self: true } } });

    channel
      .on("presence", { event: "sync" }, () => {
        try {
          setOnline(Object.keys(channel.presenceState()).length || 1);
        } catch {
          /* ignore */
        }
      })
      .on("broadcast", { event: "activity" }, ({ payload }: any) => {
        setEvents((e) => [payload, ...e].slice(0, 12));
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ label: selfLabel, at: Date.now() });
          } catch {
            /* ignore */
          }
        }
      });

    chanRef.current = channel;
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
    };
  }, [name, selfLabel]);

  const broadcast = (payload: any) => {
    try {
      chanRef.current?.send({ type: "broadcast", event: "activity", payload });
    } catch {
      /* ignore */
    }
  };

  return { online, events, broadcast };
}
