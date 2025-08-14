-- Fix infinite recursion in profiles table RLS policies
-- Drop ALL existing policies on profiles table to start fresh

DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Get all policy names for the profiles table and drop them
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles';
    END LOOP;
END
$$;

-- Create new secure policies that don't cause infinite recursion
-- Policy 1: Users can view their own profile
CREATE POLICY "profile_own_select" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Users can view profiles in the same client
CREATE POLICY "profile_client_select" 
ON public.profiles 
FOR SELECT 
USING (
  user_id != auth.uid() AND
  client_id = (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    LIMIT 1
  )
);

-- Policy 3: Users can update their own profile but not change role
CREATE POLICY "profile_own_update" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin_safe()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Policy 4: Admins can update profiles in their client
CREATE POLICY "profile_admin_update" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
)
WITH CHECK (
  public.is_current_user_admin_safe() AND
  client_id = get_current_client_id()
);

-- Policy 5: Allow profile creation during signup or by admins
CREATE POLICY "profile_creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow during user signup (when no profile exists yet)
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
  OR 
  -- Allow admins to create profiles
  public.is_current_user_admin_safe()
);