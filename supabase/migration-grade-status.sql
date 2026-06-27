-- ============================================================
-- MIGRATION: Add Customer Activity Status + Grade Settings extras
-- Run once in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- 1) customers: add returnedCount + last delivered/returned timestamps
alter table public.customers
  add column if not exists returned_count integer default 0,
  add column if not exists last_delivered_at timestamptz,
  add column if not exists last_returned_at timestamptz;

create index if not exists customers_last_delivered_idx on customers(last_delivered_at);

-- 2) grade_settings: add minimum purchase amount per grade + exclude-from-queue + thresholds
alter table public.grade_settings
  add column if not exists min_purchase jsonb not null
    default '{"A":null,"B":null,"C":null,"D":null}'::jsonb,
  add column if not exists exclude_from_queue jsonb not null
    default '{"A":false,"B":false,"C":false,"D":true}'::jsonb,
  add column if not exists thresholds jsonb not null
    default '{"aDelivered":5,"bDelivered":1,"dReturned":2}'::jsonb;

-- 3) Backfill last_delivered_at / last_returned_at from existing orders
update public.customers c
set last_delivered_at = sub.last_delivered
from (
  select customer_id, max(delivered_at) as last_delivered
  from public.orders
  where status = 'delivered' and delivered_at is not null
  group by customer_id
) sub
where c.id = sub.customer_id and c.last_delivered_at is null;

update public.customers c
set last_returned_at = sub.last_returned
from (
  select customer_id, max(returned_at) as last_returned
  from public.orders
  where status = 'returned' and returned_at is not null
  group by customer_id
) sub
where c.id = sub.customer_id and c.last_returned_at is null;

-- 4) Backfill returned_count from existing orders
update public.customers c
set returned_count = sub.cnt
from (
  select customer_id, count(*)::integer as cnt
  from public.orders
  where status = 'returned'
  group by customer_id
) sub
where c.id = sub.customer_id and (c.returned_count is null or c.returned_count = 0);

select 'Migration applied' as status;
