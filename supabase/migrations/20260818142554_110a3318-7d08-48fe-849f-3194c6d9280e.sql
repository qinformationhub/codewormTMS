-- Revoke public execute on security definer functions to satisfy linter
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_carrier_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_carrier_ids(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_shipper_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_shipper_ids(uuid) TO authenticated, service_role;
