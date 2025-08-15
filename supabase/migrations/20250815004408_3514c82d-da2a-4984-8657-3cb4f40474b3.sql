-- Fix the setup functions to work with the current database structure
DROP FUNCTION IF EXISTS public.get_setup_status(TEXT);
DROP FUNCTION IF EXISTS public.update_setup_progress(TEXT, TEXT, BOOLEAN);

-- Create proper get_setup_status function that works with current schema
CREATE OR REPLACE FUNCTION public.get_setup_status(p_client_id TEXT)
RETURNS TABLE(
  setup_completed BOOLEAN,
  company_complete BOOLEAN,
  twilio_complete BOOLEAN,
  twilio_verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cc.setup_completed, false) as setup_completed,
    COALESCE((cc.setup_steps->>'company')::boolean, false) as company_complete,
    COALESCE((cc.setup_steps->>'twilio')::boolean, false) as twilio_complete,
    COALESCE(cc.is_verified, false) as twilio_verified
  FROM public.client_config cc
  WHERE cc.client_id = p_client_id;
END;
$$;

-- Create proper update_setup_progress function
CREATE OR REPLACE FUNCTION public.update_setup_progress(
  p_client_id TEXT,
  p_step TEXT,
  p_completed BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_steps JSONB;
  updated_steps JSONB;
  all_complete BOOLEAN;
BEGIN
  -- Get current steps
  SELECT setup_steps INTO current_steps
  FROM public.client_config
  WHERE client_id = p_client_id;

  IF current_steps IS NULL THEN
    current_steps := '{"company": false, "twilio": false}'::jsonb;
  END IF;

  -- Update the specific step
  updated_steps := jsonb_set(current_steps, ARRAY[p_step], to_jsonb(p_completed));

  -- Check if all steps are complete
  all_complete := (updated_steps->>'company')::boolean AND (updated_steps->>'twilio')::boolean;

  -- Update client_config
  UPDATE public.client_config
  SET 
    setup_steps = updated_steps,
    setup_completed = all_complete,
    updated_at = now()
  WHERE client_id = p_client_id;

  RETURN all_complete;
END;
$$;