-- 1) Add client scoping on user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id text NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles (client_id);

-- 2) Helper to fetch current user's client_id (avoids recursive policy lookups)
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT client_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 3) Trigger to auto-fill client_id from the user's profile on insert
CREATE OR REPLACE FUNCTION public.set_client_id_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    NEW.client_id := public.get_current_client_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers to all tenant-scoped tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_contacts_client_id_from_profile') THEN
    CREATE TRIGGER set_contacts_client_id_from_profile
    BEFORE INSERT ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.set_client_id_from_profile();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_leads_client_id_from_profile') THEN
    CREATE TRIGGER set_leads_client_id_from_profile
    BEFORE INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.set_client_id_from_profile();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_conversations_client_id_from_profile') THEN
    CREATE TRIGGER set_conversations_client_id_from_profile
    BEFORE INSERT ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.set_client_id_from_profile();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_messages_client_id_from_profile') THEN
    CREATE TRIGGER set_messages_client_id_from_profile
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.set_client_id_from_profile();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_import_jobs_client_id_from_profile') THEN
    CREATE TRIGGER set_import_jobs_client_id_from_profile
    BEFORE INSERT ON public.import_jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_client_id_from_profile();
  END IF;
END $$;

-- 4) RLS: enforce strict tenant isolation via profiles.client_id
-- Contacts
DROP POLICY IF EXISTS "Agents and admins can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents and admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Agents and admins can view contacts (restricted)" ON public.contacts;

CREATE POLICY "Agents/Admins select contacts in own client"
ON public.contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND p.client_id = contacts.client_id
  )
);

CREATE POLICY "Agents/Admins insert contacts in own client"
ON public.contacts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('agent','admin')
      AND p.client_id = COALESCE(contacts.client_id, public.get_current_client_id())
  )
);

CREATE POLICY "Agents/Admins update contacts in own client"
ON public.contacts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND p.client_id = contacts.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND p.client_id = contacts.client_id
  )
);

-- Leads
DROP POLICY IF EXISTS "Agents and admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Agents and admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;

CREATE POLICY "Select leads in own client"
ON public.leads
FOR SELECT
USING (
  leads.client_id = public.get_current_client_id()
);

CREATE POLICY "Insert leads in own client (agents/admins)"
ON public.leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin')
      AND COALESCE(leads.client_id, public.get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update leads in own client (agents/admins)"
ON public.leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND leads.client_id = p.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND leads.client_id = p.client_id
  )
);

CREATE POLICY "Delete leads in own client (admins)"
ON public.leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND leads.client_id = p.client_id
  )
);

-- Conversations
DROP POLICY IF EXISTS "Agents and admins can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Agents and admins can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Only admins can delete conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Select conversations in own client"
ON public.conversations
FOR SELECT
USING (
  conversations.client_id = public.get_current_client_id()
);

CREATE POLICY "Insert conversations in own client (agents/admins)"
ON public.conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin')
      AND COALESCE(conversations.client_id, public.get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update conversations in own client (agents/admins)"
ON public.conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND conversations.client_id = p.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND conversations.client_id = p.client_id
  )
);

CREATE POLICY "Delete conversations in own client (admins)"
ON public.conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND conversations.client_id = p.client_id
  )
);

-- Messages
DROP POLICY IF EXISTS "Agents and admins can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Agents and admins can update messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

CREATE POLICY "Select messages in own client"
ON public.messages
FOR SELECT
USING (
  messages.client_id = public.get_current_client_id()
);

CREATE POLICY "Insert messages in own client (agents/admins)"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin')
      AND COALESCE(messages.client_id, public.get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update messages in own client (agents/admins)"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND messages.client_id = p.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND messages.client_id = p.client_id
  )
);

-- Import jobs
DROP POLICY IF EXISTS "Users can view own import jobs" ON public.import_jobs;

CREATE POLICY "Select import jobs in own client"
ON public.import_jobs
FOR SELECT
USING (
  import_jobs.client_id = public.get_current_client_id()
);

CREATE POLICY "Insert import jobs in own client (agents/admins)"
ON public.import_jobs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin')
      AND COALESCE(import_jobs.client_id, public.get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update import jobs in own client (agents/admins)"
ON public.import_jobs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND import_jobs.client_id = p.client_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('agent','admin') AND import_jobs.client_id = p.client_id
  )
);
