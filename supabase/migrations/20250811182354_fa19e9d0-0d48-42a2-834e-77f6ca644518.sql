-- Add unique constraint on phone column for leads table to support proper upserts
ALTER TABLE public.leads 
ADD CONSTRAINT leads_phone_unique UNIQUE (phone);