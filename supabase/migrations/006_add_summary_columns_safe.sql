-- Safe migration to add columns only if they don't exist
DO $$ 
BEGIN
    -- Add key_points column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summaries' 
        AND column_name = 'key_points'
    ) THEN
        ALTER TABLE public.summaries ADD COLUMN key_points text[];
    END IF;

    -- Add word_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'summaries' 
        AND column_name = 'word_count'
    ) THEN
        ALTER TABLE public.summaries ADD COLUMN word_count integer;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_summaries_word_count ON public.summaries(word_count);
CREATE INDEX IF NOT EXISTS idx_summaries_key_points ON public.summaries USING GIN(key_points);
