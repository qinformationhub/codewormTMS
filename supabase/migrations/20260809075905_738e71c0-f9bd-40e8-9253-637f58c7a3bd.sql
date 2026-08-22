-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','shipper','carrier');
CREATE TYPE public.load_status AS ENUM ('planning','pending_adjustment','available','booked','dispatched','picked_up','in_transit','delivered','invoiced','paid','rejected','cancelled');
CREATE TYPE public.freight_category AS ENUM ('hazmat','medical','pharmaceutical','cold_chain','general');
CREATE TYPE public.entity_status AS ENUM ('active','pending','suspended');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'shipper',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Shippers
CREATE TABLE public.shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  compliance_flags TEXT[] NOT NULL DEFAULT '{}',
  security_level TEXT NOT NULL DEFAULT 'standard',
  portal_user_id UUID,
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shippers TO authenticated;
GRANT ALL ON public.shippers TO service_role;
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;

-- Carriers
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mc_number TEXT NOT NULL DEFAULT '',
  dot_number TEXT NOT NULL DEFAULT '',
  hazmat_certified BOOLEAN NOT NULL DEFAULT false,
  gdp_certified BOOLEAN NOT NULL DEFAULT false,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  insurance_expires DATE,
  portal_user_id UUID,
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carriers TO authenticated;
GRANT ALL ON public.carriers TO service_role;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_shipper_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.shippers WHERE portal_user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.current_carrier_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.carriers WHERE portal_user_id = _user_id
$$;

-- Loads
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  status public.load_status NOT NULL DEFAULT 'planning',
  commodity TEXT NOT NULL DEFAULT '',
  category public.freight_category NOT NULL DEFAULT 'general',
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  origin_city TEXT NOT NULL DEFAULT '',
  origin_state TEXT NOT NULL DEFAULT '',
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_city TEXT NOT NULL DEFAULT '',
  destination_state TEXT NOT NULL DEFAULT '',
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  pickup_date DATE,
  delivery_date DATE,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  weight_lbs INTEGER NOT NULL DEFAULT 0,
  equipment TEXT NOT NULL DEFAULT 'Dry Van',
  temp_min NUMERIC(6,2),
  temp_max NUMERIC(6,2),
  hazmat_class TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loads TO authenticated;
GRANT ALL ON public.loads TO service_role;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'compliance',
  doc_type TEXT NOT NULL DEFAULT '',
  owner_type TEXT NOT NULL DEFAULT 'carrier',
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'valid',
  uploaded_by UUID,
  uploaded_by_name TEXT NOT NULL DEFAULT '',
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Policies: user_roles
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Policies: shippers
CREATE POLICY "shippers admin all" ON public.shippers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "shippers read own" ON public.shippers FOR SELECT TO authenticated
  USING (portal_user_id = auth.uid());
CREATE POLICY "shippers read by carriers" ON public.shippers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'carrier'));

-- Policies: carriers
CREATE POLICY "carriers admin all" ON public.carriers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "carriers read own" ON public.carriers FOR SELECT TO authenticated
  USING (portal_user_id = auth.uid());
CREATE POLICY "carriers read by shippers" ON public.carriers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'shipper'));

-- Policies: loads
CREATE POLICY "loads admin all" ON public.loads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "loads shipper read" ON public.loads FOR SELECT TO authenticated
  USING (shipper_id IN (SELECT public.current_shipper_ids(auth.uid())));
CREATE POLICY "loads shipper insert" ON public.loads FOR INSERT TO authenticated
  WITH CHECK (shipper_id IN (SELECT public.current_shipper_ids(auth.uid())));
CREATE POLICY "loads shipper update" ON public.loads FOR UPDATE TO authenticated
  USING (shipper_id IN (SELECT public.current_shipper_ids(auth.uid())))
  WITH CHECK (shipper_id IN (SELECT public.current_shipper_ids(auth.uid())));
CREATE POLICY "loads carrier read" ON public.loads FOR SELECT TO authenticated
  USING (
    carrier_id IN (SELECT public.current_carrier_ids(auth.uid()))
    OR (status = 'available' AND public.has_role(auth.uid(),'carrier'))
  );
CREATE POLICY "loads carrier update" ON public.loads FOR UPDATE TO authenticated
  USING (
    carrier_id IN (SELECT public.current_carrier_ids(auth.uid()))
    OR (status = 'available' AND public.has_role(auth.uid(),'carrier'))
  )
  WITH CHECK (carrier_id IN (SELECT public.current_carrier_ids(auth.uid())));

-- Policies: documents
CREATE POLICY "documents admin all" ON public.documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "documents party read" ON public.documents FOR SELECT TO authenticated
  USING (
    shipper_id IN (SELECT public.current_shipper_ids(auth.uid()))
    OR carrier_id IN (SELECT public.current_carrier_ids(auth.uid()))
    OR uploaded_by = auth.uid()
  );
CREATE POLICY "documents party insert" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      shipper_id IN (SELECT public.current_shipper_ids(auth.uid()))
      OR carrier_id IN (SELECT public.current_carrier_ids(auth.uid()))
    )
  );

-- Policies: audit logs
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'shipper');
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name',''), COALESCE(NEW.email,''), _role)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER loads_touch BEFORE UPDATE ON public.loads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER shippers_touch BEFORE UPDATE ON public.shippers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER carriers_touch BEFORE UPDATE ON public.carriers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();