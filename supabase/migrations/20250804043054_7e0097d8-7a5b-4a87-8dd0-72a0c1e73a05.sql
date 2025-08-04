-- Add AI classification fields to leads table
ALTER TABLE public.leads 
ADD COLUMN ai_tag TEXT,
ADD COLUMN ai_classification_reason TEXT,
ADD COLUMN last_classification_at TIMESTAMP WITH TIME ZONE;