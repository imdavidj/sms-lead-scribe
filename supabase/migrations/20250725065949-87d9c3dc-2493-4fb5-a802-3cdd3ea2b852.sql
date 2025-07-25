-- First, close duplicate conversations for the same contact
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

-- Move messages from the duplicate contact to the correct contact
UPDATE messages 
SET conversation_id = (
  SELECT c.id 
  FROM conversations c 
  JOIN contacts ct ON c.contact_id = ct.id 
  WHERE ct.phone_e164 = '+14804947157' AND c.status = 'open'
  LIMIT 1
)
WHERE conversation_id IN (
  SELECT c.id 
  FROM conversations c 
  JOIN contacts ct ON c.contact_id = ct.id 
  WHERE ct.phone_e164 = '+=+14804947157'
);

-- Delete conversations for the malformed contact
DELETE FROM conversations 
WHERE contact_id IN (
  SELECT id FROM contacts WHERE phone_e164 = '+=+14804947157'
);

-- Delete the malformed contact
DELETE FROM contacts WHERE phone_e164 = '+=+14804947157';