-- IMPORTANT: Do NOT scan screenshots::text — that detoasts multi‑MB rows and kills the SQL Editor.
-- Use pg_column_size(), then clear ONE row per run.

-- 1) Find one heavy row (cheap)
select
  id,
  created_at,
  pg_column_size(screenshots) as bytes
from public.protection_logs
where screenshots is not null
  and pg_column_size(screenshots) > 10000
order by pg_column_size(screenshots) desc
limit 5;

-- 2) Clear screenshots for ONE id from the result above (replace the uuid)
-- update public.protection_logs
-- set screenshots = '[]'::jsonb
-- where id = 'PASTE-UUID-HERE';

-- 3) Or clear the single heaviest row in one shot (still only 1 row)
update public.protection_logs
set screenshots = '[]'::jsonb
where id = (
  select id
  from public.protection_logs
  where screenshots is not null
    and pg_column_size(screenshots) > 10000
  order by pg_column_size(screenshots) desc
  limit 1
);

-- Repeat step 3 until it says UPDATE 0 / Success with no row.

-- If even step 1 times out, wipe recent logs instead (small deletes):
-- delete from public.protection_logs
-- where id = (
--   select id from public.protection_logs
--   order by created_at desc nulls last
--   limit 1
-- );

-- Nuclear (only if you accept losing all protection logs):
-- truncate table public.protection_logs;
