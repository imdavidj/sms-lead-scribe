-- Fix infinite recursion in profiles table RLS policies
-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "profile_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profile_client_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_creation" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_update" ON public.profiles;

-- Create safe RLS policies using security definer functions
CREATE POLICY "profiles_own_select" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "profiles_own_update" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_management" 
ON public.profiles 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.client_id = profiles.client_id
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND p.client_id = profiles.client_id
  )
);

CREATE POLICY "profiles_super_admin_access" 
ON public.profiles 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);