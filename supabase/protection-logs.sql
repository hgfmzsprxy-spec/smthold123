-- Protection / loader auth logs (written by loaders via anon key, read by admin service role).
--
-- WARNING: If this table already has huge base64 screenshots, do NOT re-run this file
-- in the SQL Editor (CREATE INDEX / DDL will connection-timeout).
-- Recover with: supabase/protection-logs-recover.sql  (truncate/drop first, one statement at a time).
--
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

alter table public.protection_logs
  add column if not exists screenshots jsonb not null default '[]'::jsonb;

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

-- Screenshot storage (private). Loaders upload with anon key; admin reads via signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'protection-screenshots',
  'protection-screenshots',
  false,
  15728640,
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "protection_screenshots_anon_insert" on storage.objects;
create policy "protection_screenshots_anon_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'protection-screenshots');

drop policy if exists "protection_screenshots_anon_update" on storage.objects;
create policy "protection_screenshots_anon_update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'protection-screenshots')
  with check (bucket_id = 'protection-screenshots');

-- No anon select — admin API uses service role for signed URLs.
