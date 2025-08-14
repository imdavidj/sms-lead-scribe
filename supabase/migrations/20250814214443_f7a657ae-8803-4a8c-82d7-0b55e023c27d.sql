-- Insert dummy clients for testing super admin functionality

-- First, let's create some dummy client records
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
  setup_steps,
  is_setup_complete,
  twilio_verified,
  created_at
) VALUES
(
  gen_random_uuid(),
  'Acme Real Estate',
  'admin@acmerealestate.com',
  '+15551234567',
  'Acme Real Estate',
  gen_random_uuid(), -- We'll use this as a placeholder admin user ID
  'active',
  'professional',
  gen_random_uuid()::text,
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-01-15 10:00:00'::timestamp
),
(
  gen_random_uuid(),
  'Downtown Property Solutions',
  'admin@downtownproperties.com',
  '+15559876543',
  'Downtown Property Solutions',
  gen_random_uuid(),
  'active',
  'basic',
  gen_random_uuid()::text,
  '{"company": true, "twilio": false, "complete": false}'::jsonb,
  false,
  false,
  '2024-02-01 14:30:00'::timestamp
),
(
  gen_random_uuid(),
  'Elite Home Buyers',
  'admin@elitehomebuyers.com',
  '+15551122334',
  'Elite Home Buyers',
  gen_random_uuid(),
  'trial',
  'basic',
  gen_random_uuid()::text,
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-02-20 09:15:00'::timestamp
),
(
  gen_random_uuid(),
  'Prime Investors Group',
  'admin@primeinvestors.com',
  '+15554455667',
  'Prime Investors Group',
  gen_random_uuid(),
  'active',
  'enterprise',
  gen_random_uuid()::text,
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-01-30 16:45:00'::timestamp
),
(
  gen_random_uuid(),
  'Sunset Properties',
  'admin@sunsetproperties.com',
  '+15557788990',
  'Sunset Properties',
  gen_random_uuid(),
  'trial',
  'basic',
  gen_random_uuid()::text,
  '{"company": false, "twilio": false, "complete": false}'::jsonb,
  false,
  false,
  '2024-03-01 11:20:00'::timestamp
);

-- Now create dummy profiles for these clients
-- We'll need to get the client IDs and user IDs we just created
WITH client_data AS (
  SELECT 
    id as client_record_id,
    created_by_user_id,
    CASE 
      WHEN company = 'Acme Real Estate' THEN 'client_acme_001'
      WHEN company = 'Downtown Property Solutions' THEN 'client_downtown_002'
      WHEN company = 'Elite Home Buyers' THEN 'client_elite_003'
      WHEN company = 'Prime Investors Group' THEN 'client_prime_004'
      WHEN company = 'Sunset Properties' THEN 'client_sunset_005'
    END as client_id,
    company
  FROM public.clients 
  WHERE email IN (
    'admin@acmerealestate.com',
    'admin@downtownproperties.com', 
    'admin@elitehomebuyers.com',
    'admin@primeinvestors.com',
    'admin@sunsetproperties.com'
  )
)
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id,
  onboarded_at,
  created_at
)
SELECT 
  created_by_user_id,
  CASE 
    WHEN company = 'Acme Real Estate' THEN 'John'
    WHEN company = 'Downtown Property Solutions' THEN 'Sarah'
    WHEN company = 'Elite Home Buyers' THEN 'Michael'
    WHEN company = 'Prime Investors Group' THEN 'Jennifer'
    WHEN company = 'Sunset Properties' THEN 'David'
  END as first_name,
  CASE 
    WHEN company = 'Acme Real Estate' THEN 'Smith'
    WHEN company = 'Downtown Property Solutions' THEN 'Johnson'
    WHEN company = 'Elite Home Buyers' THEN 'Williams'
    WHEN company = 'Prime Investors Group' THEN 'Davis'
    WHEN company = 'Sunset Properties' THEN 'Wilson'
  END as last_name,
  'admin' as role,
  client_id,
  now() - interval '30 days',
  now() - interval '30 days'
FROM client_data;

-- Create client_config entries for each dummy client
WITH client_data AS (
  SELECT 
    CASE 
      WHEN company = 'Acme Real Estate' THEN 'client_acme_001'
      WHEN company = 'Downtown Property Solutions' THEN 'client_downtown_002'
      WHEN company = 'Elite Home Buyers' THEN 'client_elite_003'
      WHEN company = 'Prime Investors Group' THEN 'client_prime_004'
      WHEN company = 'Sunset Properties' THEN 'client_sunset_005'
    END as client_id,
    company,
    subscription_plan,
    CASE 
      WHEN subscription_plan = 'basic' THEN 500
      WHEN subscription_plan = 'professional' THEN 2000
      WHEN subscription_plan = 'enterprise' THEN 10000
      ELSE 100 -- trial
    END as sms_limit
  FROM public.clients 
  WHERE email IN (
    'admin@acmerealestate.com',
    'admin@downtownproperties.com', 
    'admin@elitehomebuyers.com',
    'admin@primeinvestors.com',
    'admin@sunsetproperties.com'
  )
)
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
)
SELECT 
  client_id,
  company,
  subscription_plan,
  sms_limit,
  CASE 
    WHEN company = 'Acme Real Estate' THEN 450
    WHEN company = 'Downtown Property Solutions' THEN 120
    WHEN company = 'Elite Home Buyers' THEN 89
    WHEN company = 'Prime Investors Group' THEN 1250
    WHEN company = 'Sunset Properties' THEN 15
  END as sms_used,
  true,
  CASE 
    WHEN company IN ('Acme Real Estate', 'Elite Home Buyers', 'Prime Investors Group') THEN true
    ELSE false
  END as twilio_configured,
  CASE 
    WHEN company = 'Acme Real Estate' THEN '+15551234001'
    WHEN company = 'Elite Home Buyers' THEN '+15551234003'
    WHEN company = 'Prime Investors Group' THEN '+15551234004'
    ELSE NULL
  END as twilio_phone_number,
  CASE 
    WHEN company IN ('Acme Real Estate', 'Elite Home Buyers', 'Prime Investors Group') THEN true
    ELSE false
  END as setup_completed,
  CASE 
    WHEN company IN ('Acme Real Estate', 'Elite Home Buyers', 'Prime Investors Group') 
    THEN '{"company": true, "twilio": true}'::jsonb
    WHEN company = 'Downtown Property Solutions'
    THEN '{"company": true, "twilio": false}'::jsonb
    ELSE '{"company": false, "twilio": false}'::jsonb
  END as setup_steps,
  now() - interval '25 days'
FROM client_data;

-- Add some additional team members to some clients
WITH client_profiles AS (
  SELECT client_id FROM public.profiles WHERE role = 'admin' AND client_id LIKE 'client_%'
)
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id,
  onboarded_at,
  created_at
)
SELECT 
  gen_random_uuid(),
  agent_name.first_name,
  agent_name.last_name,
  'agent',
  cp.client_id,
  now() - interval '20 days',
  now() - interval '20 days'
FROM client_profiles cp
CROSS JOIN (
  VALUES 
    ('Emma', 'Brown'),
    ('James', 'Taylor'),
    ('Lisa', 'Anderson')
) AS agent_name(first_name, last_name)
WHERE cp.client_id IN ('client_acme_001', 'client_prime_004', 'client_elite_003')
LIMIT 6;