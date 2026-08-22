-- Dispatch assignments table
CREATE TABLE public.dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_by_name TEXT NOT NULL DEFAULT 'System',
  method TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'automatic'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'replaced', 'cancelled'
  score INTEGER,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.dispatch_assignments TO authenticated;
GRANT ALL ON public.dispatch_assignments TO service_role;

-- RLS
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "dispatch admin all" ON public.dispatch_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "dispatch carrier read" ON public.dispatch_assignments FOR SELECT TO authenticated
  USING (carrier_id IN (SELECT public.current_carrier_ids(auth.uid())));

CREATE POLICY "dispatch shipper read" ON public.dispatch_assignments FOR SELECT TO authenticated
  USING (load_id IN (SELECT id FROM public.loads WHERE shipper_id IN (SELECT public.current_shipper_ids(auth.uid()))));

-- Trigger for updated_at
CREATE TRIGGER dispatch_assignments_touch BEFORE UPDATE ON public.dispatch_assignments 
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Add index for performance
CREATE INDEX idx_dispatch_load_id ON public.dispatch_assignments(load_id);
CREATE INDEX idx_dispatch_carrier_id ON public.dispatch_assignments(carrier_id);
