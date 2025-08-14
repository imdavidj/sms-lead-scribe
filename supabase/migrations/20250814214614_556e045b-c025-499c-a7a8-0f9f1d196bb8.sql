-- Create dummy client data for testing super admin functionality
-- We'll work around the foreign key constraints by creating minimal test data

-- Just create client_config entries that can be viewed by super admin
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
  'demo_client_001',
  'Acme Real Estate Demo',
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
  'demo_client_002',
  'Downtown Properties Demo',
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
  'demo_client_003',
  'Elite Buyers Demo',
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
  'demo_client_004',
  'Prime Investors Demo',
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
  'demo_client_005',
  'Sunset Properties Demo',
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

-- Create some dummy leads for these demo clients to make it more realistic
INSERT INTO public.leads (
  client_id,
  first_name,
  last_name,
  phone,
  email,
  address,
  city,
  state,
  zip,
  status,
  ai_tag,
  list_name,
  created_at
) VALUES
-- Acme Real Estate leads
(
  'demo_client_001',
  'Robert',
  'Johnson',
  '+15551111001',
  'robert.johnson@email.com',
  '123 Main St',
  'Dallas',
  'TX',
  '75201',
  'Interested',
  'hot_lead',
  'Q1 2024 Leads',
  now() - interval '2 days'
),
(
  'demo_client_001',
  'Mary',
  'Williams',
  '+15551111002',
  'mary.williams@email.com',
  '456 Oak Ave',
  'Dallas',
  'TX',
  '75202',
  'Qualified',
  'qualified',
  'Q1 2024 Leads',
  now() - interval '5 days'
),
-- Prime Investors leads
(
  'demo_client_004',
  'David',
  'Brown',
  '+15554444001',
  'david.brown@email.com',
  '789 Pine St',
  'Houston',
  'TX',
  '77001',
  'Interested',
  'warm_lead',
  'Houston Properties',
  now() - interval '1 day'
),
(
  'demo_client_004',
  'Sarah',
  'Davis',
  '+15554444002',
  'sarah.davis@email.com',
  '321 Elm St',
  'Houston',
  'TX',
  '77002',
  'No Response',
  'cold_lead',
  'Houston Properties',
  now() - interval '7 days'
),
-- Elite Buyers leads
(
  'demo_client_003',
  'Jennifer',
  'Wilson',
  '+15553333001',
  'jennifer.wilson@email.com',
  '654 Maple Dr',
  'Austin',
  'TX',
  '78701',
  'Qualified',
  'qualified',
  'Austin Market',
  now() - interval '3 days'
);

-- Create some dummy contacts for these clients
INSERT INTO public.contacts (
  client_id,
  phone_e164,
  first_name,
  last_name,
  created_at
) VALUES
(
  'demo_client_001',
  '+15551111001',
  'Robert',
  'Johnson',
  now() - interval '2 days'
),
(
  'demo_client_001',
  '+15551111002',
  'Mary',
  'Williams',
  now() - interval '5 days'
),
(
  'demo_client_004',
  '+15554444001',
  'David',
  'Brown',
  now() - interval '1 day'
),
(
  'demo_client_004',
  '+15554444002',
  'Sarah',
  'Davis',
  now() - interval '7 days'
),
(
  'demo_client_003',
  '+15553333001',
  'Jennifer',
  'Wilson',
  now() - interval '3 days'
);