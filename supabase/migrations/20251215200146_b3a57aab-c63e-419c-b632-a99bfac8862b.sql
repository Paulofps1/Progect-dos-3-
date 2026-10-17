-- Add streak fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date DEFAULT NULL;

-- Create function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_streak integer;
  v_longest_streak integer;
  v_last_active date;
  v_today date := CURRENT_DATE;
  v_days_diff integer;
BEGIN
  -- Get current streak data
  SELECT current_streak, longest_streak, last_active_date
  INTO v_current_streak, v_longest_streak, v_last_active
  FROM profiles
  WHERE id = p_user_id;
  
  -- Initialize if null
  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);
  
  -- If no previous activity, start fresh
  IF v_last_active IS NULL THEN
    v_current_streak := 1;
  ELSE
    -- Calculate days since last activity
    v_days_diff := v_today - v_last_active;
    
    IF v_days_diff = 0 THEN
      -- Same day, no change to streak (but still update last_active)
      NULL;
    ELSIF v_days_diff = 1 THEN
      -- Consecutive day, increment streak
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Streak broken, reset to 1
      v_current_streak := 1;
    END IF;
  END IF;
  
  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_date = v_today,
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'last_active_date', v_today
  );
END;
$$;

-- Create trigger function to auto-update streak on activity
CREATE OR REPLACE FUNCTION public.trigger_update_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update streak for the user
  PERFORM update_user_streak(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create triggers on activity tables
DROP TRIGGER IF EXISTS streak_water_trigger ON water_consumption;
CREATE TRIGGER streak_water_trigger
  AFTER INSERT ON water_consumption
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

DROP TRIGGER IF EXISTS streak_meals_trigger ON meals;
CREATE TRIGGER streak_meals_trigger
  AFTER INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

DROP TRIGGER IF EXISTS streak_scans_trigger ON scan_history;
CREATE TRIGGER streak_scans_trigger
  AFTER INSERT ON scan_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

DROP TRIGGER IF EXISTS streak_photos_trigger ON body_photos;
CREATE TRIGGER streak_photos_trigger
  AFTER INSERT ON body_photos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();

DROP TRIGGER IF EXISTS streak_predictions_trigger ON facial_predictions;
CREATE TRIGGER streak_predictions_trigger
  AFTER INSERT ON facial_predictions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();