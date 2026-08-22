-- Update entity_status to include suspended and inactive if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'entity_status' AND e.enumlabel = 'suspended') THEN
        ALTER TYPE public.entity_status ADD VALUE 'suspended';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'entity_status' AND e.enumlabel = 'inactive') THEN
        ALTER TYPE public.entity_status ADD VALUE 'inactive';
    END IF;
END $$;

-- Add portal_invitation_sent_at to track invites
ALTER TABLE public.shippers ADD COLUMN IF NOT EXISTS portal_invitation_sent_at TIMESTAMPTZ;
ALTER TABLE public.carriers ADD COLUMN IF NOT EXISTS portal_invitation_sent_at TIMESTAMPTZ;

-- Function to handle new user role assignment after invitation acceptance
CREATE OR REPLACE FUNCTION public.handle_invited_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_org_type TEXT;
BEGIN
    -- Check raw_user_meta_data for organization info
    IF NEW.raw_user_meta_data ? 'org_type' THEN
        v_org_type := NEW.raw_user_meta_data->>'org_type';
        v_org_id := (NEW.raw_user_meta_data->>'org_id')::UUID;
        
        IF v_org_type = 'shipper' THEN
            -- Update the shipper record with the new user id
            UPDATE public.shippers SET portal_user_id = NEW.id WHERE id = v_org_id;
            
            -- Insert role
            INSERT INTO public.user_roles (user_id, role) 
            VALUES (NEW.id, 'user')
            ON CONFLICT (user_id, role) DO NOTHING;
            
        ELSIF v_org_type = 'carrier' THEN
            -- Update the carrier record
            UPDATE public.carriers SET portal_user_id = NEW.id WHERE id = v_org_id;
            
            -- Insert role
            INSERT INTO public.user_roles (user_id, role) 
            VALUES (NEW.id, 'user')
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
        
        -- Create a profile if it doesn't exist
        INSERT INTO public.profiles (id, full_name, email)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'contact_name', NEW.email), NEW.email)
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- In Lovable Cloud, we can try to add the trigger to auth.users
-- Note: This might require specific permissions, but handle_invited_user_setup is SECURITY DEFINER.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_onboarding') THEN
        CREATE TRIGGER on_auth_user_created_onboarding
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_invited_user_setup();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create trigger on auth.users: %', SQLERRM;
END $$;

-- RLS check: Ensure user_roles can be read by authenticated users for RBAC
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
