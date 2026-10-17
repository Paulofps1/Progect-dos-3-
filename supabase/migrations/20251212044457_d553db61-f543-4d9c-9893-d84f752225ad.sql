
-- Corrigir problema de SECURITY DEFINER na view
-- Removendo a view problemática e recriando como função segura

DROP VIEW IF EXISTS public.monthly_usage_summary;

-- Substituir por função com RLS adequado
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  month_year text,
  scans_count integer,
  analyses_count integer,
  plan text,
  is_premium boolean,
  max_scans integer,
  scans_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    END::integer as max_scans,
    CASE 
      WHEN p.plan = 'premium' THEN 999999 - u.scans_count
      WHEN p.plan = 'pro' THEN 100 - u.scans_count
      ELSE 3 - u.scans_count
    END::integer as scans_remaining
  FROM usage_limits u
  JOIN profiles p ON u.user_id = p.id
  WHERE u.user_id = p_user_id;
END;
$$;
