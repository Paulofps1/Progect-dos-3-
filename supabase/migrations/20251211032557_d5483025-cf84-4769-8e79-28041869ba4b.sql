-- Create webhook_logs table for Kiwify integration
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email TEXT NOT NULL,
  evento TEXT NOT NULL,
  produto TEXT,
  plano_aplicado TEXT,
  status TEXT NOT NULL DEFAULT 'success'
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage webhook_logs"
ON public.webhook_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add plan field to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;