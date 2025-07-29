-- Add date_added column to leads table for consistency with the user's query pattern
ALTER TABLE public.leads ADD COLUMN date_added TIMESTAMP WITH TIME ZONE DEFAULT now();