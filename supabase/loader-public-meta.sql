-- Optional fallback if you do not want to use SUPABASE_SERVICE_ROLE_KEY in Next.js.
-- Allows anonymous read access to public loader metadata fields only.

alter table public.applications enable row level security;

drop policy if exists "Public loader metadata read" on public.applications;

create policy "Public loader metadata read"
on public.applications
for select
to anon, authenticated
using (true);
