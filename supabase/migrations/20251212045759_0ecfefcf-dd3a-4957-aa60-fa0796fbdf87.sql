-- 1. Add DELETE policy for usage_limits (GDPR compliance)
CREATE POLICY "Users can delete their own usage" 
ON public.usage_limits 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Create a trigger to validate that diet_id belongs to the same user in daily_consumption
CREATE OR REPLACE FUNCTION public.validate_consumption_diet_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If diet_id is null, allow insert/update
  IF NEW.diet_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if the diet belongs to the same user
  IF NOT EXISTS (
    SELECT 1 FROM public.diets 
    WHERE id = NEW.diet_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'diet_id must belong to the same user';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS validate_consumption_diet_trigger ON public.daily_consumption;
CREATE TRIGGER validate_consumption_diet_trigger
  BEFORE INSERT OR UPDATE ON public.daily_consumption
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_consumption_diet_id();

-- 3. Add policy for initial user role assignment during registration
-- This allows the application to assign default 'user' role via service key
-- or users can have their role assigned during signup flow
CREATE POLICY "Users can insert their own initial role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'user'::app_role
);