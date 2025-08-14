-- Fix critical security vulnerability in profiles table
-- Drop the overly permissive policy that allows any authenticated user to see all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies that respect client boundaries
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can view profiles within their same client (for team collaboration)
CREATE POLICY "Users can view profiles in same client" 
ON public.profiles 
FOR SELECT 
USING (client_id = get_current_client_id());

-- Admins can view all profiles within their client (for user management)
CREATE POLICY "Admins can view client profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin' 
    AND admin_profile.client_id = profiles.client_id
  )
);