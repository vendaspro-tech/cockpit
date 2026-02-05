-- Add supabase_user_id column to replace legacy clerk_user_id
alter table public.users
add column if not exists supabase_user_id text;

-- Copy existing values
update public.users
set supabase_user_id = clerk_user_id
where supabase_user_id is null;

-- Ensure not null and uniqueness
alter table public.users
alter column supabase_user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_supabase_user_id_key'
  ) then
    alter table public.users
    add constraint users_supabase_user_id_key unique (supabase_user_id);
  end if;
end $$;
