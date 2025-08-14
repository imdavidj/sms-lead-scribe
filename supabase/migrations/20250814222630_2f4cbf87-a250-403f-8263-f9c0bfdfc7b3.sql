-- Fix super admin access by updating RLS policies properly

-- First, create a super admin profile for the main user
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id
) 
SELECT 
  u.id,
  'David',
  'Super Admin',
  'super_admin',
  'super_admin_client'
FROM auth.users u 
WHERE u.email = 'david@americashomeoffer.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  client_id = 'super_admin_client';

-- Drop problematic policies that query auth.users directly
DROP POLICY IF EXISTS "client_config_super_admin_access" ON public.client_config;
DROP POLICY IF EXISTS "profiles_super_admin_full_access" ON public.profiles;

-- Create proper super admin policies using the is_super_admin() function
CREATE POLICY "client_config_super_admin_access" 
ON public.client_config 
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "profiles_super_admin_full_access" 
ON public.profiles 
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Ensure impersonation_logs has proper super admin access
DROP POLICY IF EXISTS "Super admins can create impersonation logs" ON public.impersonation_logs;
DROP POLICY IF EXISTS "Super admins can update impersonation logs" ON public.impersonation_logs;
DROP POLICY IF EXISTS "Super admins can view all impersonation logs" ON public.impersonation_logs;

CREATE POLICY "Super admins can create impersonation logs" 
ON public.impersonation_logs 
FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update impersonation logs" 
ON public.impersonation_logs 
FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can view all impersonation logs" 
ON public.impersonation_logs 
FOR SELECT
USING (public.is_super_admin());

-- Create demo profiles to match the client_config data
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  role,
  client_id
) VALUES
(gen_random_uuid(), 'John', 'Smith', 'admin', 'client_acme_001'),
(gen_random_uuid(), 'Sarah', 'Johnson', 'admin', 'client_downtown_002'),
(gen_random_uuid(), 'Mike', 'Davis', 'admin', 'client_elite_003'),
(gen_random_uuid(), 'Lisa', 'Wilson', 'admin', 'client_prime_004'),
(gen_random_uuid(), 'Tom', 'Brown', 'admin', 'client_sunset_005')
ON CONFLICT (user_id) DO NOTHING;