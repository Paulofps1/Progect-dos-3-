-- Add new profile fields for onboarding and body data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
ADD COLUMN IF NOT EXISTS dietary_restrictions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meal_routine text DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS exercise_frequency integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS uses_supplements boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS target_weight numeric,
ADD COLUMN IF NOT EXISTS observations text,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.gender IS 'User gender: male, female, other, prefer_not_say';
COMMENT ON COLUMN public.profiles.birth_date IS 'User birth date for age calculation';
COMMENT ON COLUMN public.profiles.sleep_quality IS 'Sleep quality from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN public.profiles.dietary_restrictions IS 'Array of dietary restrictions: lactose, gluten, etc';
COMMENT ON COLUMN public.profiles.meal_routine IS 'Meal routine: regular or irregular';
COMMENT ON COLUMN public.profiles.exercise_frequency IS 'Exercise sessions per week';
COMMENT ON COLUMN public.profiles.uses_supplements IS 'Whether user takes supplements';
COMMENT ON COLUMN public.profiles.target_weight IS 'User target weight goal';
COMMENT ON COLUMN public.profiles.observations IS 'Free text observations';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Current onboarding step for resuming';