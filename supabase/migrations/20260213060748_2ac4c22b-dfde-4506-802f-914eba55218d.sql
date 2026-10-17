
-- =============================================
-- NUTRICERTO v2.0 - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  scans_remaining INTEGER NOT NULL DEFAULT 3,
  goal TEXT,
  phone_number TEXT,
  notification_meals BOOLEAN NOT NULL DEFAULT true,
  notification_water BOOLEAN NOT NULL DEFAULT true,
  notification_daily BOOLEAN NOT NULL DEFAULT true,
  notification_tips BOOLEAN NOT NULL DEFAULT true,
  has_seen_onboarding BOOLEAN NOT NULL DEFAULT false,
  water_goal_ml INTEGER DEFAULT 2000,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  activity_level TEXT,
  plan TEXT DEFAULT 'free',
  first_login BOOLEAN NOT NULL DEFAULT true,
  password_created BOOLEAN NOT NULL DEFAULT false,
  gender TEXT,
  birth_date TEXT,
  sleep_quality INTEGER,
  dietary_restrictions TEXT[],
  meal_routine TEXT,
  exercise_frequency INTEGER,
  uses_supplements BOOLEAN,
  target_weight NUMERIC,
  observations TEXT,
  onboarding_step INTEGER,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  flex_days INTEGER[] DEFAULT '{}',
  flex_calories_bonus INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. DAILY CONSUMPTION
CREATE TABLE public.daily_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own consumption" ON public.daily_consumption FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. WATER CONSUMPTION
CREATE TABLE public.water_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.water_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own water" ON public.water_consumption FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. MEALS
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  meal_items JSONB DEFAULT '[]',
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  date TEXT,
  time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own meals" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. DIETS
CREATE TABLE public.diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_target INTEGER DEFAULT 2000,
  protein_target INTEGER DEFAULT 150,
  carbs_target INTEGER DEFAULT 250,
  fat_target INTEGER DEFAULT 65,
  is_active BOOLEAN DEFAULT false,
  diet_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own diets" ON public.diets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. SCAN HISTORY
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT,
  product_image TEXT,
  health_score INTEGER,
  skin_impact TEXT,
  weight_impact TEXT,
  energy_impact TEXT,
  analysis_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own scans" ON public.scan_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. FAVORITE MEALS (NEW)
CREATE TABLE public.favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  foods JSONB NOT NULL DEFAULT '[]',
  total_calories NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own favorites" ON public.favorite_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. USER PROGRESS / GAMIFICATION (NEW)
CREATE TABLE public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  badges TEXT[] DEFAULT '{}',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. BADGES (NEW)
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  unlock_criteria JSONB
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- 10. CHALLENGES (NEW)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'individual',
  duration_days INTEGER DEFAULT 7,
  goal JSONB NOT NULL DEFAULT '{}',
  reward_xp INTEGER DEFAULT 100,
  reward_badge TEXT,
  start_date DATE,
  end_date DATE,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);

-- 11. CHALLENGE PARTICIPANTS (NEW)
CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress JSONB DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own participation" ON public.challenge_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- 12. SQUADS (NEW)
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  collective_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- 13. SQUAD MEMBERS (NEW)
CREATE TABLE public.squad_members (
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (squad_id, user_id)
);

ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- Squad policies: members can see their squads
CREATE POLICY "Members can view their squads" ON public.squads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.squad_members WHERE squad_members.squad_id = squads.id AND squad_members.user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Users can create squads" ON public.squads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update squads" ON public.squads FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Members can view squad members" ON public.squad_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Users can join squads" ON public.squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave squads" ON public.squad_members FOR DELETE USING (auth.uid() = user_id);

-- 14. SQUAD ACTIVITIES (NEW)
CREATE TABLE public.squad_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  activity_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.squad_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view squad activities" ON public.squad_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.squad_members WHERE squad_members.squad_id = squad_activities.squad_id AND squad_members.user_id = auth.uid())
);
CREATE POLICY "Members can create activities" ON public.squad_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. DELIVERY RESTAURANTS (NEW)
CREATE TABLE public.delivery_restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  categories TEXT[]
);

ALTER TABLE public.delivery_restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON public.delivery_restaurants FOR SELECT USING (true);

-- 16. DELIVERY ITEMS (NEW)
CREATE TABLE public.delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id TEXT NOT NULL REFERENCES public.delivery_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  category TEXT,
  image_url TEXT
);

ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view delivery items" ON public.delivery_items FOR SELECT USING (true);

-- 17. USER ROLES (for admin)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_daily_consumption_user_date ON public.daily_consumption(user_id, date);
CREATE INDEX idx_water_consumption_user_date ON public.water_consumption(user_id, date);
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_scan_history_user ON public.scan_history(user_id, created_at DESC);
CREATE INDEX idx_favorite_meals_user ON public.favorite_meals(user_id);
CREATE INDEX idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_squad_members_user ON public.squad_members(user_id);
CREATE INDEX idx_squad_activities_squad ON public.squad_activities(squad_id, created_at DESC);
CREATE INDEX idx_delivery_items_restaurant ON public.delivery_items(restaurant_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_consumption;
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_consumption;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_history;
