-- Table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

-- RLS + policies
alter table public.users enable row level security;

drop policy if exists "read own user" on public.users;
create policy "read own user" on public.users
for select using (auth.uid() = id);

drop policy if exists "insert own user" on public.users;
create policy "insert own user" on public.users
for insert with check (auth.uid() = id);

drop policy if exists "update own user" on public.users;
create policy "update own user" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create row for each auth user (secure + idempotent)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();