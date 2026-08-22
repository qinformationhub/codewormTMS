-- Create check-in history table
CREATE TABLE public.driver_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_at TIMESTAMPTZ,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_driver_checkins_driver_id ON public.driver_checkins(driver_id);
CREATE INDEX idx_driver_checkins_carrier_id ON public.driver_checkins(carrier_id);

-- Enable RLS
ALTER TABLE public.driver_checkins ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can see everything
CREATE POLICY "Admins can see all checkins"
    ON public.driver_checkins
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Carriers can see their own drivers' checkins
CREATE POLICY "Carriers can see their own drivers' checkins"
    ON public.driver_checkins
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.portal_users
            WHERE user_id = auth.uid()
            AND organization_id = driver_checkins.carrier_id
        )
    );

-- Carriers can manage their own drivers' checkins
CREATE POLICY "Carriers can manage their own drivers' checkins"
    ON public.driver_checkins
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.portal_users
            WHERE user_id = auth.uid()
            AND organization_id = driver_checkins.carrier_id
        )
    );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_checkins TO authenticated;
GRANT ALL ON public.driver_checkins TO service_role;
