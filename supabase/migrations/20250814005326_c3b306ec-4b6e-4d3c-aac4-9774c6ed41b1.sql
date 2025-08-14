-- Insert profile for current user
INSERT INTO public.profiles (user_id, first_name, last_name, role, client_id)
VALUES (
  'e2b1daa5-ed55-4557-ae37-72153f356582',
  'David',
  'Johnson', 
  'admin',
  'default'
) ON CONFLICT (user_id) DO UPDATE SET
  client_id = 'default',
  role = 'admin';