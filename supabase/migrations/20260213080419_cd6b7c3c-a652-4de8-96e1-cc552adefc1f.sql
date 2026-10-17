
-- Body Measurements table
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  weight NUMERIC NULL,
  waist NUMERIC NULL,
  hip NUMERIC NULL,
  body_fat NUMERIC NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own measurements"
ON public.body_measurements FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, date);

-- Brazilian Foods table (reference data, public read)
CREATE TABLE public.brazilian_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NULL DEFAULT 0,
  serving_size TEXT NULL,
  serving_grams NUMERIC NULL,
  healthier_alternative TEXT NULL
);

ALTER TABLE public.brazilian_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brazilian foods"
ON public.brazilian_foods FOR SELECT
USING (true);

CREATE INDEX idx_brazilian_foods_name ON public.brazilian_foods USING gin(to_tsvector('portuguese', name));

-- Recipes table (public read)
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NULL,
  category TEXT NULL,
  diet_type TEXT[] NULL,
  prep_time_min INTEGER NULL,
  servings INTEGER NULL DEFAULT 1,
  calories_per_serving INTEGER NULL,
  protein_per_serving NUMERIC NULL,
  carbs_per_serving NUMERIC NULL,
  fat_per_serving NUMERIC NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipes"
ON public.recipes FOR SELECT
USING (true);

-- Seed Brazilian Foods (common items)
INSERT INTO public.brazilian_foods (name, category, calories, protein, carbs, fat, fiber, serving_size, serving_grams, healthier_alternative) VALUES
('Arroz branco cozido', 'Cereais', 128, 2.5, 28.1, 0.2, 1.6, '1 xícara', 160, 'Arroz integral cozido'),
('Arroz integral cozido', 'Cereais', 124, 2.6, 25.8, 1.0, 2.7, '1 xícara', 160, NULL),
('Feijão carioca cozido', 'Leguminosas', 76, 4.8, 13.6, 0.5, 8.5, '1 concha', 86, NULL),
('Feijão preto cozido', 'Leguminosas', 77, 4.5, 14.0, 0.5, 8.4, '1 concha', 86, NULL),
('Frango grelhado (peito)', 'Carnes', 159, 32.0, 0.0, 3.6, 0.0, '1 filé', 100, NULL),
('Frango frito (coxa)', 'Carnes', 245, 26.0, 3.0, 14.0, 0.0, '1 coxa', 100, 'Frango grelhado (peito)'),
('Ovo cozido', 'Ovos', 72, 6.3, 0.4, 5.0, 0.0, '1 unidade', 50, NULL),
('Ovo frito', 'Ovos', 107, 6.3, 0.4, 9.0, 0.0, '1 unidade', 50, 'Ovo cozido'),
('Banana prata', 'Frutas', 98, 1.3, 26.0, 0.1, 2.0, '1 unidade', 100, NULL),
('Maçã', 'Frutas', 56, 0.3, 15.2, 0.0, 1.3, '1 unidade', 120, NULL),
('Mamão papaya', 'Frutas', 40, 0.5, 10.4, 0.1, 1.8, '1 fatia', 100, NULL),
('Laranja', 'Frutas', 47, 1.0, 11.7, 0.1, 2.2, '1 unidade', 130, NULL),
('Pão francês', 'Pães', 135, 4.1, 24.6, 2.3, 1.2, '1 unidade', 50, 'Pão integral'),
('Pão integral', 'Pães', 110, 4.4, 20.0, 1.4, 3.0, '1 unidade', 50, NULL),
('Batata doce cozida', 'Tubérculos', 77, 0.6, 18.4, 0.1, 2.2, '1 unidade média', 100, NULL),
('Mandioca cozida', 'Tubérculos', 125, 0.6, 30.1, 0.3, 1.6, '1 pedaço', 100, 'Batata doce cozida'),
('Leite integral', 'Laticínios', 61, 3.2, 4.7, 3.5, 0.0, '1 copo', 200, 'Leite desnatado'),
('Leite desnatado', 'Laticínios', 35, 3.4, 5.0, 0.1, 0.0, '1 copo', 200, NULL),
('Iogurte natural', 'Laticínios', 51, 4.1, 6.1, 0.7, 0.0, '1 pote', 170, NULL),
('Queijo minas frescal', 'Laticínios', 264, 17.4, 3.2, 20.2, 0.0, '1 fatia (30g)', 30, NULL),
('Alface', 'Verduras', 11, 1.3, 1.7, 0.2, 1.0, '1 prato', 100, NULL),
('Tomate', 'Verduras', 15, 1.1, 3.1, 0.2, 1.2, '1 unidade', 100, NULL),
('Cenoura crua', 'Verduras', 34, 1.3, 7.7, 0.2, 3.2, '1 unidade', 100, NULL),
('Brócolis cozido', 'Verduras', 25, 2.1, 4.4, 0.0, 2.9, '1 xícara', 100, NULL),
('Abacate', 'Frutas', 96, 1.2, 6.0, 8.4, 6.3, '1/2 unidade', 100, NULL),
('Açaí (polpa)', 'Frutas', 58, 0.8, 6.2, 3.9, 2.6, '100ml', 100, NULL),
('Tapioca', 'Cereais', 68, 0.0, 17.1, 0.0, 0.0, '1 unidade', 50, 'Pão integral'),
('Carne bovina (patinho)', 'Carnes', 219, 35.9, 0.0, 7.3, 0.0, '1 bife', 100, NULL),
('Carne moída', 'Carnes', 212, 26.7, 0.0, 11.0, 0.0, '1 porção', 100, 'Carne bovina (patinho)'),
('Peixe tilápia', 'Carnes', 96, 20.1, 0.0, 1.7, 0.0, '1 filé', 100, NULL),
('Granola', 'Cereais', 421, 10.0, 63.7, 15.6, 6.0, '1/4 xícara', 40, NULL),
('Aveia em flocos', 'Cereais', 394, 13.9, 66.6, 8.5, 9.1, '2 colheres', 30, NULL),
('Azeite de oliva', 'Óleos', 884, 0.0, 0.0, 100.0, 0.0, '1 colher sopa', 13, NULL),
('Castanha do Pará', 'Oleaginosas', 656, 14.5, 12.3, 63.5, 7.9, '2 unidades', 8, NULL),
('Whey Protein', 'Suplementos', 120, 24.0, 3.0, 1.5, 0.0, '1 scoop', 30, NULL);

