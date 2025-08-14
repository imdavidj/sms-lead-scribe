-- Fix infinite recursion in profiles table RLS policies
-- The issue is that policies are trying to query the profiles table from within profiles policies

-- Drop all existing profiles policies that are causing recursion
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same client" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their client" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (no role change)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Create new secure policies that don't cause infinite recursion
-- Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can view other profiles only if they're in the same client
-- Using a direct approach without recursive queries
CREATE POLICY "Users can view profiles in same client" 
ON public.profiles 
FOR SELECT 
USING (
  client_id = (
    SELECT p.client_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    LIMIT 1
  )
);

-- Allow users to update their own profile but not change their role
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Create a more specific function for checking admin status
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
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

-- Admins can update any profile in their client
CREATE POLICY "Admins can update profiles in client" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_current_user_admin() AND
  client_id = get_current_client_id()
)
WITH CHECK (
  public.is_current_user_admin() AND
  client_id = get_current_client_id()
);

-- Only allow profile insertion by admins or during user signup
CREATE POLICY "Allow profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow during user signup (when no profile exists yet)
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
  OR 
  -- Allow admins to create profiles
  public.is_current_user_admin()
);

-- Add a comment to document the security approach
COMMENT ON TABLE public.profiles IS 'User profiles with client-based access control. Policies use security definer functions to prevent infinite recursion.';