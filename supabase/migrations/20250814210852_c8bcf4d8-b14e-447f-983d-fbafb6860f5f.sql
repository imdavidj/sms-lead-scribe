-- Fix client onboarding system inconsistencies

-- Add setup tracking columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS setup_steps JSONB DEFAULT '{"company": false, "twilio": false, "complete": false}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS twilio_verified BOOLEAN DEFAULT FALSE;

-- Add setup tracking to client_config
ALTER TABLE public.client_config
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS setup_steps JSONB DEFAULT '{"company": false, "twilio": false}'::jsonb;

-- Update the handle_new_user function to use consistent client creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

  -- Generate unique client ID (consistent with existing pattern)
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
    api_key,
    setup_steps
  ) VALUES (
    gen_random_uuid(),
    company_name,
    NEW.email,
    NEW.phone,
    company_name,
    NEW.id,
    'trial',
    'basic',
    gen_random_uuid()::text,
    '{"company": false, "twilio": false, "complete": false}'::jsonb
  ) RETURNING id INTO client_record_id;

  -- Create default client_config
  INSERT INTO public.client_config (
    client_id,
    client_name,
    subscription_plan,
    sms_limit,
    is_active,
    setup_steps
  ) VALUES (
    new_client_id,
    company_name,
    'trial',
    100, -- trial limit
    true,
    '{"company": false, "twilio": false}'::jsonb
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

-- Create function to update setup progress
CREATE OR REPLACE FUNCTION public.update_setup_progress(
  p_client_id TEXT,
  p_step TEXT,
  p_completed BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

  -- Update clients table setup tracking
  UPDATE public.clients
  SET 
    setup_steps = jsonb_set(updated_steps, '{complete}', to_jsonb(all_complete)),
    onboarding_completed_at = CASE WHEN all_complete THEN now() ELSE onboarding_completed_at END,
    is_setup_complete = all_complete,
    updated_at = now()
  WHERE id IN (
    SELECT c.id FROM public.clients c
    INNER JOIN public.profiles p ON c.created_by_user_id = p.user_id
    WHERE p.client_id = p_client_id
  );

  RETURN all_complete;
END;
$$;

-- Create function to check setup status
CREATE OR REPLACE FUNCTION public.get_setup_status(p_client_id TEXT)
RETURNS TABLE(
  setup_completed BOOLEAN,
  company_complete BOOLEAN,
  twilio_complete BOOLEAN,
  twilio_verified BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    COALESCE(cc.setup_completed, false) as setup_completed,
    COALESCE((cc.setup_steps->>'company')::boolean, false) as company_complete,
    COALESCE((cc.setup_steps->>'twilio')::boolean, false) as twilio_complete,
    COALESCE(c.twilio_verified, false) as twilio_verified
  FROM public.client_config cc
  LEFT JOIN public.profiles p ON p.client_id = cc.client_id
  LEFT JOIN public.clients c ON c.created_by_user_id = p.user_id
  WHERE cc.client_id = p_client_id
    AND p.user_id = auth.uid()
  LIMIT 1;
$$;