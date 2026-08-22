-- Create priority enum
DO $$ BEGIN
    CREATE TYPE public.load_priority AS ENUM ('normal', 'priority', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add priority to loads table
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS priority public.load_priority NOT NULL DEFAULT 'normal';

-- Grant access
GRANT ALL ON public.loads TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.loads TO authenticated;
