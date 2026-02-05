-- Create icps table
create table if not exists public.icps (
  id uuid not null default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  image_url text,
  age_range text,
  gender text,
  location text,
  profession text,
  income_range text,
  main_pain text,
  main_goal text,
  objections text[],
  life_context text,
  urgency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint icps_pkey primary key (id)
);

-- Create icp_products table (N:N relationship)
create table if not exists public.icp_products (
  icp_id uuid not null references public.icps(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  constraint icp_products_pkey primary key (icp_id, product_id)
);

-- Enable RLS
alter table public.icps enable row level security;
alter table public.icp_products enable row level security;

-- Create policies for icps
create policy "Users can view icps in their workspace"
  on public.icps for select
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid()
  ));

create policy "Admins and Owners can manage icps"
  on public.icps for all
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('admin', 'owner')
  ));

-- Create policies for icp_products
create policy "Users can view icp_products"
  on public.icp_products for select
  using (icp_id in (
    select id from public.icps
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  ));

create policy "Admins and Owners can manage icp_products"
  on public.icp_products for all
  using (icp_id in (
    select id from public.icps
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  ));
