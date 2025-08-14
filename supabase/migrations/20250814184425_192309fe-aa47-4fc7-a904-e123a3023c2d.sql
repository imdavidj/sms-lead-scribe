-- Remove sensitive Twilio credentials from client_config table
-- These will be moved to Supabase secrets for better security

-- Add a flag to track if Twilio is configured via secrets
ALTER TABLE public.client_config 
ADD COLUMN IF NOT EXISTS twilio_configured boolean DEFAULT false;

-- Remove the sensitive credential columns
ALTER TABLE public.client_config 
DROP COLUMN IF EXISTS twilio_account_sid,
DROP COLUMN IF EXISTS twilio_auth_token,
DROP COLUMN IF EXISTS twilio_messaging_service_sid;

-- Update the has_twilio_credentials function to check for the new flag
CREATE OR REPLACE FUNCTION public.has_twilio_credentials(client_id_param text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    twilio_configured IS TRUE AND
    twilio_phone_number IS NOT NULL
  FROM public.client_config 
  WHERE client_id = client_id_param;
$$;