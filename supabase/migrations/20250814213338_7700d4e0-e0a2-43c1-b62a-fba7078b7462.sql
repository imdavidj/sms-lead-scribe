-- Add super_admin role and impersonation logging

-- First, create super_admin role enum value
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('agent', 'admin', 'super_admin');
    ELSE
        -- Add super_admin if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')) THEN
            ALTER TYPE user_role_enum ADD VALUE 'super_admin';
        END IF;
    END IF;
END $$;

-- Create impersonation log table for audit trail
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_user_id UUID NOT NULL,
    impersonated_client_id TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on impersonation_logs
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to access impersonation logs
CREATE POLICY "Super admins can view all impersonation logs" 
ON public.impersonation_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Create policy for super admins to insert impersonation logs
CREATE POLICY "Super admins can create impersonation logs" 
ON public.impersonation_logs 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Create policy for super admins to update impersonation logs (to end sessions)
CREATE POLICY "Super admins can update impersonation logs" 
ON public.impersonation_logs 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Create function to get all clients for super admin
CREATE OR REPLACE FUNCTION public.get_all_clients_for_super_admin()
RETURNS TABLE(
    client_id TEXT,
    client_name TEXT,
    company TEXT,
    email TEXT,
    subscription_status TEXT,
    subscription_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_users BIGINT,
    sms_used INTEGER,
    sms_limit INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    p.client_id,
    c.name as client_name,
    c.company,
    c.email,
    c.subscription_status,
    c.subscription_plan,
    c.created_at,
    COUNT(DISTINCT p2.user_id) as total_users,
    COALESCE(cc.sms_used, 0) as sms_used,
    COALESCE(cc.sms_limit, 100) as sms_limit
  FROM public.profiles p
  LEFT JOIN public.clients c ON c.created_by_user_id = p.user_id
  LEFT JOIN public.profiles p2 ON p2.client_id = p.client_id
  LEFT JOIN public.client_config cc ON cc.client_id = p.client_id
  WHERE p.role = 'admin' 
    AND c.id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles sp 
      WHERE sp.user_id = auth.uid() 
      AND sp.role = 'super_admin'
    )
  GROUP BY p.client_id, c.name, c.company, c.email, c.subscription_status, c.subscription_plan, c.created_at, cc.sms_used, cc.sms_limit
  ORDER BY c.created_at DESC;
$$;

-- Create function to start impersonation session
CREATE OR REPLACE FUNCTION public.start_impersonation(
    target_client_id TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Check if user is super admin
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Access denied: Super admin role required';
    END IF;
    
    -- Verify target client exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE client_id = target_client_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Target client not found';
    END IF;
    
    -- End any existing impersonation sessions for this user
    UPDATE public.impersonation_logs 
    SET ended_at = now() 
    WHERE super_admin_user_id = auth.uid() 
    AND ended_at IS NULL;
    
    -- Create new impersonation log
    INSERT INTO public.impersonation_logs (
        super_admin_user_id,
        impersonated_client_id,
        reason
    ) VALUES (
        auth.uid(),
        target_client_id,
        reason
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Create function to end impersonation session
CREATE OR REPLACE FUNCTION public.end_impersonation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if user is super admin
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Access denied: Super admin role required';
    END IF;
    
    -- End current impersonation session
    UPDATE public.impersonation_logs 
    SET ended_at = now() 
    WHERE super_admin_user_id = auth.uid() 
    AND ended_at IS NULL;
    
    RETURN true;
END;
$$;

-- Create function to get current impersonation status
CREATE OR REPLACE FUNCTION public.get_current_impersonation()
RETURNS TABLE(
    log_id UUID,
    impersonated_client_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    id as log_id,
    impersonated_client_id,
    started_at,
    reason
  FROM public.impersonation_logs 
  WHERE super_admin_user_id = auth.uid() 
  AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
$$;