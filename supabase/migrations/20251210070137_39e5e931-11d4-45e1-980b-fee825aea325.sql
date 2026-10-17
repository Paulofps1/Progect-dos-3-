-- Create water_consumption table
CREATE TABLE public.water_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_consumption ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own water consumption" 
ON public.water_consumption 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water consumption" 
ON public.water_consumption 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water consumption" 
ON public.water_consumption 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add water goal fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS water_goal_ml INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';