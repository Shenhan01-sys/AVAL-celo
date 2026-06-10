-- Aval — Supabase schema (run in the SQL editor of project dreexbadvlxufkrvvwrq)
-- NOTE: this DB is SHARED, so every Aval table is suffixed _aval to avoid collisions.
-- Wallet = identity (no Supabase Auth session); roles are dynamic (every user can supply AND invest).

create table if not exists users_aval (
  wallet_address text primary key,
  display_name   text,
  created_at     timestamptz not null default now(),
  last_seen      timestamptz not null default now()
);

-- invoices/POs a wallet has uploaded for financing
create table if not exists listings_aval (
  id             text primary key,            -- financing_id from the agent (fin_0001…)
  wallet_address text references users_aval(wallet_address),
  invoice_number text,
  buyer_name     text,
  amount         numeric,
  funding_amount numeric,
  yield_rate     numeric,
  risk_tier      text,
  status         text default 'published',
  due_date       text,
  created_at     timestamptz not null default now()
);

-- deals a wallet has funded (its investment positions)
create table if not exists positions_aval (
  wallet_address text references users_aval(wallet_address),
  financing_id   text,
  invoice_number text,
  amount         numeric,
  expected_yield numeric,
  status         text default 'funded',
  created_at     timestamptz not null default now(),
  primary key (wallet_address, financing_id)
);

-- Demo posture: wallet-as-identity can't be enforced row-level without a signed session,
-- so RLS is left permissive. Tighten with a SIWC (sign-in-with-Casper) JWT before production.
alter table users_aval     enable row level security;
alter table listings_aval  enable row level security;
alter table positions_aval enable row level security;

do $$ begin
  create policy "aval demo all" on users_aval     for all using (true) with check (true);
  create policy "aval demo all" on listings_aval  for all using (true) with check (true);
  create policy "aval demo all" on positions_aval for all using (true) with check (true);
exception when duplicate_object then null; end $$;
