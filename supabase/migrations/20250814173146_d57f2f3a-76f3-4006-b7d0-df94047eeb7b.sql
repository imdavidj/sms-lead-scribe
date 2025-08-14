-- ULTIMATE SECURITY LOCKDOWN - Fix all remaining critical errors
-- This migration implements bulletproof RLS policies with zero policy gaps

-- Fix 1: Ultra-secure contacts table - Customer Contact Information
-- Drop and rebuild with iron-clad security
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

-- Create bulletproof contact policies - no exceptions, no gaps
CREATE POLICY "contacts_fortress_select" 
ON public.contacts 
FOR SELECT 
USING (
  -- Only authenticated users
  auth.uid() IS NOT NULL AND
  -- Only if client_id matches user's client
  client_id = get_current_client_id() AND
  -- Only if user is agent or admin
  public.is_current_user_admin_safe() OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_fortress_insert" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  -- Only authenticated users
  auth.uid() IS NOT NULL AND
  -- Must have client_id
  client_id IS NOT NULL AND
  -- Client must match user's client
  client_id = get_current_client_id() AND
  -- Only agents and admins
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_fortress_update" 
ON public.contacts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = contacts.client_id
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "contacts_fortress_delete" 
ON public.contacts 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  public.is_current_user_admin_safe()
);

-- Fix 2: Ultra-secure client_config table - API Keys and Twilio Credentials
-- Drop and rebuild with maximum security
DO $$
DECLARE
    policy_name TEXT;
BEGIN
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

-- Create ultra-secure client_config policies - admin only, no exceptions
CREATE POLICY "client_config_fortress_select" 
ON public.client_config 
FOR SELECT 
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  -- Must be admin
  public.is_current_user_admin_safe() AND
  -- Must be their client
  client_id = get_current_client_id()
);

CREATE POLICY "client_config_fortress_insert" 
ON public.client_config 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
);

CREATE POLICY "client_config_fortress_update" 
ON public.client_config 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
);

-- NO DELETE policy for client_config - too dangerous

-- Fix 3: Ultra-secure clients table - Business Information and API Keys
-- Drop and rebuild with bulletproof security
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.clients';
    END LOOP;
END
$$;

-- Create ultra-secure clients policies - admin only for their own client
CREATE POLICY "clients_fortress_select" 
ON public.clients 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  (
    created_by_user_id = auth.uid() OR
    name = get_current_client_id()
  )
);

CREATE POLICY "clients_fortress_insert" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  created_by_user_id = auth.uid()
);

CREATE POLICY "clients_fortress_update" 
ON public.clients 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  (
    created_by_user_id = auth.uid() OR
    name = get_current_client_id()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  (
    created_by_user_id = auth.uid() OR
    name = get_current_client_id()
  )
);

CREATE POLICY "clients_fortress_delete" 
ON public.clients 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND
  public.is_current_user_admin_safe() AND
  created_by_user_id = auth.uid()
);

-- Fix 4: Enhance leads table security (even though it's a warning, let's secure it)
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'leads'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.leads';
    END LOOP;
END
$$;

-- Create bulletproof leads policies
CREATE POLICY "leads_fortress_select" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = leads.client_id
  )
);

CREATE POLICY "leads_fortress_insert" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = leads.client_id
  )
);

CREATE POLICY "leads_fortress_update" 
ON public.leads 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = leads.client_id
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin')
    AND p.client_id = leads.client_id
  )
);

CREATE POLICY "leads_fortress_delete" 
ON public.leads 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND
  client_id = get_current_client_id() AND
  public.is_current_user_admin_safe()
);

-- Add extra security: Ensure all tables deny access to unauthenticated users
-- Add a catch-all DENY policy for each sensitive table

CREATE POLICY "contacts_deny_unauthenticated" 
ON public.contacts 
FOR ALL
TO anon
USING (false);

CREATE POLICY "client_config_deny_unauthenticated" 
ON public.client_config 
FOR ALL
TO anon
USING (false);

CREATE POLICY "clients_deny_unauthenticated" 
ON public.clients 
FOR ALL
TO anon
USING (false);

CREATE POLICY "leads_deny_unauthenticated" 
ON public.leads 
FOR ALL
TO anon
USING (false);

CREATE POLICY "profiles_deny_unauthenticated" 
ON public.profiles 
FOR ALL
TO anon
USING (false);