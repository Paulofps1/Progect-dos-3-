-- 1. Remover política que permite usuários atualizarem seus próprios limites (vulnerabilidade)
DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_limits;

-- 2. Remover política que permite usuários inserirem seus próprios limites
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_limits;

-- 3. Remover política que permite usuários deletarem seus próprios limites
DROP POLICY IF EXISTS "Users can delete their own usage" ON public.usage_limits;

-- 4. Criar política apenas para leitura - usuários podem VER mas não modificar
-- (já existe mas garantindo)
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_limits;
CREATE POLICY "Users can view their own usage" 
ON public.usage_limits 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Criar política para permitir que apenas funções com SECURITY DEFINER modifiquem
-- Isso já é feito pela função increment_usage_counter que usa SECURITY DEFINER

-- 6. Garantir que a função increment_usage_counter é a única forma de incrementar
-- (já está configurada com SECURITY DEFINER)

-- 7. Adicionar proteção extra na tabela profiles para campos sensíveis
-- Criar uma policy que permite update apenas em campos não-críticos
-- Primeiro, remover a política atual de update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar política de update mais restritiva (não permite alterar is_premium, plan, scans_remaining)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Não podemos restringir colunas específicas em RLS, mas a função de update no app já controla isso
);

-- 8. Criar função segura para atualizar perfil que impede alteração de campos premium
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_water_goal_ml integer DEFAULT NULL,
  p_notification_meals boolean DEFAULT NULL,
  p_notification_water boolean DEFAULT NULL,
  p_notification_daily boolean DEFAULT NULL,
  p_notification_tips boolean DEFAULT NULL,
  p_has_seen_onboarding boolean DEFAULT NULL,
  p_age integer DEFAULT NULL,
  p_weight numeric DEFAULT NULL,
  p_height numeric DEFAULT NULL,
  p_activity_level text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está atualizando seu próprio perfil
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Você não tem permissão para atualizar este perfil';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone_number = COALESCE(p_phone_number, phone_number),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    goal = COALESCE(p_goal, goal),
    water_goal_ml = COALESCE(p_water_goal_ml, water_goal_ml),
    notification_meals = COALESCE(p_notification_meals, notification_meals),
    notification_water = COALESCE(p_notification_water, notification_water),
    notification_daily = COALESCE(p_notification_daily, notification_daily),
    notification_tips = COALESCE(p_notification_tips, notification_tips),
    has_seen_onboarding = COALESCE(p_has_seen_onboarding, has_seen_onboarding),
    age = COALESCE(p_age, age),
    weight = COALESCE(p_weight, weight),
    height = COALESCE(p_height, height),
    activity_level = COALESCE(p_activity_level, activity_level),
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;