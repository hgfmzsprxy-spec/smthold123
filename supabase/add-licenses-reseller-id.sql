-- Optional ownership column for reseller-generated licenses.
-- Run in the Supabase SQL Editor if /resell-panel reports:
--   column licenses.reseller_id does not exist
-- The API already falls back when this column is missing, but adding it
-- enables stronger ownership checks and cleaner inserts.

alter table public.licenses
  add column if not exists reseller_id text;

create index if not exists licenses_reseller_id_idx
  on public.licenses (reseller_id);
