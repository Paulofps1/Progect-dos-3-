-- Create body_photos table for progress tracking
CREATE TABLE public.body_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'front', -- front, side, back
  weight_at_time NUMERIC,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own body photos"
  ON public.body_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body photos"
  ON public.body_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body photos"
  ON public.body_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for body photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-photos', 'body-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view their own body photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own body photos storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own body photos storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);