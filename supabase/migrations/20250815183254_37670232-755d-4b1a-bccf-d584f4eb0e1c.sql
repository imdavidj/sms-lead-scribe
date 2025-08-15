-- Create the public.users table linked to auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscription_status text, -- e.g., active, trialing, past_due, canceled
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create function to auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Drop existing trigger if it exists and create new one
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

-- Enable RLS on the users table
alter table public.users enable row level security;

-- Create RLS policies for users table
create policy "read own user" on public.users
for select using (auth.uid() = id);

create policy "insert own user" on public.users
for insert with check (auth.uid() = id);

create policy "update own user" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end $$;

-- Drop existing trigger if it exists and create new one
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();