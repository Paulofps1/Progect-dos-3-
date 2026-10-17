-- Create diets table
CREATE TABLE public.diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  calories_target INTEGER DEFAULT 0,
  protein_target INTEGER DEFAULT 0,
  carbs_target INTEGER DEFAULT 0,
  fat_target INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_consumption table to track daily nutrient intake
CREATE TABLE public.daily_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  diet_id UUID REFERENCES public.diets(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, diet_id, date)
);

-- Enable RLS
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_consumption ENABLE ROW LEVEL SECURITY;

-- Diets policies
CREATE POLICY "Users can view their own diets" ON public.diets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own diets" ON public.diets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diets" ON public.diets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diets" ON public.diets FOR DELETE USING (auth.uid() = user_id);

-- Daily consumption policies
CREATE POLICY "Users can view their own consumption" ON public.daily_consumption FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own consumption" ON public.daily_consumption FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consumption" ON public.daily_consumption FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consumption" ON public.daily_consumption FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_diets_updated_at BEFORE UPDATE ON public.diets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_consumption_updated_at BEFORE UPDATE ON public.daily_consumption FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();