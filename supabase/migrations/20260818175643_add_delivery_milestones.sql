-- Create delivery milestones table
CREATE TABLE public.delivery_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recorded_by UUID REFERENCES auth.users(id),
    location_data JSONB, -- Optional location context
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX idx_delivery_milestones_load_id ON public.delivery_milestones(load_id);

-- RLS
ALTER TABLE public.delivery_milestones ENABLE ROW LEVEL SECURITY;

-- GRANTS
GRANT SELECT, INSERT, UPDATE ON public.delivery_milestones TO authenticated;
GRANT ALL ON public.delivery_milestones TO service_role;

-- POLICIES

-- Carrier can insert and select for their assigned loads
CREATE POLICY "Carriers can insert milestones for assigned loads"
ON public.delivery_milestones
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.portal_users pu ON pu.organization_id = l.carrier_id
        WHERE l.id = load_id AND pu.user_id = auth.uid()
    )
);

CREATE POLICY "Carriers can view milestones for assigned loads"
ON public.delivery_milestones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.portal_users pu ON pu.organization_id = l.carrier_id
        WHERE l.id = load_id AND pu.user_id = auth.uid()
    )
);

-- Shipper can view milestones for their loads
CREATE POLICY "Shippers can view milestones for their loads"
ON public.delivery_milestones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.portal_users pu ON pu.organization_id = l.shipper_id
        WHERE l.id = load_id AND pu.user_id = auth.uid()
    )
);

-- Admin can do everything
CREATE POLICY "Admins have full access to milestones"
ON public.delivery_milestones
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Update ePOD to record verified_at and verified_by
ALTER TABLE public.epods ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.epods ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

