-- Reseller Store products (admin Reselling → Products)
-- Run in Supabase → SQL Editor.

create table if not exists public.reseller_store_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  price_label text,
  variant_label text not null default 'One-Time',
  product_id bigint not null,
  variant_id bigint not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reseller_store_products_sort_order_idx
  on public.reseller_store_products (sort_order);

alter table public.reseller_store_products enable row level security;

-- No anon/authenticated policies: only service_role (server API) can read/write.

insert into public.reseller_store_products (
  slug, name, description, price, price_label, variant_label, product_id, variant_id, sort_order
)
values
  (
    'loader-rebrand',
    'Loader Rebrand',
    'A fully rebranded web-remote Loader tailored for your reseller brand. It will only include the products you currently resell, so your customers get a clean, white-labeled delivery experience.',
    149.99,
    '$149.99',
    'One-Time',
    804671,
    1376598,
    0
  ),
  (
    'cheat-menu-rebrand',
    'Cheat Menu Rebrand',
    'Rebrand a single cheat menu exclusively for your brand. Ideal when you need a polished custom UI for one product without rebuilding the full loader stack.',
    249.99,
    '$249.99',
    'One-Time',
    804668,
    1376593,
    1
  ),
  (
    'bundle-rebrand-vip',
    'Bundle Rebrand (VIP)',
    'Full VIP rebrand package: custom Loader plus three cheat menu rebrands. Best value when you want a complete white-labeled reseller toolkit in one order.',
    699.99,
    '$699.99',
    'VIP Bundle',
    804674,
    1376603,
    2
  ),
  (
    'custom-license-format',
    'Custom License(s) Format',
    'Customize how license keys are generated and displayed for your customers — prefixes, segments, separators, and formatting rules that match your brand workflow.',
    29.99,
    '$29.99',
    'One-Time',
    804679,
    1376608,
    3
  ),
  (
    'discord-bot-auth',
    'Discord Bot Auth',
    'Generate license keys directly from Discord and optionally grant support staff permission to create keys. Streamlines delivery and ticket handling inside your server.',
    74.99,
    '$74.99',
    'One-Time',
    804684,
    1376613,
    4
  )
on conflict (slug) do nothing;
