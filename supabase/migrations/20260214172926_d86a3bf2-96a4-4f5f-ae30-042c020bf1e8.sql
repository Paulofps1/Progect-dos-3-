
-- Add permissive RLS policies for mock user UUID (no data inserts - handled in app)

-- profiles
CREATE POLICY "Mock user can view profile"
ON public.profiles FOR SELECT
USING (id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can update profile"
ON public.profiles FOR UPDATE
USING (id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can insert profile"
ON public.profiles FOR INSERT
WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- daily_consumption
CREATE POLICY "Mock user daily_consumption"
ON public.daily_consumption FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- water_consumption
CREATE POLICY "Mock user water_consumption"
ON public.water_consumption FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- meals
CREATE POLICY "Mock user meals"
ON public.meals FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- scan_history
CREATE POLICY "Mock user scan_history"
ON public.scan_history FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- diets
CREATE POLICY "Mock user diets"
ON public.diets FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- body_measurements
CREATE POLICY "Mock user body_measurements"
ON public.body_measurements FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- chat_messages
CREATE POLICY "Mock user chat_messages"
ON public.chat_messages FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- user_progress
CREATE POLICY "Mock user can view progress"
ON public.user_progress FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can insert progress"
ON public.user_progress FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can update progress"
ON public.user_progress FOR UPDATE
USING (user_id = '00000000-0000-0000-0000-000000000000');

-- recovery_mode
CREATE POLICY "Mock user recovery_mode"
ON public.recovery_mode FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- weekly_reports
CREATE POLICY "Mock user weekly_reports"
ON public.weekly_reports FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- favorite_meals
CREATE POLICY "Mock user favorite_meals"
ON public.favorite_meals FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- challenge_participants
CREATE POLICY "Mock user can view challenges"
ON public.challenge_participants FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Mock user can update challenges"
ON public.challenge_participants FOR UPDATE
USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Remove FK constraint on profiles.id to allow mock user
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also remove FK constraints on other tables referencing auth.users if any
-- (user_id columns don't have FK constraints based on schema)
