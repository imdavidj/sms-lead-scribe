-- Fix contacts table security issues
-- The main problem is that client_id is nullable which can bypass RLS policies

-- First, update existing contacts to have a client_id if they don't have one
-- This is a data cleanup step
UPDATE public.contacts 
SET client_id = 'migration_required' 
WHERE client_id IS NULL;

-- Make client_id non-nullable to prevent security bypass
ALTER TABLE public.contacts 
ALTER COLUMN client_id SET NOT NULL;

-- Add a default value for client_id
ALTER TABLE public.contacts 
ALTER COLUMN client_id SET DEFAULT get_current_client_id();

-- Drop existing potentially vulnerable policies
DROP POLICY IF EXISTS "Agents/Admins insert contacts in own client" ON public.contacts;
DROP POLICY IF EXISTS "Agents/Admins select contacts in own client" ON public.contacts;
DROP POLICY IF EXISTS "Agents/Admins update contacts in own client" ON public.contacts;

-- Create more secure RLS policies with explicit client_id checks
CREATE POLICY "Agents and admins can select contacts in own client" 
ON public.contacts 
FOR SELECT 
USING (
  client_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "Agents and admins can insert contacts in own client" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  client_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = COALESCE(contacts.client_id, get_current_client_id())
  )
);

CREATE POLICY "Agents and admins can update contacts in own client" 
ON public.contacts 
FOR UPDATE 
USING (
  client_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
) 
WITH CHECK (
  client_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND p.client_id = contacts.client_id
  )
);

-- Add DELETE policy for admins only
CREATE POLICY "Admins can delete contacts in own client" 
ON public.contacts 
FOR DELETE 
USING (
  client_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin' 
    AND p.client_id = contacts.client_id
  )
);

-- Add trigger to automatically set client_id from user's profile
CREATE TRIGGER set_contacts_client_id_trigger
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_client_id_from_profile();

-- Add constraint to ensure phone numbers are properly formatted (basic validation)
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_phone_format_check 
CHECK (phone_e164 ~ '^\+[1-9]\d{1,14}$');

-- Add unique constraint to prevent duplicate contacts within same client
CREATE UNIQUE INDEX IF NOT EXISTS contacts_client_phone_unique 
ON public.contacts (client_id, phone_e164);

-- Create an audit function for contact access (for monitoring)
CREATE OR REPLACE FUNCTION public.log_contact_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function can be used to log access to contacts for security monitoring
  -- For now, it's a placeholder that could be extended with actual logging
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add comment to document the security requirements
COMMENT ON TABLE public.contacts IS 'Contains sensitive customer contact information. Access is strictly controlled by RLS policies based on client_id and user roles. client_id must never be NULL.';