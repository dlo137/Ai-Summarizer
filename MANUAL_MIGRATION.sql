-- MANUAL MIGRATION SCRIPT
-- Copy and paste this into your Supabase SQL Editor to add the missing columns

-- Add key_points and word_count columns to summaries table
ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS key_points text[], 
ADD COLUMN IF NOT EXISTS word_count integer;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_summaries_word_count ON public.summaries(word_count);
CREATE INDEX IF NOT EXISTS idx_summaries_key_points ON public.summaries USING GIN(key_points);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'summaries' 
ORDER BY ordinal_position;
