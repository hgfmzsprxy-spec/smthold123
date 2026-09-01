-- Application license variants (admin Applications → Edit Variants)
-- Run in Supabase → SQL Editor.
--
-- Note (Permanent Spoofer):
--   One-Time License  → duration 24 hours
--   Lifetime License  → unlimited

create table if not exists public.application_variants (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  slug text not null,
  label text not null,
  price numeric(12, 2) not null default 0,
  duration_value integer null,
  duration_unit text not null default 'days',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_variants_duration_unit_check
    check (duration_unit in ('minutes', 'hours', 'days', 'weeks', 'months', 'unlimited')),
  constraint application_variants_price_check check (price >= 0),
  constraint application_variants_app_slug_unique unique (application_id, slug)
);

create index if not exists application_variants_application_id_idx
  on public.application_variants (application_id, sort_order);

alter table public.application_variants enable row level security;

-- No anon/authenticated policies: only service_role (server API) can read/write.

-- Seed helpers: insert variants for an app matched by app_id (preferred) or name.
-- Safe to re-run: skips existing (application_id, slug) pairs.

create or replace function public._seed_application_variants(
  p_app_id text,
  p_name_match text,
  p_variants jsonb
)
returns void
language plpgsql
as $$
declare
  v_app_id uuid;
  v_item jsonb;
  v_idx integer := 0;
begin
  select a.id
  into v_app_id
  from public.applications a
  where (p_app_id is not null and a.app_id = p_app_id)
     or (p_name_match is not null and lower(a.name) like lower(p_name_match))
  order by
    case when p_app_id is not null and a.app_id = p_app_id then 0 else 1 end,
    a.created_at asc nulls last
  limit 1;

  if v_app_id is null then
    return;
  end if;

  for v_item in select * from jsonb_array_elements(p_variants)
  loop
    insert into public.application_variants (
      application_id,
      slug,
      label,
      price,
      duration_value,
      duration_unit,
      sort_order,
      active
    )
    values (
      v_app_id,
      coalesce(nullif(trim(v_item->>'slug'), ''), 'variant-' || v_idx::text),
      coalesce(nullif(trim(v_item->>'label'), ''), 'Variant'),
      greatest(0, coalesce((v_item->>'price')::numeric, 0)),
      case
        when lower(coalesce(v_item->>'duration_unit', 'days')) = 'unlimited' then null
        else nullif(v_item->>'duration_value', '')::integer
      end,
      lower(coalesce(nullif(trim(v_item->>'duration_unit'), ''), 'days')),
      coalesce((v_item->>'sort_order')::integer, v_idx),
      true
    )
    on conflict (application_id, slug) do update
      set
        label = excluded.label,
        price = excluded.price,
        duration_value = excluded.duration_value,
        duration_unit = excluded.duration_unit,
        sort_order = excluded.sort_order,
        updated_at = now();

    v_idx := v_idx + 1;
  end loop;
end;
$$;

-- Permanent Spoofer (One-Time = 24h, Lifetime = unlimited)
select public._seed_application_variants(
  '49a4f8ea0801ead8',
  '%permanent%spoofer%',
  '[
    {"slug":"one-time","label":"One-Time License","price":14.99,"duration_value":24,"duration_unit":"hours","sort_order":0},
    {"slug":"lifetime","label":"Lifetime License","price":29.99,"duration_value":null,"duration_unit":"unlimited","sort_order":1}
  ]'::jsonb
);

-- Temporary Spoofer
select public._seed_application_variants(
  '9eda42f5237ca930',
  '%temporary%spoofer%',
  '[
    {"slug":"1-day","label":"1 Day License","price":4.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"7-days","label":"7 Days License","price":19.99,"duration_value":7,"duration_unit":"days","sort_order":1},
    {"slug":"30-days","label":"30 Days License","price":49.99,"duration_value":30,"duration_unit":"days","sort_order":2},
    {"slug":"90-days","label":"90 Days License","price":99.99,"duration_value":90,"duration_unit":"days","sort_order":3}
  ]'::jsonb
);

