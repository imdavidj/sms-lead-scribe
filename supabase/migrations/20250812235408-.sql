-- SECURITY HARDENING MIGRATION
-- 1) Remove overly permissive SELECT policies to enforce tenant isolation
DROP POLICY IF EXISTS "allow_read_any" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;

DROP POLICY IF EXISTS "allow_read_any" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can view conversations" ON public.conversations;

DROP POLICY IF EXISTS "allow_read_any" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;

DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- 2) Restrict subscribers updates to the owner only
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING ((user_id = auth.uid()) OR (email = auth.email()));

-- 3) Prevent non-admins from changing their role; allow admins to update any profile
-- Drop the broad self-update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a SECURITY DEFINER helper to avoid recursive RLS issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Non-admins: can update their own profile but role must remain unchanged
CREATE POLICY "Users can update own profile (no role change)"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (role = public.get_current_user_role());

-- Admins: can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin');