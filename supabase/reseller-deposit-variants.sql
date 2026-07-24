-- Balance deposit variants (admin Products → Balance deposit variants)
-- Run in Supabase → SQL Editor.

create table if not exists public.reseller_deposit_variants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  pay_amount numeric(12, 2) not null,
  bonus_percent numeric(8, 2) not null default 0,
  credit_amount numeric(12, 2) not null,
  popular boolean not null default false,
  product_id bigint not null default 0,
  variant_id bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reseller_deposit_variants_pay_amount_check check (pay_amount > 0),
  constraint reseller_deposit_variants_bonus_check check (bonus_percent >= 0),
  constraint reseller_deposit_variants_credit_check check (credit_amount > 0)
);

create index if not exists reseller_deposit_variants_sort_order_idx
  on public.reseller_deposit_variants (sort_order);

alter table public.reseller_deposit_variants enable row level security;

create table if not exists public.reseller_deposit_variant_coupons (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.reseller_deposit_variants (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint reseller_deposit_variant_coupons_code_not_blank check (length(trim(code)) > 0),
  constraint reseller_deposit_variant_coupons_variant_code_unique unique (variant_id, code)
);

create index if not exists reseller_deposit_variant_coupons_variant_id_idx
  on public.reseller_deposit_variant_coupons (variant_id);

create index if not exists reseller_deposit_variant_coupons_code_idx
  on public.reseller_deposit_variant_coupons (code);

alter table public.reseller_deposit_variant_coupons enable row level security;

insert into public.reseller_deposit_variants (
  slug, name, pay_amount, bonus_percent, credit_amount, popular, product_id, variant_id, sort_order
)
values
  ('deposit-20', 'Deposit $20', 20, 0, 20, false, 0, 0, 0),
  ('deposit-50', 'Deposit $50', 50, 0, 50, false, 0, 0, 1),
  ('deposit-100', 'Deposit $100', 100, 10, 110, true, 0, 0, 2),
  ('deposit-250', 'Deposit $250', 250, 25, 312.50, false, 0, 0, 3),
  ('deposit-1000', 'VIP Guy', 1000, 100, 2000, false, 0, 0, 4)
on conflict (slug) do nothing;

update public.reseller_deposit_variants
set name = 'VIP Guy', updated_at = now()
where slug = 'deposit-1000' and name is distinct from 'VIP Guy';
