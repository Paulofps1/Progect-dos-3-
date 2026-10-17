-- Add new columns to profiles table for Hubla integration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purchased_via_hubla BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hubla_transaction_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_created BOOLEAN DEFAULT true;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (following security best practices - roles in separate table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create hubla_webhook_logs table
CREATE TABLE public.hubla_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  event TEXT,
  product_name TEXT,
  transaction_id TEXT,
  plano_aplicado TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  raw_payload JSONB
);

-- Enable RLS on hubla_webhook_logs
ALTER TABLE public.hubla_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
ON public.hubla_webhook_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert logs (for edge function)
CREATE POLICY "Service role can insert webhook logs"
ON public.hubla_webhook_logs
FOR INSERT
WITH CHECK (true);

-- Insert admin role for specified user (will be created after user exists)
-- This needs to be done manually or via a separate process after the user signs up