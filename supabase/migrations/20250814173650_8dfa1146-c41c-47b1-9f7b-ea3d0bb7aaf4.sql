-- FINAL ULTIMATE SECURITY PATCH - Eliminate last 2 critical errors
-- This implements military-grade security for all sensitive data

-- Secure the messages table that wasn't covered before
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on messages and conversations
DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['messages', 'conversations'])
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

-- MESSAGES TABLE - Ultra Secure
CREATE POLICY "messages_secure_select" 
ON public.messages 
FOR SELECT 
USING (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "messages_secure_insert" 
ON public.messages 
FOR INSERT 
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "messages_secure_update" 
ON public.messages 
FOR UPDATE 
USING (public.validate_user_access(client_id, 'agent'))
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "messages_deny_anon" 
ON public.messages 
FOR ALL 
TO anon 
USING (false);

-- CONVERSATIONS TABLE - Ultra Secure  
CREATE POLICY "conversations_secure_select" 
ON public.conversations 
FOR SELECT 
USING (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "conversations_secure_insert" 
ON public.conversations 
FOR INSERT 
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "conversations_secure_update" 
ON public.conversations 
FOR UPDATE 
USING (public.validate_user_access(client_id, 'agent'))
WITH CHECK (public.validate_user_access(client_id, 'agent'));

CREATE POLICY "conversations_admin_delete" 
ON public.conversations 
FOR DELETE 
USING (public.validate_user_access(client_id, 'admin'));

CREATE POLICY "conversations_deny_anon" 
ON public.conversations 
FOR ALL 
TO anon 
USING (false);

-- Create an even more restrictive function for ultra-sensitive data (Twilio credentials)
CREATE OR REPLACE FUNCTION public.validate_admin_only_access(target_client_id text)
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
      AND p.role = 'admin'
      LIMIT 1
    ) AND
    EXISTS (
      SELECT 1 
      FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
      AND p.client_id = target_client_id
    );
$$;

-- Replace client_config policies with ultra-restrictive admin-only access
DROP POLICY IF EXISTS "client_config_admin_select" ON public.client_config;
DROP POLICY IF EXISTS "client_config_admin_insert" ON public.client_config;
DROP POLICY IF EXISTS "client_config_admin_update" ON public.client_config;

CREATE POLICY "client_config_ultra_secure_select" 
ON public.client_config 
FOR SELECT 
USING (public.validate_admin_only_access(client_id));

CREATE POLICY "client_config_ultra_secure_insert" 
ON public.client_config 
FOR INSERT 
WITH CHECK (public.validate_admin_only_access(client_id));

CREATE POLICY "client_config_ultra_secure_update" 
ON public.client_config 
FOR UPDATE 
USING (public.validate_admin_only_access(client_id))
WITH CHECK (public.validate_admin_only_access(client_id));

-- Enhance leads table with even more restrictive validation
DROP POLICY IF EXISTS "leads_secure_select" ON public.leads;
DROP POLICY IF EXISTS "leads_secure_insert" ON public.leads;  
DROP POLICY IF EXISTS "leads_secure_update" ON public.leads;

CREATE POLICY "leads_ultra_secure_select" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

CREATE POLICY "leads_ultra_secure_insert" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

CREATE POLICY "leads_ultra_secure_update" 
ON public.leads 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND  
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

-- Enhance contacts table with stricter validation 
DROP POLICY IF EXISTS "contacts_secure_select" ON public.contacts;
DROP POLICY IF EXISTS "contacts_secure_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_secure_update" ON public.contacts;

CREATE POLICY "contacts_ultra_secure_select" 
ON public.contacts 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

CREATE POLICY "contacts_ultra_secure_insert" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

CREATE POLICY "contacts_ultra_secure_update" 
ON public.contacts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id IS NOT NULL AND
  client_id != 'default' AND
  public.validate_user_access(client_id, 'agent')
);

-- Add triggers to automatically set client_id on insert to prevent 'default' values
CREATE OR REPLACE FUNCTION public.auto_set_client_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.client_id IS NULL OR NEW.client_id = 'default' THEN
    NEW.client_id := public.get_current_client_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply auto client_id trigger to sensitive tables
DROP TRIGGER IF EXISTS contacts_auto_client_id ON public.contacts;
CREATE TRIGGER contacts_auto_client_id
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_client_id();

DROP TRIGGER IF EXISTS leads_auto_client_id ON public.leads;
CREATE TRIGGER leads_auto_client_id
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_client_id();

DROP TRIGGER IF EXISTS messages_auto_client_id ON public.messages;
CREATE TRIGGER messages_auto_client_id
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_client_id();

-- Add indexes for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_messages_client_security ON public.messages(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_security ON public.conversations(client_id);