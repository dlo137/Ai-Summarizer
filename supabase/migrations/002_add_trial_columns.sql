-- Add trial columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE; 