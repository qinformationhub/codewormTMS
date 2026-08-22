CREATE TABLE public.epods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
    carrier_id uuid REFERENCES public.carriers(id) NOT NULL,
    recipient_name text NOT NULL,
    delivery_notes text,
    signature_data text NOT NULL,
    delivery_timestamp timestamptz DEFAULT now() NOT NULL,
    delivery_location text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.epods TO authenticated;
GRANT ALL ON public.epods TO service_role;

ALTER TABLE public.epods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ePODs" ON public.epods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Carriers can view own ePODs" ON public.epods 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.carriers c WHERE c.portal_user_id = auth.uid() AND c.id = epods.carrier_id));

CREATE POLICY "Carriers can insert own ePODs" ON public.epods 
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.carriers c WHERE c.portal_user_id = auth.uid() AND c.id = epods.carrier_id));

CREATE POLICY "Shippers can view ePODs for their loads" ON public.epods 
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.loads l JOIN public.shippers s ON l.shipper_id = s.id WHERE l.id = epods.load_id AND s.portal_user_id = auth.uid()));
