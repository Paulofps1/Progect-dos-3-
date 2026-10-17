-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR id = '00000000-0000-0000-0000-000000000000'::uuid AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid AND role = 'admin'
));