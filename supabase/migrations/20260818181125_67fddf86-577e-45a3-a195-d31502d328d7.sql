-- Exception Reporting & Notes Migration

-- 1. Create exception_type enum
DROP TYPE IF EXISTS public.exception_type CASCADE;
CREATE TYPE public.exception_type AS ENUM (
    'Pickup Issue',
    'Delivery Issue',
    'Delay',
    'Vehicle Issue',
    'Driver Issue',
    'Damaged Shipment',
    'Missing Shipment',
    'Weather',
    'Documentation Issue',
    'Other'
);

-- 2. Create exception_severity enum
DO $$ BEGIN
    CREATE TYPE public.exception_severity AS ENUM (
        'Low',
        'Medium',
        'High',
        'Critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create exception_status enum
DO $$ BEGIN
    CREATE TYPE public.exception_status AS ENUM (
        'Open',
        'In Progress',
        'Resolved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create load_exceptions table
CREATE TABLE IF NOT EXISTS public.load_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    type public.exception_type NOT NULL,
    severity public.exception_severity NOT NULL DEFAULT 'Medium',
    status public.exception_status NOT NULL DEFAULT 'Open',
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Grant Access
GRANT SELECT, INSERT, UPDATE ON public.load_exceptions TO authenticated;
GRANT ALL ON public.load_exceptions TO service_role;

-- 6. Enable RLS
ALTER TABLE public.load_exceptions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Admins can see all
CREATE POLICY "Admins can view all exceptions"
ON public.load_exceptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage exceptions"
ON public.load_exceptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Shippers can see exceptions for their loads
CREATE POLICY "Shippers can view their load exceptions"
ON public.load_exceptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.shippers s ON s.id = l.shipper_id
        WHERE l.id = load_exceptions.load_id
        AND s.portal_user_id = auth.uid()
        AND public.has_role(auth.uid(), 'shipper')
    )
);

-- Carriers can see/create exceptions for their loads
CREATE POLICY "Carriers can view their load exceptions"
ON public.load_exceptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.carriers c ON c.id = l.carrier_id
        WHERE l.id = load_exceptions.load_id
        AND c.portal_user_id = auth.uid()
        AND public.has_role(auth.uid(), 'carrier')
    )
);

CREATE POLICY "Carriers can create load exceptions"
ON public.load_exceptions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.carriers c ON c.id = l.carrier_id
        WHERE l.id = load_id
        AND c.portal_user_id = auth.uid()
        AND public.has_role(auth.uid(), 'carrier')
    )
);

CREATE POLICY "Carriers can update their load exceptions"
ON public.load_exceptions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.loads l
        JOIN public.carriers c ON c.id = l.carrier_id
        WHERE l.id = load_exceptions.load_id
        AND c.portal_user_id = auth.uid()
        AND public.has_role(auth.uid(), 'carrier')
    )
);
