
-- Add mock user RLS policies for workout tables
CREATE POLICY "Mock user workout_plans"
ON public.workout_plans FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Mock user workout_sessions"
ON public.workout_sessions FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Mock user workout_sets"
ON public.workout_sets FOR ALL
USING (EXISTS (
  SELECT 1 FROM workout_sessions ws
  WHERE ws.id = workout_sets.session_id
  AND ws.user_id = '00000000-0000-0000-0000-000000000000'::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM workout_sessions ws
  WHERE ws.id = workout_sets.session_id
  AND ws.user_id = '00000000-0000-0000-0000-000000000000'::uuid
));
