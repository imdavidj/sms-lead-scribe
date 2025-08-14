-- COMPREHENSIVE SECURITY FIX - Address all critical security issues

-- Fix 1: Secure client_config table (Critical API Credentials)
-- First check if policies exist and drop them if they do
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop existing policies on client_config to rebuild them securely
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'client_config'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.client_config';
    END LOOP;
END
$$;

-- Create ultra-secure policies for client_config (Twilio credentials)
CREATE POLICY "client_config_admin_only_select" 
ON public.client_config 
FOR SELECT 
USING (
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
);

CREATE POLICY "client_config_admin_only_insert" 
ON public.client_config 
FOR INSERT 
WITH CHECK (
  public.is_current_user_admin_safe() AND
  COALESCE(client_config.client_id, get_current_client_id()) = get_current_client_id()
);

CREATE POLICY "client_config_admin_only_update" 
ON public.client_config 
FOR UPDATE 
USING (
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
)
WITH CHECK (
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
);

-- Fix 2: Secure contacts table (Customer Contact Information)
-- Drop existing policies and rebuild
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'contacts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.contacts';
    END LOOP;
END
$$;

-- Create secure contact policies
CREATE POLICY "contacts_client_based_select" 
ON public.contacts 
FOR SELECT 
USING (
  client_id IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_auth_users_insert" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  client_id IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_auth_users_update" 
ON public.contacts 
FOR UPDATE 
USING (
  client_id IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
)
WITH CHECK (
  client_id IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_admin_only_delete" 
ON public.contacts 
FOR DELETE 
USING (
  client_id IS NOT NULL AND
  client_id = get_current_client_id() AND
  public.is_current_user_admin_safe()
);

-- Fix 3: Secure client_invites table (Email Harvesting Protection)
-- Drop existing policies and rebuild
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'client_invites'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.client_invites';
    END LOOP;
END
$$;

-- Create secure client invite policies - admin only
CREATE POLICY "client_invites_admin_only_all" 
ON public.client_invites 
FOR ALL
USING (
  public.is_current_user_admin_safe() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_invites.client_id
      AND c.created_by_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.is_current_user_admin_safe() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_invites.client_id
      AND c.created_by_user_id = auth.uid()
    )
  )
);

-- Fix 4: Secure subscribers table (Payment Data Protection)
-- Drop existing policies and rebuild with stricter security
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subscribers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.subscribers';
    END LOOP;
END
$$;

-- Create ultra-secure subscriber policies
CREATE POLICY "subscribers_own_data_only_select" 
ON public.subscribers 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  email = auth.email()
);

CREATE POLICY "subscribers_system_insert_only" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  -- Only allow system/edge functions or the user themselves
  user_id = auth.uid() OR 
  email = auth.email()
);

CREATE POLICY "subscribers_own_data_only_update" 
ON public.subscribers 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  email = auth.email()
)
WITH CHECK (
  user_id = auth.uid() OR 
  email = auth.email()
);

-- Fix 5: Update all database functions to have secure search_path
-- Fix the existing functions that don't have secure search_path

-- Update has_twilio_credentials function
CREATE OR REPLACE FUNCTION public.has_twilio_credentials(client_id_param text)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    twilio_account_sid IS NOT NULL AND 
    twilio_auth_token IS NOT NULL AND
    twilio_phone_number IS NOT NULL
  FROM public.client_config 
  WHERE client_id = client_id_param;
$$;

-- Update log_contact_access function
CREATE OR REPLACE FUNCTION public.log_contact_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function can be used to log access to contacts for security monitoring
  -- For now, it's a placeholder that could be extended with actual logging
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update get_current_client_id function
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS text
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT client_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update set_client_id_from_profile function
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

-- Update generate_client_id function
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS text
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

-- Update handle_new_user function
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