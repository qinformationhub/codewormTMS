-- Migration to ensure driver_id exists on loads FIRST
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS driver_id UUID;
