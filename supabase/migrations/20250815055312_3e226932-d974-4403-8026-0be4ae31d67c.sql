-- First, let's create the updated_at trigger function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Drop existing subscribers table since we need to change the primary key structure
drop table if exists public.subscribers cascade;

-- Create the new subscribers table with user_id as primary key
create table public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscribed boolean default false,
  subscription_tier text,
  subscription_end timestamptz,
  updated_at timestamptz default now()
);

-- Create index on email for better performance
create index idx_subscribers_email on public.subscribers (email);

-- Create trigger to keep updated_at fresh
create trigger trg_subscribers_updated_at
  before update on public.subscribers
  for each row execute procedure public.set_updated_at();

-- Enable RLS on the new table
alter table public.subscribers enable row level security;

-- Create RLS policies
create policy "Users can view their own subscription" 
  on public.subscribers 
  for select 
  using (user_id = auth.uid() or email = auth.email());

create policy "Users can update their own subscription" 
  on public.subscribers 
  for update 
  using (user_id = auth.uid() or email = auth.email());

create policy "Users can insert their own subscription" 
  on public.subscribers 
  for insert 
  with check (user_id = auth.uid() or email = auth.email());

-- Policy for edge functions to bypass RLS for administrative updates
create policy "Edge functions can manage subscriptions" 
  on public.subscribers 
  for all 
  using (true) 
  with check (true);