-- Call of Duty
select public._seed_application_variants(
  'c3712051cd0d8efe',
  '%call%of%duty%',
  '[
    {"slug":"1-day","label":"1 Day License","price":4.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"7-days","label":"7 Days License","price":14.99,"duration_value":7,"duration_unit":"days","sort_order":1},
    {"slug":"30-days","label":"30 Days License","price":39.99,"duration_value":30,"duration_unit":"days","sort_order":2},
    {"slug":"lifetime","label":"Lifetime License","price":99.99,"duration_value":null,"duration_unit":"unlimited","sort_order":3}
  ]'::jsonb
);

-- Apex Legends
select public._seed_application_variants(
  '2b635880eaad98a4',
  '%apex%legends%',
  '[
    {"slug":"1-day","label":"1 Day License","price":4.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"7-days","label":"7 Days License","price":14.99,"duration_value":7,"duration_unit":"days","sort_order":1},
    {"slug":"30-days","label":"30 Days License","price":39.99,"duration_value":30,"duration_unit":"days","sort_order":2},
    {"slug":"lifetime","label":"Lifetime License","price":99.99,"duration_value":null,"duration_unit":"unlimited","sort_order":3}
  ]'::jsonb
);

-- Fortnite Private
select public._seed_application_variants(
  '1c4ff4689590600f',
  '%fortnite%',
  '[
    {"slug":"1-day","label":"1 Day License","price":5.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"7-days","label":"7 Days License","price":19.99,"duration_value":7,"duration_unit":"days","sort_order":1},
    {"slug":"30-days","label":"30 Days License","price":39.99,"duration_value":30,"duration_unit":"days","sort_order":2},
    {"slug":"lifetime","label":"Lifetime License","price":99.99,"duration_value":null,"duration_unit":"unlimited","sort_order":3}
  ]'::jsonb
);

-- KBM Aim Assist / Controller Emulator
select public._seed_application_variants(
  'c431f619947d6858',
  '%aim%assist%',
  '[
    {"slug":"7-days","label":"7 Days License","price":19.99,"duration_value":7,"duration_unit":"days","sort_order":0},
    {"slug":"30-days","label":"30 Days License","price":29.99,"duration_value":30,"duration_unit":"days","sort_order":1},
    {"slug":"365-days","label":"365 Days License","price":89.99,"duration_value":365,"duration_unit":"days","sort_order":2}
  ]'::jsonb
);

-- Rainbow Six Lite (match by name; no fixed app_id in loader map)
select public._seed_application_variants(
  null,
  '%rainbow%six%lite%',
  '[
    {"slug":"1-day","label":"1 Day","price":9.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"3-days","label":"3 Days","price":14.99,"duration_value":3,"duration_unit":"days","sort_order":1},
    {"slug":"1-week","label":"1 Week","price":24.99,"duration_value":1,"duration_unit":"weeks","sort_order":2},
    {"slug":"1-month","label":"1 Month","price":39.99,"duration_value":1,"duration_unit":"months","sort_order":3}
  ]'::jsonb
);

-- Rainbow Six Premium
select public._seed_application_variants(
  null,
  '%rainbow%six%premium%',
  '[
    {"slug":"1-day","label":"1 Day","price":14.99,"duration_value":1,"duration_unit":"days","sort_order":0},
    {"slug":"3-days","label":"3 Days","price":24.99,"duration_value":3,"duration_unit":"days","sort_order":1},
    {"slug":"1-week","label":"1 Week","price":39.99,"duration_value":1,"duration_unit":"weeks","sort_order":2},
    {"slug":"1-month","label":"1 Month","price":59.99,"duration_value":1,"duration_unit":"months","sort_order":3}
  ]'::jsonb
);

drop function if exists public._seed_application_variants(text, text, jsonb);
