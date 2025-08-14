-- Fix profiles table RLS policies using existing security definer functions
-- Drop the problematic policies I just created
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_management" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_access" ON public.profiles;

-- Create new safe policies using existing security definer functions
CREATE POLICY "profiles_own_access" 
ON public.profiles 
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_access" 
ON public.profiles 
FOR ALL
USING (
  user_id != auth.uid() AND 
  is_current_user_admin_safe() AND 
  client_id = get_current_client_id()
)
WITH CHECK (
  is_current_user_admin_safe() AND 
  client_id = get_current_client_id()
);

CREATE POLICY "profiles_super_admin_full_access" 
ON public.profiles 
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