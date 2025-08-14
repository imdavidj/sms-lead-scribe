-- Fix multi-tenant architecture and client onboarding

-- First, create a proper client creation workflow
-- Update clients table to include better metadata
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS is_setup_complete BOOLEAN DEFAULT false;

-- Create client_invites table for team invitations
CREATE TABLE IF NOT EXISTS public.client_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  invited_by_user_id UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on client_invites
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- Create policies for client_invites
CREATE POLICY "Admins can manage invites for their client" ON public.client_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND p.client_id = (SELECT client_id FROM public.clients WHERE id = client_invites.client_id)
  )
);

-- Update profiles table to support better role management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Create a function to generate unique client IDs
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to properly create clients and assign them
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  company_name TEXT;
  new_client_id TEXT;
  client_record_id UUID;
BEGIN
  -- Get company name from metadata, fallback to email domain
  company_name := NEW.raw_user_meta_data->>'company';
  IF company_name IS NULL OR company_name = '' THEN
    company_name := split_part(NEW.email, '@', 2);
  END IF;

  -- Generate unique client ID
  new_client_id := public.generate_client_id();

  -- Create client record
  INSERT INTO public.clients (
    id,
    name, 
    email,
    phone,
    company,
    created_by_user_id,
    subscription_status,
    subscription_plan,
    api_key
  ) VALUES (
    gen_random_uuid(),
    company_name,
    NEW.email,
    NEW.phone,
    company_name,
    NEW.id,
    'trial',
    'basic',
    gen_random_uuid()::text
  ) RETURNING id INTO client_record_id;

  -- Create default client_config
  INSERT INTO public.client_config (
    client_id,
    client_name,
    subscription_plan,
    sms_limit,
    is_active
  ) VALUES (
    new_client_id,
    company_name,
    'trial',
    100, -- trial limit
    true
  );

  -- Create user profile with admin role
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    role,
    client_id,
    onboarded_at
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'admin', -- First user becomes admin
    new_client_id,
    now()
  );

  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();