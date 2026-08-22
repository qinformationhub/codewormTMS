ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS pieces integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_unit text NOT NULL DEFAULT 'lbs',
  ADD COLUMN IF NOT EXISTS truck_requirement text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS temperature_requirement text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS compliance_flags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enable_tracking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_unauthorized_stops boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS un_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proper_shipping_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS packing_group text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS temperature_band text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS declared_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theft_risk text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS high_value boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS white_glove boolean NOT NULL DEFAULT false;

ALTER TABLE public.carriers
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS insurance_coverage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reefer_certified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hazmat_safety_rating text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS security_protocol text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS claims_ratio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS temperature_capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portal_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS truck_insurance boolean NOT NULL DEFAULT false;