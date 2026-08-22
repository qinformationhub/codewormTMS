-- Fix security linter issues for handle_invited_user_setup
ALTER FUNCTION public.handle_invited_user_setup() SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_invited_user_setup() FROM public;
GRANT EXECUTE ON FUNCTION public.handle_invited_user_setup() TO service_role;
-- Supabase auth triggers usually run as service_role, but let's be safe.
