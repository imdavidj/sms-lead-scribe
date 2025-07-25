-- Clean up duplicate conversations and fix phone number format
-- First, close duplicate conversations, keeping only the most recent one for each contact
WITH ranked_conversations AS (
  SELECT id, contact_id, 
         ROW_NUMBER() OVER (PARTITION BY contact_id ORDER BY created_at DESC) as rn
  FROM conversations 
  WHERE status = 'open'
)
UPDATE conversations 
SET status = 'closed'
WHERE id IN (
  SELECT id FROM ranked_conversations WHERE rn > 1
);

-- Fix the malformed phone number
UPDATE contacts 
SET phone_e164 = '+14804947157' 
WHERE phone_e164 = '+=+14804947157';