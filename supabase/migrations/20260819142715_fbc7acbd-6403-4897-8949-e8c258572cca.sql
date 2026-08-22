ALTER TABLE public.notifications ADD COLUMN severity text DEFAULT 'info';

-- Update the existing notifications to have a severity based on type
UPDATE public.notifications SET severity = 'high' WHERE type IN ('delayed', 'exception_raised');
UPDATE public.notifications SET severity = 'medium' WHERE type IN ('delivery_approaching', 'carrier_assigned');
