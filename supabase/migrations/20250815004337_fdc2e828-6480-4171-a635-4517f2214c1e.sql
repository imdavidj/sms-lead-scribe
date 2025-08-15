-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create proper RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Create get_setup_status function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_setup_status(p_client_id TEXT)
RETURNS TABLE(
  setup_completed BOOLEAN,
  company_complete BOOLEAN,
  twilio_complete BOOLEAN,
  twilio_verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cc.is_setup_complete, false) as setup_completed,
    COALESCE(c.name IS NOT NULL AND c.name != '', false) as company_complete,
    COALESCE(cc.twilio_configured, false) as twilio_complete,
    COALESCE(cc.is_verified, false) as twilio_verified
  FROM clients c
  LEFT JOIN client_config cc ON c.client_id = cc.client_id
  WHERE c.client_id = p_client_id;
END;
$$;

-- Create update_setup_progress function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_setup_progress(
  p_client_id TEXT,
  p_step TEXT,
  p_completed BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  all_complete BOOLEAN := false;
BEGIN
  -- Update the specific step
  IF p_step = 'company' THEN
    -- Company step is considered complete if client has a name
    -- This is handled by the calling code updating the clients table
    NULL;
  ELSIF p_step = 'twilio' THEN
    -- Update twilio configuration
    UPDATE client_config 
    SET twilio_configured = p_completed,
        updated_at = now()
    WHERE client_id = p_client_id;
  END IF;

  -- Check if all setup is complete
  SELECT 
    COALESCE(c.name IS NOT NULL AND c.name != '', false) AND
    COALESCE(cc.twilio_configured, false)
  INTO all_complete
  FROM clients c
  LEFT JOIN client_config cc ON c.client_id = cc.client_id
  WHERE c.client_id = p_client_id;

  -- Update the overall setup completion status
  UPDATE client_config 
  SET is_setup_complete = all_complete,
      updated_at = now()
  WHERE client_id = p_client_id;

  RETURN all_complete;
END;
$$;