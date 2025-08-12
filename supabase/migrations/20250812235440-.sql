-- Fix linter warnings
-- 1) Harden helper function with explicit search_path per security best practices
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 2) Enable RLS on public.clients and restrict access to admins only
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admins can view clients
CREATE POLICY IF NOT EXISTS "Admins can view clients"
ON public.clients
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Admins can insert clients
CREATE POLICY IF NOT EXISTS "Admins can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

-- Admins can update clients
CREATE POLICY IF NOT EXISTS "Admins can update clients"
ON public.clients
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

-- Admins can delete clients
CREATE POLICY IF NOT EXISTS "Admins can delete clients"
ON public.clients
FOR DELETE
USING (public.get_current_user_role() = 'admin');