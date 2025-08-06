-- Add key_points and word_count columns to summaries table
ALTER TABLE public.summaries 
ADD COLUMN key_points text[], 
ADD COLUMN word_count integer;

-- Add index for better performance on word_count queries
CREATE INDEX idx_summaries_word_count ON public.summaries(word_count);

-- Add index for better performance on key_points queries
CREATE INDEX idx_summaries_key_points ON public.summaries USING GIN(key_points);
