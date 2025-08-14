-- Fix analytics_metrics RLS policy to restrict access to client-specific data
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view analytics_metrics" ON public.analytics_metrics;

-- Add client_id column to analytics_metrics table if it doesn't exist
ALTER TABLE public.analytics_metrics ADD COLUMN IF NOT EXISTS client_id text;

-- Create a proper RLS policy that restricts access to same client
CREATE POLICY "Users can view analytics for their client only" 
ON public.analytics_metrics 
FOR SELECT 
USING (client_id = get_current_client_id());

-- Update existing policies to ensure they also check client_id
DROP POLICY IF EXISTS "Agents and admins can insert analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "Agents and admins can update analytics_metrics" ON public.analytics_metrics;

-- Recreate insert policy with client restriction
CREATE POLICY "Agents and admins can insert analytics_metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND COALESCE(analytics_metrics.client_id, get_current_client_id()) = p.client_id
  )
);

-- Recreate update policy with client restriction
CREATE POLICY "Agents and admins can update analytics_metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND analytics_metrics.client_id = p.client_id
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('agent', 'admin') 
    AND analytics_metrics.client_id = p.client_id
  )
);

-- Add trigger to automatically set client_id from user's profile
CREATE TRIGGER set_analytics_client_id_trigger
BEFORE INSERT ON public.analytics_metrics
FOR EACH ROW
EXECUTE FUNCTION public.set_client_id_from_profile();