-- Seed Recipes
INSERT INTO public.recipes (name, description, category, diet_type, prep_time_min, servings, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, ingredients, instructions) VALUES
('Frango grelhado com batata doce', 'Clássico do fitness brasileiro', 'Almoço', ARRAY['high-protein','low-fat'], 25, 1, 350, 38, 30, 8, '[{"name":"Peito de frango","amount":"150g"},{"name":"Batata doce","amount":"150g"},{"name":"Azeite","amount":"1 colher chá"},{"name":"Sal e temperos","amount":"a gosto"}]'::jsonb, ARRAY['Tempere o frango com sal e pimenta','Grelhe em frigideira antiaderente por 6 min cada lado','Cozinhe a batata doce no vapor por 15 min','Sirva com azeite por cima']),
('Omelete de claras com espinafre', 'Café da manhã proteico e leve', 'Café da manhã', ARRAY['low-carb','high-protein'], 10, 1, 150, 22, 3, 5, '[{"name":"Claras de ovo","amount":"4 unidades"},{"name":"Espinafre","amount":"1 xícara"},{"name":"Queijo minas","amount":"30g"},{"name":"Sal","amount":"a gosto"}]'::jsonb, ARRAY['Bata as claras levemente','Refogue o espinafre','Despeje as claras na frigideira','Adicione o queijo e dobre']),
('Bowl de açaí fit', 'Versão saudável sem excesso de açúcar', 'Lanche', ARRAY['vegan','low-fat'], 5, 1, 280, 5, 45, 8, '[{"name":"Polpa de açaí","amount":"200ml"},{"name":"Banana","amount":"1/2 unidade"},{"name":"Granola","amount":"2 colheres"},{"name":"Mel","amount":"1 colher chá"}]'::jsonb, ARRAY['Bata o açaí com a banana no liquidificador','Despeje no bowl','Adicione granola e mel por cima']),
('Arroz integral com feijão e salada', 'Almoço completo e equilibrado', 'Almoço', ARRAY['balanced','vegan'], 40, 2, 320, 14, 52, 4, '[{"name":"Arroz integral","amount":"1 xícara"},{"name":"Feijão carioca","amount":"1 concha"},{"name":"Alface","amount":"3 folhas"},{"name":"Tomate","amount":"1 unidade"},{"name":"Azeite","amount":"1 colher"}]'::jsonb, ARRAY['Cozinhe o arroz integral','Aqueça o feijão','Monte o prato com a salada','Finalize com azeite']),
('Shake proteico de banana', 'Pós-treino rápido', 'Lanche', ARRAY['high-protein'], 5, 1, 280, 30, 32, 5, '[{"name":"Whey protein","amount":"1 scoop"},{"name":"Banana","amount":"1 unidade"},{"name":"Leite desnatado","amount":"250ml"},{"name":"Aveia","amount":"2 colheres"}]'::jsonb, ARRAY['Bata todos os ingredientes no liquidificador','Sirva gelado']),
('Salada de atum', 'Almoço leve e rico em ômega 3', 'Almoço', ARRAY['low-carb','high-protein'], 10, 1, 220, 28, 8, 9, '[{"name":"Atum em lata (light)","amount":"1 lata"},{"name":"Alface","amount":"4 folhas"},{"name":"Tomate","amount":"1 unidade"},{"name":"Cenoura ralada","amount":"1/2"},{"name":"Azeite","amount":"1 colher"}]'::jsonb, ARRAY['Escorra o atum','Pique os vegetais','Misture tudo','Tempere com azeite e limão']),
('Tapioca com queijo e tomate', 'Café da manhã rápido', 'Café da manhã', ARRAY['low-fat'], 10, 1, 180, 8, 25, 5, '[{"name":"Tapioca (goma)","amount":"2 colheres"},{"name":"Queijo minas","amount":"30g"},{"name":"Tomate","amount":"2 fatias"},{"name":"Orégano","amount":"a gosto"}]'::jsonb, ARRAY['Espalhe a goma na frigideira quente','Quando firmar, vire','Adicione queijo e tomate','Dobre e sirva']),
('Panqueca de banana com aveia', 'Café da manhã fit', 'Café da manhã', ARRAY['balanced'], 15, 2, 180, 8, 28, 5, '[{"name":"Banana","amount":"1 unidade"},{"name":"Ovos","amount":"2 unidades"},{"name":"Aveia","amount":"3 colheres"},{"name":"Canela","amount":"a gosto"}]'::jsonb, ARRAY['Amasse a banana','Misture com os ovos e aveia','Despeje porções na frigideira','Doure dos dois lados']);
