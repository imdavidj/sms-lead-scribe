-- Re-apply: harden helper function and enable RLS on clients (no IF NOT EXISTS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view clients"
ON public.clients
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update clients"
ON public.clients
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
USING (public.get_current_user_role() = 'admin');