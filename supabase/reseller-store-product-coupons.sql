-- Coupons / keys for reseller store products (admin Products → key icon)
-- Run in Supabase → SQL Editor.

create table if not exists public.reseller_store_product_coupons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.reseller_store_products (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint reseller_store_product_coupons_code_not_blank check (length(trim(code)) > 0),
  constraint reseller_store_product_coupons_product_code_unique unique (product_id, code)
);

create index if not exists reseller_store_product_coupons_product_id_idx
  on public.reseller_store_product_coupons (product_id);

create index if not exists reseller_store_product_coupons_code_idx
  on public.reseller_store_product_coupons (code);

alter table public.reseller_store_product_coupons enable row level security;

-- No anon/authenticated policies: only service_role (server API) can read/write.
