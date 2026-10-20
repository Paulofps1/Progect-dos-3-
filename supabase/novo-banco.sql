-- ============================================================================
-- Desafio dos 4 — banco completo para um projeto Supabase novo (vazio).
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar de novo sem
-- problema (não apaga nada que já exista).
-- Só o que o app usa: perfis, refeições, água, treinos, dados do desafio,
-- desafios do grupo e as pastas de fotos.
-- ============================================================================

-- ---------- perfis (criado sozinho quando a conta nasce) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  water_goal_ml integer,
  age integer,
  weight numeric,
  height numeric,
  activity_level text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: ver o proprio" on public.profiles;
create policy "profiles: ver o proprio" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles: criar o proprio" on public.profiles;
create policy "profiles: criar o proprio" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles: editar o proprio" on public.profiles;
create policy "profiles: editar o proprio" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- refeições (meal_items = [{ "fotos": n }]) ----------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  meal_type text,
  date date not null default current_date,
  time text,
  meal_items jsonb not null default '[]'::jsonb,
  total_calories numeric,
  total_protein numeric,
  total_carbs numeric,
  total_fat numeric,
  created_at timestamptz not null default now()
);
create index if not exists meals_user_date on public.meals (user_id, date);

-- ---------- água ----------
create table if not exists public.water_consumption (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_ml integer not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists water_user_date on public.water_consumption (user_id, date);

-- ---------- treinos ----------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  modality text,
  notes text,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_date on public.workout_sessions (user_id, date);

-- cada um só vê e mexe nos próprios registros de refeição, água e treino
do $$
declare t text;
begin
  foreach t in array array['meals', 'water_consumption', 'workout_sessions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s: so os proprios" on public.%I', t, t);
    execute format('create policy "%s: so os proprios" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- ---------- dados do desafio (checklist, pesos, injeções, sono, perfil e o
-- resumo dos dias que os outros veem no Placar) ----------
create table if not exists public.desafio_dados (
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('checks', 'weights', 'injections', 'next_injection', 'days', 'sleep', 'profile')),
  jogador text,
  valor jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, tipo)
);
alter table public.desafio_dados enable row level security;
drop policy if exists "desafio_dados: ver os proprios" on public.desafio_dados;
create policy "desafio_dados: ver os proprios" on public.desafio_dados for select to authenticated using (auth.uid() = user_id);
-- dos outros, só o resumo dos dias e as pesagens (injeção, sono e perfil ficam privados)
drop policy if exists "desafio_dados: ver placar de todos" on public.desafio_dados;
create policy "desafio_dados: ver placar de todos" on public.desafio_dados for select to authenticated using (tipo in ('days', 'weights'));
drop policy if exists "desafio_dados: criar os proprios" on public.desafio_dados;
create policy "desafio_dados: criar os proprios" on public.desafio_dados for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "desafio_dados: editar os proprios" on public.desafio_dados;
create policy "desafio_dados: editar os proprios" on public.desafio_dados for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "desafio_dados: apagar os proprios" on public.desafio_dados;
create policy "desafio_dados: apagar os proprios" on public.desafio_dados for delete to authenticated using (auth.uid() = user_id);

-- ---------- desafios do grupo ----------
create table if not exists public.desafio_desafios (
  id text primary key,
  dados jsonb not null,
  criado_por uuid not null default auth.uid() references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.desafio_desafios enable row level security;
drop policy if exists "desafio_desafios: ver" on public.desafio_desafios;
create policy "desafio_desafios: ver" on public.desafio_desafios for select to authenticated using (true);
drop policy if exists "desafio_desafios: criar" on public.desafio_desafios;
create policy "desafio_desafios: criar" on public.desafio_desafios for insert to authenticated with check (criado_por = auth.uid());
drop policy if exists "desafio_desafios: responder" on public.desafio_desafios;
create policy "desafio_desafios: responder" on public.desafio_desafios for update to authenticated using (true) with check (true);
drop policy if exists "desafio_desafios: apagar" on public.desafio_desafios;
create policy "desafio_desafios: apagar" on public.desafio_desafios for delete to authenticated using (true);

grant select, insert, update, delete on public.profiles, public.meals, public.water_consumption,
  public.workout_sessions, public.desafio_dados, public.desafio_desafios to authenticated;

-- a tela Hoje atualiza sozinha quando entra água ou refeição
do $$
begin
  alter publication supabase_realtime add table public.water_consumption, public.meals;
exception when duplicate_object then null;
end $$;

-- ---------- pastas de fotos ----------
-- refeicoes: fotos dos pratos e evolução do corpo, cada um só vê as próprias
-- provas: print do cardio, todos os participantes veem
insert into storage.buckets (id, name, public) values ('refeicoes', 'refeicoes', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('provas', 'provas', false) on conflict (id) do nothing;

drop policy if exists "refeicoes: ver as proprias" on storage.objects;
create policy "refeicoes: ver as proprias" on storage.objects for select to authenticated
  using (bucket_id = 'refeicoes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "provas: participantes veem" on storage.objects;
create policy "provas: participantes veem" on storage.objects for select to authenticated
  using (bucket_id = 'provas');
drop policy if exists "fotos: enviar as proprias" on storage.objects;
create policy "fotos: enviar as proprias" on storage.objects for insert to authenticated
  with check (bucket_id in ('refeicoes', 'provas') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fotos: trocar as proprias" on storage.objects;
create policy "fotos: trocar as proprias" on storage.objects for update to authenticated
  using (bucket_id in ('refeicoes', 'provas') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fotos: apagar as proprias" on storage.objects;
create policy "fotos: apagar as proprias" on storage.objects for delete to authenticated
  using (bucket_id in ('refeicoes', 'provas') and (storage.foldername(name))[1] = auth.uid()::text);
