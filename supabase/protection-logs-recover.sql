-- RECOVERY ONLY — run THIS alone in SQL Editor (one statement at a time).
-- Do NOT paste protection-logs.sql while the table is full of base64 screenshots.

-- Step 1 (preferred): wipe rows + TOAST blobs. Run alone.
truncate table public.protection_logs;

-- Step 2: if Step 1 still times out, drop the table entirely. Run alone.
-- drop table if exists public.protection_logs cascade;

-- Step 3: AFTER truncate/drop succeeds, recreate empty table (no storage policies here).
create table if not exists public.protection_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  success boolean not null default true,
  message text not null default '',
  application text not null default '',
  app_id text not null default '',
  reseller_id text not null default '',
  reseller text not null default '',
  discord_username text not null default '',
  discord_avatar_url text not null default '',
  discord_user_id text not null default '',
  discord_email text not null default '',
  license_key text not null default '',
  product_variant text not null default '',
  expires_at timestamptz null,
  expiration text not null default '',
  time_left text not null default '',
  hwid text not null default '',
  screenshots jsonb not null default '[]'::jsonb
);

create index if not exists protection_logs_created_at_idx on public.protection_logs (created_at desc);
create index if not exists protection_logs_app_id_idx on public.protection_logs (app_id);
create index if not exists protection_logs_reseller_id_idx on public.protection_logs (reseller_id);

alter table public.protection_logs enable row level security;

drop policy if exists "protection_logs_anon_insert" on public.protection_logs;
create policy "protection_logs_anon_insert"
  on public.protection_logs
  for insert
  to anon, authenticated
  with check (true);
