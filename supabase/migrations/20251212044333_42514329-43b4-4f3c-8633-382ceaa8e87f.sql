
-- ============================================
-- AUDITORIA NUTRICERTO - CORREÇÕES COMPLETAS
-- ============================================

-- 1. ADICIONAR POLICY UPDATE FALTANTE EM water_consumption
CREATE POLICY "Users can update their own water consumption" 
ON public.water_consumption 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. ADICIONAR POLICY UPDATE FALTANTE EM scan_history
CREATE POLICY "Users can update their own scans" 
ON public.scan_history 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. CRIAR ÍNDICES DE PERFORMANCE

-- Índice em barcode para buscas rápidas de produtos
CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON public.scan_history (barcode);

-- Índice em user_id para todas as tabelas (acelera queries com RLS)
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history (user_id);
CREATE INDEX IF NOT EXISTS idx_water_consumption_user_id ON public.water_consumption (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_consumption_user_id ON public.daily_consumption (user_id);
CREATE INDEX IF NOT EXISTS idx_diets_user_id ON public.diets (user_id);

-- Índice em created_at para ordenação
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON public.scan_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_consumption_date ON public.water_consumption (date);
CREATE INDEX IF NOT EXISTS idx_daily_consumption_date ON public.daily_consumption (date);

-- Índice composto para queries frequentes (user + date)
CREATE INDEX IF NOT EXISTS idx_daily_consumption_user_date ON public.daily_consumption (user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_consumption_user_date ON public.water_consumption (user_id, date);

-- Índice para dietas ativas
CREATE INDEX IF NOT EXISTS idx_diets_active ON public.diets (user_id, is_active) WHERE is_active = true;

-- 4. ADICIONAR TRIGGERS DE updated_at FALTANTES

-- Trigger para water_consumption
CREATE TRIGGER update_water_consumption_updated_at
  BEFORE UPDATE ON public.water_consumption
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para scan_history
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

CREATE TRIGGER update_scan_history_updated_at
  BEFORE UPDATE ON public.scan_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CRIAR TABELA DE LIMITES DE USO (para controle de planos)
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- formato: 'YYYY-MM'
  scans_count integer NOT NULL DEFAULT 0,
  analyses_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- RLS para usage_limits
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" 
ON public.usage_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.usage_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
ON public.usage_limits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Índice para usage_limits
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_month ON public.usage_limits (user_id, month_year);

-- Trigger para usage_limits updated_at
CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. FUNÇÃO PARA VERIFICAR LIMITES DO USUÁRIO
CREATE OR REPLACE FUNCTION public.check_user_limits(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles;
  v_current_month text;
  v_usage usage_limits;
  v_max_scans integer;
  v_scans_used integer;
BEGIN
  -- Pegar perfil do usuário
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Definir limite baseado no plano
  CASE v_profile.plan
    WHEN 'premium' THEN v_max_scans := 999999;
    WHEN 'pro' THEN v_max_scans := 100;
    ELSE v_max_scans := 3; -- free
  END CASE;
  
  -- Mês atual
  v_current_month := to_char(now(), 'YYYY-MM');
  
  -- Pegar uso atual
  SELECT * INTO v_usage 
  FROM usage_limits 
  WHERE user_id = p_user_id AND month_year = v_current_month;
  
  IF v_usage IS NULL THEN
    v_scans_used := 0;
  ELSE
    v_scans_used := v_usage.scans_count;
  END IF;
  
  RETURN json_build_object(
    'plan', v_profile.plan,
    'is_premium', v_profile.is_premium,
    'max_scans', v_max_scans,
    'scans_used', v_scans_used,
    'scans_remaining', GREATEST(0, v_max_scans - v_scans_used),
    'can_scan', v_scans_used < v_max_scans
  );
END;
$$;

-- 7. FUNÇÃO PARA INCREMENTAR CONTADOR DE USO
CREATE OR REPLACE FUNCTION public.increment_usage_counter(p_user_id uuid, p_counter_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month text;
BEGIN
  v_current_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO usage_limits (user_id, month_year, scans_count, analyses_count)
  VALUES (p_user_id, v_current_month, 
    CASE WHEN p_counter_type = 'scan' THEN 1 ELSE 0 END,
    CASE WHEN p_counter_type = 'analysis' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, month_year) DO UPDATE SET
    scans_count = usage_limits.scans_count + CASE WHEN p_counter_type = 'scan' THEN 1 ELSE 0 END,
    analyses_count = usage_limits.analyses_count + CASE WHEN p_counter_type = 'analysis' THEN 1 ELSE 0 END,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- 8. CRIAR VIEW PARA USO MENSAL
CREATE OR REPLACE VIEW public.monthly_usage_summary AS
SELECT 
  u.user_id,
  u.month_year,
  u.scans_count,
  u.analyses_count,
  p.plan,
  p.is_premium,
  CASE 
    WHEN p.plan = 'premium' THEN 999999
    WHEN p.plan = 'pro' THEN 100
    ELSE 3
  END as max_scans,
  CASE 
    WHEN p.plan = 'premium' THEN 999999 - u.scans_count
    WHEN p.plan = 'pro' THEN 100 - u.scans_count
    ELSE 3 - u.scans_count
  END as scans_remaining
FROM usage_limits u
JOIN profiles p ON u.user_id = p.id;
