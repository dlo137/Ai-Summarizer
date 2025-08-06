-- Add subscription_end_date column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Update existing profiles with null subscription_end_date
UPDATE profiles 
SET subscription_end_date = NULL 
WHERE subscription_end_date IS NULL;
