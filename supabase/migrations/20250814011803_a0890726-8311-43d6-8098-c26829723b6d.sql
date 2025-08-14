-- Fix critical RLS security issues

-- Enable RLS on client_invites (was created but policies might need fixes)
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- Check if clients table has RLS enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Update the generate_client_id function to have proper search path
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_id := 'client_' || lower(substring(gen_random_uuid()::text, 1, 8));
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE name = new_id) AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE client_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique client ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Update get_current_user_role function to have proper search path  
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update get_current_client_id function to have proper search path
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT client_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update set_client_id_from_profile function to have proper search path
CREATE OR REPLACE FUNCTION public.set_client_id_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    NEW.client_id := public.get_current_client_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function to have proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;