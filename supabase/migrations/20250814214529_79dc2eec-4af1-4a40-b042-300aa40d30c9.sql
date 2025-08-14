-- Insert dummy client data that works with existing system constraints
-- We'll create clients without foreign key constraints and then add the profiles separately

-- First, let's temporarily remove the foreign key constraint to allow dummy data
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_created_by_user_id_fkey;

-- Insert dummy clients 
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Acme Real Estate',
  'admin@acmerealestate.com',
  '+15551234567',
  'Acme Real Estate',
  '11111111-1111-1111-1111-111111111111'::uuid,
  'active',
  'professional',
  'api_key_acme_001',
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-01-15 10:00:00'::timestamp
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Downtown Property Solutions',
  'admin@downtownproperties.com',
  '+15559876543',
  'Downtown Property Solutions',
  '22222222-2222-2222-2222-222222222222'::uuid,
  'active',
  'basic',
  'api_key_downtown_002',
  '{"company": true, "twilio": false, "complete": false}'::jsonb,
  false,
  false,
  '2024-02-01 14:30:00'::timestamp
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Elite Home Buyers',
  'admin@elitehomebuyers.com',
  '+15551122334',
  'Elite Home Buyers',
  '33333333-3333-3333-3333-333333333333'::uuid,
  'trial',
  'basic',
  'api_key_elite_003',
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-02-20 09:15:00'::timestamp
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Prime Investors Group',
  'admin@primeinvestors.com',
  '+15554455667',
  'Prime Investors Group',
  '44444444-4444-4444-4444-444444444444'::uuid,
  'active',
  'enterprise',
  'api_key_prime_004',
  '{"company": true, "twilio": true, "complete": true}'::jsonb,
  true,
  true,
  '2024-01-30 16:45:00'::timestamp
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Sunset Properties',
  'admin@sunsetproperties.com',
  '+15557788990',
  'Sunset Properties',
  '55555555-5555-5555-5555-555555555555'::uuid,
  'trial',
  'basic',
  'api_key_sunset_005',
  '{"company": false, "twilio": false, "complete": false}'::jsonb,
  false,
  false,
  '2024-03-01 11:20:00'::timestamp
);

-- Create dummy profiles for admin users of these clients
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id,
  onboarded_at,
  created_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'John',
  'Smith',
  'admin',
  'client_acme_001',
  now() - interval '30 days',
  now() - interval '30 days'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Sarah',
  'Johnson',
  'admin',
  'client_downtown_002',
  now() - interval '25 days',
  now() - interval '25 days'
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Michael',
  'Williams',
  'admin',
  'client_elite_003',
  now() - interval '20 days',
  now() - interval '20 days'
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Jennifer',
  'Davis',
  'admin',
  'client_prime_004',
  now() - interval '35 days',
  now() - interval '35 days'
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  'David',
  'Wilson',
  'admin',
  'client_sunset_005',
  now() - interval '10 days',
  now() - interval '10 days'
);

-- Create client_config entries for each dummy client
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
);

-- Add some team members to selected clients
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id,
  onboarded_at,
  created_at
) VALUES
-- Acme Real Estate team
(
  gen_random_uuid(),
  'Emma',
  'Brown',
  'agent',
  'client_acme_001',
  now() - interval '20 days',
  now() - interval '20 days'
),
(
  gen_random_uuid(),
  'James',
  'Taylor',
  'agent',
  'client_acme_001',
  now() - interval '18 days',
  now() - interval '18 days'
),
-- Prime Investors Group team
(
  gen_random_uuid(),
  'Lisa',
  'Anderson',
  'agent',
  'client_prime_004',
  now() - interval '22 days',
  now() - interval '22 days'
),
(
  gen_random_uuid(),
  'Robert',
  'Miller',
  'agent',
  'client_prime_004',
  now() - interval '15 days',
  now() - interval '15 days'
),
-- Elite Home Buyers team
(
  gen_random_uuid(),
  'Amanda',
  'Garcia',
  'agent',
  'client_elite_003',
  now() - interval '12 days',
  now() - interval '12 days'
);