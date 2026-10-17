-- Allow mock user to view their own roles
CREATE POLICY "Mock user can view roles"
ON public.user_roles
FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);