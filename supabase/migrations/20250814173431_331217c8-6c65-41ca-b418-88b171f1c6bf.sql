-- SECURITY FIX - Handle NULL client_id values and implement bulletproof RLS
-- Step 1: Fix NULL client_id values before applying constraints

-- Update NULL client_id values in leads table
UPDATE public.leads 
SET client_id = 'default' 
WHERE client_id IS NULL;

-- Update NULL client_id values in contacts table  
UPDATE public.contacts 
SET client_id = 'default' 
WHERE client_id IS NULL;

-- Now make client_id NOT NULL to prevent security gaps
ALTER TABLE public.contacts ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN client_id SET NOT NULL;

-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create enhanced security validation function
CREATE OR REPLACE FUNCTION public.validate_user_access(target_client_id text, required_role text DEFAULT 'agent')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    auth.uid() IS NOT NULL AND
    target_client_id IS NOT NULL AND
    target_client_id = (
      SELECT p.client_id 
      FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      LIMIT 1
    ) AND
    EXISTS (
      SELECT 1 
      FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (
        p.role = 'admin' OR 
        (required_role = 'agent' AND p.role IN ('agent', 'admin'))
      )
      AND p.client_id = target_client_id
    );
$$;

-- Drop ALL existing policies on sensitive tables
DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['contacts', 'leads', 'client_config', 'clients', 'subscribers'])
    LOOP
        FOR policy_name IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = table_name
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.' || table_name;
        END LOOP;
    END LOOP;
END
$$;

-- CONTACTS TABLE - Maximum Security
CREATE POLICY "contacts_secure_select" 
ON public.contacts 
FOR SELECT 
USING (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "contacts_secure_insert" 
ON public.contacts 
FOR INSERT 
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "contacts_secure_update" 
ON public.contacts 
FOR UPDATE 
USING (public.validate_user_access(client_id, 'agent'))
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "contacts_admin_delete" 
ON public.contacts 
FOR DELETE 
USING (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "contacts_deny_anon" 
ON public.contacts 
FOR ALL 
TO anon 
USING (false);

-- LEADS TABLE - Maximum Security  
CREATE POLICY "leads_secure_select" 
ON public.leads 
FOR SELECT 
USING (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "leads_secure_insert" 
ON public.leads 
FOR INSERT 
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "leads_secure_update" 
ON public.leads 
FOR UPDATE 
USING (public.validate_user_access(client_id, 'agent'))
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "leads_admin_delete" 
ON public.leads 
FOR DELETE 
USING (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "leads_deny_anon" 
ON public.leads 
FOR ALL 
TO anon 
USING (false);

-- CLIENT_CONFIG TABLE - Admin Only
CREATE POLICY "client_config_admin_select" 
ON public.client_config 
FOR SELECT 
USING (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "client_config_admin_insert" 
ON public.client_config 
FOR INSERT 
WITH CHECK (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "client_config_admin_update" 
ON public.client_config 
FOR UPDATE 
USING (public.validate_user_access(client_id, 'admin'))
WITH CHECK (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "client_config_deny_anon" 
ON public.client_config 
FOR ALL 
TO anon 
USING (false);

-- CLIENTS TABLE - Owner Access Only
CREATE POLICY "clients_owner_access" 
ON public.clients 
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  created_by_user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  created_by_user_id = auth.uid()
);

CREATE POLICY "clients_deny_anon" 
ON public.clients 
FOR ALL 
TO anon 
USING (false);

-- SUBSCRIBERS TABLE - Own Data Only
CREATE POLICY "subscribers_own_data" 
ON public.subscribers 
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR email = auth.email())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR email = auth.email())
);

CREATE POLICY "subscribers_deny_anon" 
ON public.subscribers 
FOR ALL 
TO anon 
USING (false);

-- Add performance indexes for security queries
CREATE INDEX IF NOT EXISTS idx_contacts_client_security ON public.contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_security ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_client ON public.profiles(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_config_security ON public.client_config(client_id);