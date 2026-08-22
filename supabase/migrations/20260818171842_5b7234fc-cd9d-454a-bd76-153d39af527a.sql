
-- Create stop_status enum
CREATE TYPE public.stop_status AS ENUM ('pending', 'arrived', 'departed', 'skipped');

-- Create stop_type enum
CREATE TYPE public.stop_type AS ENUM ('pickup', 'delivery');

-- Create sla_status enum
CREATE TYPE public.sla_status AS ENUM ('on_track', 'at_risk', 'met', 'breached');

-- Create load_stops table
CREATE TABLE public.load_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    stop_number INTEGER NOT NULL,
    location_address TEXT NOT NULL,
    stop_type public.stop_type NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    scheduled_departure TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    status public.stop_status DEFAULT 'pending' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add SLA fields to loads table
ALTER TABLE public.loads 
ADD COLUMN sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN sla_status public.sla_status DEFAULT 'on_track' NOT NULL,
ADD COLUMN actual_completion_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN sla_breach_notified BOOLEAN DEFAULT FALSE;

-- Enable RLS on load_stops
ALTER TABLE public.load_stops ENABLE ROW LEVEL SECURITY;

-- Grant access to load_stops
GRANT SELECT, INSERT, UPDATE, DELETE ON public.load_stops TO authenticated;
GRANT ALL ON public.load_stops TO service_role;

-- Policies for load_stops
CREATE POLICY "Admins can do everything on load_stops"
ON public.load_stops
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shippers can view and manage stops for their loads"
ON public.load_stops
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.shippers s ON l.shipper_id = s.id
        WHERE l.id = load_stops.load_id
        AND s.portal_user_id = auth.uid()
    )
);

CREATE POLICY "Carriers can view stops for assigned loads"
ON public.load_stops
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.carriers c ON l.carrier_id = c.id
        WHERE l.id = load_stops.load_id
        AND c.portal_user_id = auth.uid()
    )
);

-- Function to update load SLA status based on stops and actual times
CREATE OR REPLACE FUNCTION public.calculate_load_sla_status()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_deadline TIMESTAMP WITH TIME ZONE;
    v_actual_completion TIMESTAMP WITH TIME ZONE;
    v_new_status public.sla_status;
BEGIN
    -- Get load info
    SELECT sla_deadline, actual_completion_time INTO v_sla_deadline, v_actual_completion
    FROM public.loads WHERE id = NEW.load_id;

    IF v_sla_deadline IS NULL THEN
        RETURN NEW;
    END IF;

    -- If final delivery is done (last stop departed)
    IF NEW.stop_type = 'delivery' AND NEW.status = 'departed' AND 
       NOT EXISTS (SELECT 1 FROM public.load_stops WHERE load_id = NEW.load_id AND stop_number > NEW.stop_number) THEN
        
        UPDATE public.loads SET actual_completion_time = NEW.actual_departure WHERE id = NEW.load_id;
        v_actual_completion := NEW.actual_departure;
        
        IF v_actual_completion <= v_sla_deadline THEN
            v_new_status := 'met';
        ELSE
            v_new_status := 'breached';
        END IF;
    ELSE
        -- Still in progress
        IF now() > v_sla_deadline THEN
            v_new_status := 'breached';
        ELSIF now() > (v_sla_deadline - interval '4 hours') THEN
            v_new_status := 'at_risk';
        ELSE
            v_new_status := 'on_track';
        END IF;
    END IF;

    UPDATE public.loads SET sla_status = v_new_status WHERE id = NEW.load_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_load_sla_on_stop_change
AFTER UPDATE ON public.load_stops
FOR EACH ROW
EXECUTE FUNCTION public.calculate_load_sla_status();
