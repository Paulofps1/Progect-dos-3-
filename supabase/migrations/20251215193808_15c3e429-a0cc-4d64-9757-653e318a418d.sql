-- Create meals table for meal tracking
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- breakfast, lunch, snack, dinner, supper, custom
  meal_type TEXT NOT NULL DEFAULT 'custom', -- breakfast, lunch, snack, dinner, supper
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME,
  total_calories INTEGER DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  photo_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_items table for foods within meals
CREATE TABLE public.meal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'porção', -- grams, units, portion
  calories INTEGER DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meals
CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_items
CREATE POLICY "Users can view their own meal items"
  ON public.meal_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal items"
  ON public.meal_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal items"
  ON public.meal_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal items"
  ON public.meal_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_meal_items_meal ON public.meal_items(meal_id);