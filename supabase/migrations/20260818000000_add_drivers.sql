-- Create drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    license_number TEXT,
    license_state TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add driver_id to loads table
ALTER TABLE public.loads ADD COLUMN driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;

-- Policies for drivers
CREATE POLICY "Admins can do everything with drivers"
ON public.drivers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Carriers can manage their own drivers"
ON public.drivers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = drivers.carrier_id
    )
);

CREATE POLICY "Shippers can view drivers assigned to their loads"
ON public.drivers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads
        WHERE loads.driver_id = drivers.id
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = loads.shipper_id
        )
    )
);

-- Policies for loads update (to allow driver assignment)
CREATE POLICY "Admins can assign drivers to loads"
ON public.loads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update updated_at trigger for drivers
CREATE TRIGGER set_updated_at_drivers
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

