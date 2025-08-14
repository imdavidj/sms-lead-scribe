-- Enable RLS on remaining tables and add necessary policies

-- Enable RLS on client_config
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lead_phone_mapping  
ALTER TABLE public.lead_phone_mapping ENABLE ROW LEVEL SECURITY;

-- Create policies for client_config table
CREATE POLICY "Select client config in own client" ON public.client_config
FOR SELECT USING (client_id = get_current_client_id());

CREATE POLICY "Insert client config (agents/admins)" ON public.client_config
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND COALESCE(client_config.client_id, get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update client config (agents/admins)" ON public.client_config
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND client_config.client_id = p.client_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND client_config.client_id = p.client_id
  )
);

-- Create policies for lead_phone_mapping table
CREATE POLICY "Select lead phone mapping in own client" ON public.lead_phone_mapping
FOR SELECT USING (client_id = get_current_client_id());

CREATE POLICY "Insert lead phone mapping (agents/admins)" ON public.lead_phone_mapping
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND COALESCE(lead_phone_mapping.client_id, get_current_client_id()) = p.client_id
  )
);

CREATE POLICY "Update lead phone mapping (agents/admins)" ON public.lead_phone_mapping
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND lead_phone_mapping.client_id = p.client_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY['agent', 'admin'])
    AND lead_phone_mapping.client_id = p.client_id
  )
);