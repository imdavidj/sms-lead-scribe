-- Fix RLS policies to allow super admin access to client_config
-- Add super admin policy to client_config table
CREATE POLICY "client_config_super_admin_access" 
ON public.client_config 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'david@americashomeoffer.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.email = 'david@americashomeoffer.com'
  )
);

-- Also ensure the demo data exists by re-inserting it
INSERT INTO public.client_config (
  client_id,
  client_name,
  subscription_plan,
  sms_limit,
  sms_used,
  is_active,
  twilio_configured,
  twilio_phone_number,
  setup_completed,
  setup_steps,
  created_at
) VALUES
(
  'client_acme_001',
  'Acme Real Estate',
  'professional',
  2000,
  450,
  true,
  true,
  '+15551234001',
  true,
  '{"company": true, "twilio": true}'::jsonb,
  now() - interval '25 days'
),
(
  'client_downtown_002',
  'Downtown Property Solutions',
  'basic',
  500,
  120,
  true,
  false,
  NULL,
  false,
  '{"company": true, "twilio": false}'::jsonb,
  now() - interval '20 days'
),
(
  'client_elite_003',
  'Elite Home Buyers',
  'basic',
  500,
  89,
  true,
  true,
  '+15551234003',
  true,
  '{"company": true, "twilio": true}'::jsonb,
  now() - interval '15 days'
),
(
  'client_prime_004',
  'Prime Investors Group',
  'enterprise',
  10000,
  1250,
  true,
  true,
  '+15551234004',
  true,
  '{"company": true, "twilio": true}'::jsonb,
  now() - interval '30 days'
),
(
  'client_sunset_005',
  'Sunset Properties',
  'trial',
  100,
  15,
  true,
  false,
  NULL,
  false,
  '{"company": false, "twilio": false}'::jsonb,
  now() - interval '5 days'
)
ON CONFLICT (client_id) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  subscription_plan = EXCLUDED.subscription_plan,
  sms_limit = EXCLUDED.sms_limit,
  sms_used = EXCLUDED.sms_used,
  updated_at = now();