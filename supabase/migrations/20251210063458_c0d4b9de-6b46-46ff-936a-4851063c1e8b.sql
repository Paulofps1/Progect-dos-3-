-- Add phone number and notification settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS notification_meals boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_water boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_daily boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_tips boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean DEFAULT false;