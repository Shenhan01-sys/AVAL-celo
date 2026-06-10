import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** True once real Supabase credentials are present in .env.local. */
export const supabaseReady = Boolean(url && key && !url.includes("YOUR_PROJECT"));

// A client is always created so imports never crash; calls just fail softly when not configured.
export const supabase = createClient(url || "https://placeholder.supabase.co", key || "public-anon-key", {
  auth: { persistSession: false },
});

// ---- domain helpers (wallet = identity) ----------------------------------

export async function upsertUser(wallet: string, displayName?: string) {
  if (!supabaseReady || !wallet) return;
  try {
    await supabase
      .from("users_aval")
      .upsert({ wallet_address: wallet, display_name: displayName, last_seen: new Date().toISOString() }, { onConflict: "wallet_address" });
  } catch {
    /* soft-fail in demo */
  }
}

export async function recordListing(wallet: string, fin: any) {
  if (!supabaseReady || !wallet || !fin?.id) return;
  try {
    await supabase.from("listings_aval").upsert(
      {
        id: fin.id,
        wallet_address: wallet,
        invoice_number: fin.invoice_number,
        buyer_name: fin.buyer_name,
        amount: fin.amount,
        funding_amount: fin.funding_amount,
        yield_rate: fin.yield_rate,
        risk_tier: fin.risk_tier,
        status: fin.status || "published",
        due_date: fin.due_date,
      },
      { onConflict: "id" }
    );
  } catch {
    /* soft-fail */
  }
}

export async function recordPosition(wallet: string, fin: any) {
  if (!supabaseReady || !wallet || !fin?.id) return;
  try {
    await supabase.from("positions_aval").upsert(
      {
        wallet_address: wallet,
        financing_id: fin.id,
        invoice_number: fin.invoice_number,
        amount: fin.funding_amount,
        expected_yield: fin.expected_yield_amount,
        due_date: fin.due_date ?? null,
        yield_rate: fin.yield_rate ?? null,
        status: "funded",
      },
      { onConflict: "wallet_address,financing_id" }
    );
  } catch {
    /* soft-fail */
  }
}

export async function getPositions(wallet: string) {
  if (!supabaseReady || !wallet) return [];
  try {
    const { data } = await supabase.from("positions_aval").select("*").eq("wallet_address", wallet).order("created_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function getListings(wallet: string) {
  if (!supabaseReady || !wallet) return [];
  try {
    const { data } = await supabase.from("listings_aval").select("*").eq("wallet_address", wallet).order("created_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}
