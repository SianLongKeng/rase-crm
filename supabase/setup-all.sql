-- ============================================================
-- CNP CRM — FULL SETUP (run ONCE on a fresh Supabase project)
-- Paste this whole file into: Supabase Dashboard → SQL Editor → Run
-- Combines: schema.sql + migration-grade-status.sql + realtime.sql
-- Safe to re-run.
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES — extends auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null default 'telesale' check (role in ('owner','admin','telesale','packing')),
  department text,
  phone text,
  commission_rate numeric,
  permissions jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile when new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'telesale')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text,
  description text,
  image_url text,
  price numeric not null default 0,
  cost numeric not null default 0,
  packing_fee numeric,
  commission jsonb,
  unit text not null default 'ชิ้น',
  stock_qty integer default 0,
  low_stock_threshold integer default 0,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_status_idx on products(status);

-- ============================================================
-- SHIPPING PROFILES
-- ============================================================
create table if not exists public.shipping_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shipping_fee numeric not null default 0,
  cod_percent numeric not null default 0,
  product_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  line text,
  address text,
  address_detail jsonb,
  grade text not null default 'D' check (grade in ('A','B','C','D')),
  status text default 'new',
  tags text[] default '{}',
  owner_id uuid references public.profiles(id) on delete set null,
  owner_name text,
  total_orders integer default 0,
  total_amount numeric default 0,
  success_rate integer default 0,
  cancel_count integer default 0,
  last_call_at timestamptz,
  next_call_at timestamptz,
  next_call_note text,
  notes text,
  edit_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_owner_idx on customers(owner_id);
create index if not exists customers_grade_idx on customers(grade);

-- ============================================================
-- CALL LOGS
-- ============================================================
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  customer_name text,
  customer_phone text,
  telesale_id uuid references public.profiles(id) on delete set null,
  telesale_name text,
  result text not null check (result in ('closed','follow_up','no_answer','not_interested')),
  notes text,
  follow_up_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists call_logs_customer_idx on call_logs(customer_id);
create index if not exists call_logs_telesale_idx on call_logs(telesale_id);
create index if not exists call_logs_created_at_idx on call_logs(created_at desc);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id text primary key,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text,
  customer_address text,
  shipping jsonb,
  telesale_id uuid references public.profiles(id) on delete set null,
  telesale_name text,
  packing_id uuid references public.profiles(id) on delete set null,
  packing_name text,
  status text not null default 'wait_pack' check (status in ('wait_pack','in_myorder','shipping','delivered','returned','cancelled')),
  items jsonb not null default '[]'::jsonb,
  total_amount numeric default 0,
  total_cost numeric default 0,
  discount numeric default 0,
  shipping_fee numeric,
  cod_fee numeric,
  carrier text,
  tracking_number text,
  notes text,
  call_log_id uuid,
  commission_amount numeric,
  return_reason text,
  cancel_reason text,
  copied_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  returned_at timestamptz,
  cancelled_at timestamptz,
  shipping_profile_id uuid,
  shipping_profile_name text,
  real_shipping_fee numeric,
  real_cod_baht numeric,
  use_real_for_profit boolean,
  standard_cod_baht numeric,
  channel text,
  payment_method text,
  weight_kg numeric,
  created_by_name text,
  source text,
  edit_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_customer_idx on orders(customer_id);
create index if not exists orders_telesale_idx on orders(telesale_id);
create index if not exists orders_created_at_idx on orders(created_at desc);

-- ============================================================
-- HISTORY LOG (activity feed)
-- ============================================================
create table if not exists public.history_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  description text not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  related_id text,
  related_type text,
  created_at timestamptz default now()
);

create index if not exists history_event_idx on history_logs(event_type);
create index if not exists history_created_at_idx on history_logs(created_at desc);

-- ============================================================
-- GRADE SETTINGS (singleton — exactly 1 row)
-- ============================================================
create table if not exists public.grade_settings (
  id integer primary key default 1,
  call_days jsonb not null default '{"A":21,"B":30,"C":45,"D":60}'::jsonb,
  card_limit jsonb not null default '{"A":70,"B":35,"C":60,"D":40}'::jsonb,
  commission_rate jsonb not null default '{"A":7,"B":5,"C":4,"D":3}'::jsonb,
  updated_at timestamptz default now(),
  constraint singleton check (id = 1)
);
insert into public.grade_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- MIGRATION: Customer activity status + grade settings extras
-- ============================================================
alter table public.customers
  add column if not exists returned_count integer default 0,
  add column if not exists last_delivered_at timestamptz,
  add column if not exists last_returned_at timestamptz;

create index if not exists customers_last_delivered_idx on customers(last_delivered_at);

alter table public.grade_settings
  add column if not exists min_purchase jsonb not null
    default '{"A":null,"B":null,"C":null,"D":null}'::jsonb,
  add column if not exists exclude_from_queue jsonb not null
    default '{"A":false,"B":false,"C":false,"D":true}'::jsonb,
  add column if not exists thresholds jsonb not null
    default '{"aDelivered":5,"bDelivered":1,"dReturned":2}'::jsonb;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — authenticated users have full access
-- ============================================================
alter table profiles enable row level security;
alter table shipping_profiles enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table call_logs enable row level security;
alter table orders enable row level security;
alter table history_logs enable row level security;
alter table grade_settings enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated with check (true);

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated using (true) with check (true);

drop policy if exists profiles_delete on profiles;
create policy profiles_delete on profiles for delete to authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['shipping_profiles','products','customers','call_logs','orders','history_logs','grade_settings']
  loop
    execute format('drop policy if exists all_authenticated on %I', t);
    execute format('create policy all_authenticated on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end$$;

-- ============================================================
-- REALTIME — add all tables to supabase_realtime publication
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['customers','products','orders','call_logs','shipping_profiles','history_logs','grade_settings','profiles']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end$$;

-- ============================================================
-- DONE — all tables, RLS, and realtime configured
-- ============================================================
select 'CNP CRM setup complete ✅' as status;
