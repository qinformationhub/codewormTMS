
-- Fix security issues by setting search_path and revoking public execute
CREATE OR REPLACE FUNCTION public.calculate_load_sla_status()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_deadline TIMESTAMP WITH TIME ZONE;
    v_actual_completion TIMESTAMP WITH TIME ZONE;
    v_new_status public.sla_status;
BEGIN
    -- Get load info
    SELECT sla_deadline, actual_completion_time INTO v_sla_deadline, v_actual_completion
    FROM public.loads WHERE id = NEW.load_id;

    IF v_sla_deadline IS NULL THEN
        RETURN NEW;
    END IF;

    -- If final delivery is done (last stop departed)
    IF NEW.stop_type = 'delivery' AND NEW.status = 'departed' AND 
       NOT EXISTS (SELECT 1 FROM public.load_stops WHERE load_id = NEW.load_id AND stop_number > NEW.stop_number) THEN
        
        UPDATE public.loads SET actual_completion_time = NEW.actual_departure WHERE id = NEW.load_id;
        v_actual_completion := NEW.actual_departure;
        
        IF v_actual_completion <= v_sla_deadline THEN
            v_new_status := 'met';
        ELSE
            v_new_status := 'breached';
        END IF;
    ELSE
        -- Still in progress
        IF now() > v_sla_deadline THEN
            v_new_status := 'breached';
        ELSIF now() > (v_sla_deadline - interval '4 hours') THEN
            v_new_status := 'at_risk';
        ELSE
            v_new_status := 'on_track';
        END IF;
    END IF;

    UPDATE public.loads SET sla_status = v_new_status WHERE id = NEW.load_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.calculate_load_sla_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_load_sla_status() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_load_sla_status() TO service_role;
