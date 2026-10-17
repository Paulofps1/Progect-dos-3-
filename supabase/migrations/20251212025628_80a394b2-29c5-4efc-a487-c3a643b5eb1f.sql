-- Remove admin role from user lipereis2605@gmail.com
DELETE FROM public.user_roles 
WHERE user_id = 'd6616158-2a35-4c72-8b5d-2c6e02e55c7b' 
AND role = 'admin';