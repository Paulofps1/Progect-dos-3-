
-- =============================================
-- CORREÇÕES DE SEGURANÇA ADICIONAIS
-- =============================================

-- 1. ADICIONAR TRIGGER PARA VALIDAR LIMITES DE SCAN (SERVER-SIDE)
CREATE OR REPLACE FUNCTION public.enforce_scan_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_scans_limit INTEGER;
  v_month_scans INTEGER;
  v_current_month TEXT;
BEGIN
  -- Pegar status premium do usuário
  SELECT is_premium, scans_remaining INTO v_is_premium, v_scans_limit
  FROM profiles WHERE id = NEW.user_id;
  
  -- Premium não tem limite
  IF v_is_premium = true THEN
    RETURN NEW;
  END IF;
  
  -- Contar scans do mês atual
  v_current_month := to_char(now(), 'YYYY-MM');
  SELECT COALESCE(scans_count, 0) INTO v_month_scans
  FROM usage_limits
  WHERE user_id = NEW.user_id AND month_year = v_current_month;
  
  -- Verificar limite
  IF v_month_scans >= COALESCE(v_scans_limit, 3) THEN
    RAISE EXCEPTION 'Limite de escaneamentos excedido. Faça upgrade para Premium.';
  END IF;
  
  -- Incrementar contador
  PERFORM increment_usage_counter(NEW.user_id, 'scan');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS check_scan_limits ON scan_history;
CREATE TRIGGER check_scan_limits
  BEFORE INSERT ON scan_history
  FOR EACH ROW EXECUTE FUNCTION enforce_scan_limits();

-- 2. ADICIONAR CONSTRAINTS DE VALIDAÇÃO NO BANCO
-- Limitar tamanho do product_name
ALTER TABLE scan_history 
  DROP CONSTRAINT IF EXISTS product_name_length;
ALTER TABLE scan_history 
  ADD CONSTRAINT product_name_length CHECK (length(product_name) BETWEEN 1 AND 500);

-- Limitar formato do barcode
ALTER TABLE scan_history 
  DROP CONSTRAINT IF EXISTS barcode_format;
ALTER TABLE scan_history 
  ADD CONSTRAINT barcode_format CHECK (
    barcode IS NULL OR 
    (length(barcode) BETWEEN 1 AND 50 AND barcode ~ '^[0-9A-Za-z\-]+$')
  );

-- 3. MELHORAR VALIDAÇÃO NO handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extrair e validar full_name
  v_full_name := new.raw_user_meta_data ->> 'full_name';
  
  -- Limitar tamanho
  IF v_full_name IS NOT NULL AND length(v_full_name) > 255 THEN
    v_full_name := substring(v_full_name from 1 for 255);
  END IF;
  
  -- Inserir profile com defaults seguros
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(v_full_name, 'Usuário'));
  
  RETURN new;
END;
$$;

-- 4. ADICIONAR CONSTRAINT DE TAMANHO NO PROFILES
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS full_name_length;
ALTER TABLE profiles 
  ADD CONSTRAINT full_name_length CHECK (full_name IS NULL OR length(full_name) <= 255);

ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS phone_number_format;
ALTER TABLE profiles 
  ADD CONSTRAINT phone_number_format CHECK (
    phone_number IS NULL OR 
    (length(phone_number) BETWEEN 10 AND 20 AND phone_number ~ '^[0-9\+\-\(\)\s]+$')
  );

-- 5. CONSTRAINTS PARA DIETS
ALTER TABLE diets 
  DROP CONSTRAINT IF EXISTS diet_name_length;
ALTER TABLE diets 
  ADD CONSTRAINT diet_name_length CHECK (length(name) BETWEEN 1 AND 200);

ALTER TABLE diets 
  DROP CONSTRAINT IF EXISTS calories_positive;
ALTER TABLE diets 
  ADD CONSTRAINT calories_positive CHECK (
    calories_target IS NULL OR calories_target >= 0
  );

-- 6. ADICIONAR ÍNDICE PARA PERFORMANCE EM USER_ROLES
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
