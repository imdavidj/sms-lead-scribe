-- Fix client_config security issues by removing sensitive credentials from table
-- and restricting access to admins only

-- First, let's update RLS policies to be more restrictive
-- Drop existing policies that allow agents to access sensitive config
DROP POLICY IF EXISTS "Select client config in own client" ON public.client_config;
DROP POLICY IF EXISTS "Insert client config (agents/admins)" ON public.client_config;
DROP POLICY IF EXISTS "Update client config (agents/admins)" ON public.client_config;

-- Create new restrictive policies - only admins can access client config
CREATE POLICY "Admins can select client config" 
ON public.client_config 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND client_config.client_id = p.client_id
  )
);

CREATE POLICY "Admins can insert client config" 
ON public.client_config 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND COALESCE(client_config.client_id, get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Admins can update client config" 
ON public.client_config 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND client_config.client_id = p.client_id
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND client_config.client_id = p.client_id
  )
);

-- Create a new secure config table for non-sensitive settings
CREATE TABLE IF NOT EXISTS public.client_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  client_name text NOT NULL,
  subscription_plan text DEFAULT 'trial',
  sms_limit integer DEFAULT 100,
  sms_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  google_sheet_id text, -- This can remain as it's less sensitive
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for client_settings (can be accessed by agents/admins)
CREATE POLICY "Agents and admins can select client settings" 
ON public.client_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND client_settings.client_id = p.client_id
  )
);

CREATE POLICY "Admins can insert client settings" 
ON public.client_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND COALESCE(client_settings.client_id, get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Admins can update client settings" 
ON public.client_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND client_settings.client_id = p.client_id
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND client_settings.client_id = p.client_id
  )
);

-- Migrate existing non-sensitive data to the new table
INSERT INTO public.client_settings (
  client_id, 
  client_name, 
  subscription_plan, 
  sms_limit, 
  sms_used, 
  is_active, 
  is_verified, 
  google_sheet_id,
  created_at, 
  updated_at
)
SELECT 
  client_id, 
  client_name, 
  subscription_plan, 
  sms_limit, 
  sms_used, 
  is_active, 
  is_verified, 
  google_sheet_id,
  created_at, 
  updated_at
FROM public.client_config
ON CONFLICT DO NOTHING;

-- Add trigger for automatic client_id setting on client_settings
CREATE TRIGGER set_client_settings_client_id_trigger
BEFORE INSERT ON public.client_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_client_id_from_profile();

-- Add trigger for automatic updated_at setting
CREATE TRIGGER update_client_settings_updated_at
BEFORE UPDATE ON public.client_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comment on the original table to mark it as containing sensitive data
COMMENT ON TABLE public.client_config IS 'DEPRECATED: Contains sensitive credentials. Use client_settings for non-sensitive config and Supabase secrets for credentials.';

-- Remove sensitive credential columns from client_config (commented out for safety)
-- These should be moved to Supabase secrets instead
-- ALTER TABLE public.client_config DROP COLUMN IF EXISTS twilio_account_sid;
-- ALTER TABLE public.client_config DROP COLUMN IF EXISTS twilio_auth_token;
-- ALTER TABLE public.client_config DROP COLUMN IF EXISTS twilio_messaging_service_sid;

-- Add a secure function to check if credentials are configured (without exposing them)
CREATE OR REPLACE FUNCTION public.has_twilio_credentials(client_id_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    twilio_account_sid IS NOT NULL AND 
    twilio_auth_token IS NOT NULL AND
    twilio_phone_number IS NOT NULL
  FROM public.client_config 
  WHERE client_id = client_id_param;
$$;