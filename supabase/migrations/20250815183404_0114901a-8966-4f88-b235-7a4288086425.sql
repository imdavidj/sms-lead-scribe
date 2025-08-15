-- Fix function search path security issues
create or replace function public.set_updated_at()
returns trigger language plpgsql 
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql 
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end $$;