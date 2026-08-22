-- Complete Driver Management Module Implementation
-- This migration creates the drivers table and integrates it with loads

-- 1. Create Drivers table (expanded schema)
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    license_number TEXT,
    license_state TEXT,
    license_type TEXT,
    license_expiration DATE,
    certification_name TEXT,
    certification_expiration DATE,
    date_of_birth DATE,
    employment_type TEXT CHECK (employment_type IN ('employee', 'contractor')),
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'assigned', 'unavailable', 'inactive')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;

-- 3. Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Admins can do everything with drivers"
ON public.drivers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Carriers can manage their own drivers"
ON public.drivers FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.carriers
        WHERE carriers.id = drivers.carrier_id
        AND carriers.portal_user_id = auth.uid()
    )
);

CREATE POLICY "Shippers can view drivers assigned to their loads"
ON public.drivers FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads
        WHERE loads.driver_id = drivers.id
        AND EXISTS (
            SELECT 1 FROM public.shippers
            WHERE shippers.id = loads.shipper_id
            AND shippers.portal_user_id = auth.uid()
        )
    )
);

-- 5. Trigger for updated_at (using existing public.touch_updated_at)
CREATE TRIGGER set_updated_at_drivers
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();

-- 6. Add foreign key to loads
ALTER TABLE public.loads ADD CONSTRAINT loads_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- 7. Indexes
CREATE INDEX idx_drivers_carrier_id ON public.drivers(carrier_id);
CREATE INDEX idx_drivers_availability ON public.drivers(availability_status);
CREATE INDEX idx_drivers_employment_type ON public.drivers(employment_type);

COMMENT ON TABLE public.drivers IS 'Expanded Driver entity with compliance, performance, and availability tracking.';
