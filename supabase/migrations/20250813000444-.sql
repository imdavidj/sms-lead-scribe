-- Secure contacts SELECT access: restrict to agent/admin only
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;

CREATE POLICY "Agents and admins can view contacts (restricted)"
ON public.contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin')
  )
);
