-- Shrink protection_logs rows that embedded multi‑MB base64 in screenshots jsonb.
-- Run once in Supabase SQL Editor. Keeps monitor/path/size metadata; drops data/b64/base64 keys.

update public.protection_logs
set screenshots = (
  select coalesce(
    jsonb_agg(
      (elem - 'data' - 'b64' - 'base64')
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(screenshots, '[]'::jsonb)) as elem
)
where screenshots is not null
  and jsonb_typeof(screenshots) = 'array'
  and screenshots::text ~ '"data"|"b64"|"base64"';
