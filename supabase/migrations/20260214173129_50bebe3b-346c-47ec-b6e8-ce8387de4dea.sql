
-- Remove FK constraints referencing auth.users to allow mock user
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE public.daily_consumption DROP CONSTRAINT IF EXISTS daily_consumption_user_id_fkey;
ALTER TABLE public.water_consumption DROP CONSTRAINT IF EXISTS water_consumption_user_id_fkey;
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;
ALTER TABLE public.scan_history DROP CONSTRAINT IF EXISTS scan_history_user_id_fkey;
ALTER TABLE public.diets DROP CONSTRAINT IF EXISTS diets_user_id_fkey;
ALTER TABLE public.body_measurements DROP CONSTRAINT IF EXISTS body_measurements_user_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE public.recovery_mode DROP CONSTRAINT IF EXISTS recovery_mode_user_id_fkey;
ALTER TABLE public.weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_user_id_fkey;
ALTER TABLE public.favorite_meals DROP CONSTRAINT IF EXISTS favorite_meals_user_id_fkey;
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_user_id_fkey;

-- Create DB function for XP increment on meal insert
CREATE OR REPLACE FUNCTION public.handle_meal_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, total_xp, level, current_streak, longest_streak)
  VALUES (NEW.user_id, 10, 1, 0, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_xp = user_progress.total_xp + 10,
    level = GREATEST(1, FLOOR((user_progress.total_xp + 10) / 100) + 1)::int,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for XP on meal insert
DROP TRIGGER IF EXISTS on_meal_insert_xp ON public.meals;
CREATE TRIGGER on_meal_insert_xp
AFTER INSERT ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.handle_meal_xp();

-- Create DB function for XP on water goal
CREATE OR REPLACE FUNCTION public.handle_water_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_total int;
  water_goal int;
BEGIN
  SELECT COALESCE(SUM(amount_ml), 0) INTO daily_total
  FROM public.water_consumption
  WHERE user_id = NEW.user_id AND date = NEW.date;

  SELECT COALESCE(p.water_goal_ml, 2000) INTO water_goal
  FROM public.profiles p WHERE p.id = NEW.user_id;

  IF daily_total >= water_goal THEN
    INSERT INTO public.user_progress (user_id, total_xp, level, current_streak, longest_streak)
    VALUES (NEW.user_id, 20, 1, 0, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      total_xp = user_progress.total_xp + 20,
      level = GREATEST(1, FLOOR((user_progress.total_xp + 20) / 100) + 1)::int,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_water_insert_xp ON public.water_consumption;
CREATE TRIGGER on_water_insert_xp
AFTER INSERT ON public.water_consumption
FOR EACH ROW
EXECUTE FUNCTION public.handle_water_xp();

-- Streak update function
CREATE OR REPLACE FUNCTION public.handle_streak_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date text;
  curr_streak int;
  max_streak int;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
  INTO last_date, curr_streak, max_streak
  FROM public.profiles WHERE id = NEW.user_id;

  IF last_date IS NULL OR last_date < (CURRENT_DATE - INTERVAL '1 day')::text THEN
    curr_streak := 1;
  ELSIF last_date = (CURRENT_DATE - INTERVAL '1 day')::text THEN
    curr_streak := COALESCE(curr_streak, 0) + 1;
  END IF;
  -- same day = no change

  IF last_date IS DISTINCT FROM CURRENT_DATE::text THEN
    max_streak := GREATEST(COALESCE(max_streak, 0), curr_streak);
    UPDATE public.profiles SET
      current_streak = curr_streak,
      longest_streak = max_streak,
      last_active_date = CURRENT_DATE::text
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_meal_streak ON public.meals;
CREATE TRIGGER on_meal_streak
AFTER INSERT ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.handle_streak_update();

DROP TRIGGER IF EXISTS on_water_streak ON public.water_consumption;
CREATE TRIGGER on_water_streak
AFTER INSERT ON public.water_consumption
FOR EACH ROW
EXECUTE FUNCTION public.handle_streak_update();
