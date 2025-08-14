-- Update existing admin user to super_admin for testing
UPDATE profiles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE role = 'admin' 
  LIMIT 1
);