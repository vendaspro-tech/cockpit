
-- Create products table
create table if not exists public.products (
  id uuid not null default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  standard_price decimal(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_pkey primary key (id)
);

-- Create product_benefits table
create table if not exists public.product_benefits (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  description text,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_benefits_pkey primary key (id)
);

-- Create product_offers table
create table if not exists public.product_offers (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price decimal(10, 2),
  description text,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_offers_pkey primary key (id)
);

-- Create product_objections table
create table if not exists public.product_objections (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  objection text not null,
  response text,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_objections_pkey primary key (id)
);

-- Create product_refusal_reasons table
create table if not exists public.product_refusal_reasons (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reason text not null,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_refusal_reasons_pkey primary key (id)
);

-- Enable RLS
alter table public.products enable row level security;
alter table public.product_benefits enable row level security;
alter table public.product_offers enable row level security;
alter table public.product_objections enable row level security;
alter table public.product_refusal_reasons enable row level security;

-- Create policies (assuming standard workspace access pattern)
-- Products
create policy "Users can view products in their workspace"
  on public.products for select
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid()
  ));

create policy "Admins and Owners can manage products"
  on public.products for all
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('admin', 'owner')
  ));

-- Benefits
create policy "Users can view product benefits"
  on public.product_benefits for select
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  ));

create policy "Admins and Owners can manage product benefits"
  on public.product_benefits for all
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  ));

-- Offers
create policy "Users can view product offers"
  on public.product_offers for select
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  ));

create policy "Admins and Owners can manage product offers"
  on public.product_offers for all
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  ));

-- Objections
create policy "Users can view product objections"
  on public.product_objections for select
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  ));

create policy "Admins and Owners can manage product objections"
  on public.product_objections for all
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  ));

-- Refusal Reasons
create policy "Users can view product refusal reasons"
  on public.product_refusal_reasons for select
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  ));

create policy "Admins and Owners can manage product refusal reasons"
  on public.product_refusal_reasons for all
  using (product_id in (
    select id from public.products
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  ));
