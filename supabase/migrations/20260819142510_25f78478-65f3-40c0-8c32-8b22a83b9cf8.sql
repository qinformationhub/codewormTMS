
-- Enums for notifications
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM (
      'load_created',
      'carrier_assigned',
      'load_dispatched',
      'pickup_completed',
      'in_transit',
      'delivery_approaching',
      'delivered',
      'delayed',
      'exception_raised',
      'sla_warning',
      'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  load_id uuid REFERENCES public.loads(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own notifications"
      ON public.notifications FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own notifications"
      ON public.notifications FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Automated Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_load_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_shipper_user_id uuid;
  target_carrier_user_id uuid;
  load_ref text;
  notification_msg text;
  n_type public.notification_type;
BEGIN
  -- Get load reference
  SELECT reference INTO load_ref FROM public.loads WHERE id = NEW.id;
  
  -- Get related user IDs
  SELECT portal_user_id INTO target_shipper_user_id FROM public.shippers WHERE id = NEW.shipper_id;
  SELECT portal_user_id INTO target_carrier_user_id FROM public.carriers WHERE id = NEW.carrier_id;
  
  -- Determine notification type and message based on status change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    CASE NEW.status
      WHEN 'booked' THEN
        n_type := 'carrier_assigned';
        notification_msg := 'Carrier assigned to Load ' || load_ref;
      WHEN 'dispatched' THEN
        n_type := 'load_dispatched';
        notification_msg := 'Load ' || load_ref || ' has been dispatched';
      WHEN 'picked_up' THEN
        n_type := 'pickup_completed';
        notification_msg := 'Pickup completed for Load ' || load_ref;
      WHEN 'in_transit' THEN
        n_type := 'in_transit';
        notification_msg := 'Load ' || load_ref || ' is now in transit';
      WHEN 'delivered' THEN
        n_type := 'delivered';
        notification_msg := 'Load ' || load_ref || ' has been delivered';
      ELSE
        RETURN NEW;
    END CASE;

    -- Notify Shipper
    IF target_shipper_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, load_id, type, message)
      VALUES (target_shipper_user_id, NEW.id, n_type, notification_msg);
    END IF;

    -- Notify Carrier
    IF target_carrier_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, load_id, type, message)
      VALUES (target_carrier_user_id, NEW.id, n_type, notification_msg);
    END IF;

    -- Notify all Admin users
    INSERT INTO public.notifications (user_id, load_id, type, message)
    SELECT user_id, NEW.id, n_type, notification_msg
    FROM public.user_roles
    WHERE role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for load status changes
DROP TRIGGER IF EXISTS on_load_status_change ON public.loads;
CREATE TRIGGER on_load_status_change
  AFTER UPDATE OF status ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_load_status_notification();

-- Trigger for Delay detection
CREATE OR REPLACE FUNCTION public.check_load_delays()
RETURNS TRIGGER AS $$
DECLARE
  target_shipper_user_id uuid;
  target_carrier_user_id uuid;
  load_ref text;
BEGIN
  IF (NEW.delivery_date < now() AND NEW.status NOT IN ('delivered', 'cancelled', 'invoiced', 'paid')) THEN
    -- Get load reference
    SELECT reference INTO load_ref FROM public.loads WHERE id = NEW.id;
    
    -- Get related user IDs
    SELECT portal_user_id INTO target_shipper_user_id FROM public.shippers WHERE id = NEW.shipper_id;
    SELECT portal_user_id INTO target_carrier_user_id FROM public.carriers WHERE id = NEW.carrier_id;

    -- Only notify if not already notified of delay within the last hour to prevent spam
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE load_id = NEW.id 
      AND type = 'delayed' 
      AND created_at > now() - interval '1 hour'
    ) THEN
      IF target_shipper_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, load_id, type, message)
        VALUES (target_shipper_user_id, NEW.id, 'delayed', 'Load ' || load_ref || ' is delayed beyond scheduled delivery');
      END IF;

      IF target_carrier_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, load_id, type, message)
        VALUES (target_carrier_user_id, NEW.id, 'delayed', 'Urgent: Load ' || load_ref || ' is past delivery deadline');
      END IF;
      
      -- Notify Admins
      INSERT INTO public.notifications (user_id, load_id, type, message)
      SELECT user_id, NEW.id, 'delayed', 'Load ' || load_ref || ' is currently DELAYED'
      FROM public.user_roles
      WHERE role = 'admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_load_delay_check ON public.loads;
CREATE TRIGGER on_load_delay_check
  AFTER UPDATE OF status, delivery_date ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_load_delays();
