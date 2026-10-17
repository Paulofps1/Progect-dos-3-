-- Remove FK constraint on user_roles to support mock auth
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Insert admin role for mock user
INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000000', 'admin') ON CONFLICT (user_id, role) DO NOTHING;