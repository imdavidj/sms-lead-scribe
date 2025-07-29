-- Create analytics_metrics table for storing pre-calculated KPIs
CREATE TABLE public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  response_rate TEXT,
  qualification_rate TEXT,
  block_rate TEXT,
  avg_time_to_qualify TEXT,
  leads_per_day TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_metrics access
CREATE POLICY "Authenticated users can view analytics_metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Agents and admins can insert analytics_metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('agent', 'admin')
));

CREATE POLICY "Agents and admins can update analytics_metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('agent', 'admin')
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analytics_metrics_updated_at
BEFORE UPDATE ON public.analytics_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.analytics_metrics (response_rate, qualification_rate, block_rate, avg_time_to_qualify, leads_per_day)
VALUES ('45%', '30%', '5%', '12h 30m', '120');