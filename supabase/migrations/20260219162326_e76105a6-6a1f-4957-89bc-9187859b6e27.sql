
-- 1. Biblioteca global de exercícios
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  muscle_group text NOT NULL,
  secondary_muscles text[] DEFAULT '{}',
  equipment text NOT NULL DEFAULT 'nenhum',
  modality text NOT NULL DEFAULT 'casa',
  difficulty text NOT NULL DEFAULT 'iniciante',
  instructions text,
  image_url text,
  calories_per_min integer DEFAULT 5,
  is_compound boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT USING (true);

-- 2. Planos de treino do usuário
CREATE TABLE public.workout_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'hipertrofia',
  goal text,
  days_per_week integer DEFAULT 3,
  equipment_available text[] DEFAULT '{}',
  is_active boolean DEFAULT false,
  plan_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own workout plans"
  ON public.workout_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Sessões de treino realizadas
CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  date text NOT NULL,
  modality text DEFAULT 'academia',
  duration_min integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  notes text,
  mood text,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own workout sessions"
  ON public.workout_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Séries individuais de cada sessão
CREATE TABLE public.workout_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  set_number integer NOT NULL DEFAULT 1,
  reps integer,
  weight_kg numeric,
  duration_sec integer,
  distance_km numeric,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own workout sets"
  ON public.workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id AND ws.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id AND ws.user_id = auth.uid()
    )
  );

-- 5. Indexes para performance
CREATE INDEX idx_exercises_modality ON public.exercises(modality);
CREATE INDEX idx_exercises_muscle ON public.exercises(muscle_group);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, date);
CREATE INDEX idx_workout_sets_session ON public.workout_sets(session_id);
CREATE INDEX idx_workout_plans_user ON public.workout_plans(user_id, is_active);

-- 6. Trigger XP para treino
CREATE OR REPLACE FUNCTION public.handle_workout_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND (OLD.finished_at IS NULL OR OLD.finished_at IS DISTINCT FROM NEW.finished_at) THEN
    INSERT INTO public.user_progress (user_id, total_xp, level, current_streak, longest_streak)
    VALUES (NEW.user_id, 30, 1, 0, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_xp = user_progress.total_xp + 30,
      level = GREATEST(1, FLOOR((user_progress.total_xp + 30) / 100) + 1)::int,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workout_complete
  AFTER UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_workout_xp();
