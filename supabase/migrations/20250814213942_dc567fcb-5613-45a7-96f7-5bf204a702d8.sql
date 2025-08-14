-- Update the check constraint to allow super_admin role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint that includes super_admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('agent', 'admin', 'super_admin'));

-- Now update existing admin user to super_admin for testing
UPDATE profiles 
SET role = 'super_admin' 
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE role = 'admin' 
  LIMIT 1
);