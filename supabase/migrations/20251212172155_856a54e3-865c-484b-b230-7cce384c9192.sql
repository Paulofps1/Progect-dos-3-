-- Create facial_predictions table for storing prediction results
CREATE TABLE public.facial_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  overall_status TEXT NOT NULL DEFAULT 'equilibrio',
  brightness_score INTEGER DEFAULT 50,
  oiliness_score INTEGER DEFAULT 50,
  acne_score INTEGER DEFAULT 50,
  swelling_score INTEGER DEFAULT 50,
  dark_circles_score INTEGER DEFAULT 50,
  redness_score INTEGER DEFAULT 50,
  affected_areas JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  ai_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_skin_impacts table for tracking food impacts on skin
CREATE TABLE public.food_skin_impacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  skin_risk TEXT DEFAULT 'safe',
  impact_details JSONB DEFAULT '{}'::jsonb,
  prediction_id UUID REFERENCES public.facial_predictions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facial_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_skin_impacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for facial_predictions
CREATE POLICY "Users can view their own predictions" 
ON public.facial_predictions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own predictions" 
ON public.facial_predictions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" 
ON public.facial_predictions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions" 
ON public.facial_predictions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for food_skin_impacts
CREATE POLICY "Users can view their own food impacts" 
ON public.food_skin_impacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food impacts" 
ON public.food_skin_impacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food impacts" 
ON public.food_skin_impacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food impacts" 
ON public.food_skin_impacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_facial_predictions_user_id ON public.facial_predictions(user_id);
CREATE INDEX idx_facial_predictions_created_at ON public.facial_predictions(created_at DESC);
CREATE INDEX idx_food_skin_impacts_user_id ON public.food_skin_impacts(user_id);
CREATE INDEX idx_food_skin_impacts_created_at ON public.food_skin_impacts(created_at DESC);

-- Trigger for updating timestamps
CREATE TRIGGER update_facial_predictions_updated_at
BEFORE UPDATE ON public.facial_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();