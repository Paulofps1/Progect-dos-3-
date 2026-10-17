
-- Table for Nutri IA chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);

-- Table for weekly reports
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  avg_calories NUMERIC DEFAULT 0,
  avg_protein NUMERIC DEFAULT 0,
  avg_carbs NUMERIC DEFAULT 0,
  avg_fat NUMERIC DEFAULT 0,
  avg_water NUMERIC DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  total_meals INTEGER DEFAULT 0,
  weight_change NUMERIC,
  insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own reports" ON public.weekly_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table for recovery mode (anti-relapse)
CREATE TABLE public.recovery_mode (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  mini_goal_calories INTEGER,
  mini_goal_water INTEGER,
  bonus_xp_earned INTEGER DEFAULT 0,
  reason TEXT DEFAULT 'inactivity_detected'
);
ALTER TABLE public.recovery_mode ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own recovery" ON public.recovery_mode FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
