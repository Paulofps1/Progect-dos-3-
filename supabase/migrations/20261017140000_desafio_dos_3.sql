-- Desafio dos 3: dados do desafio no banco, para o Placar e os Desafios entre os 3.

-- Um registro por pessoa e por tipo (checklist, pesagens, injeções, próxima injeção
-- e o resumo dos dias, que é o que os outros dois veem no Placar).
create table if not exists public.desafio_dados (
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('checks', 'weights', 'injections', 'next_injection', 'days')),
  jogador text check (jogador in ('Paulo', 'Arthur', 'Rafaela')),
  valor jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, tipo)
);

alter table public.desafio_dados enable row level security;

drop policy if exists "desafio_dados: ver os proprios" on public.desafio_dados;
create policy "desafio_dados: ver os proprios" on public.desafio_dados
  for select to authenticated using (auth.uid() = user_id);

-- dos outros, só o resumo dos dias e as pesagens (injeções ficam privadas)
drop policy if exists "desafio_dados: ver placar dos 3" on public.desafio_dados;
create policy "desafio_dados: ver placar dos 3" on public.desafio_dados
  for select to authenticated using (tipo in ('days', 'weights'));

drop policy if exists "desafio_dados: criar os proprios" on public.desafio_dados;
create policy "desafio_dados: criar os proprios" on public.desafio_dados
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "desafio_dados: editar os proprios" on public.desafio_dados;
create policy "desafio_dados: editar os proprios" on public.desafio_dados
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "desafio_dados: apagar os proprios" on public.desafio_dados;
create policy "desafio_dados: apagar os proprios" on public.desafio_dados
  for delete to authenticated using (auth.uid() = user_id);

-- Mini-desafios: os 3 veem, criam, aceitam/recusam e tiram da lista.
create table if not exists public.desafio_desafios (
  id text primary key,
  dados jsonb not null,
  criado_por uuid not null default auth.uid() references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.desafio_desafios enable row level security;

drop policy if exists "desafio_desafios: ver" on public.desafio_desafios;
create policy "desafio_desafios: ver" on public.desafio_desafios
  for select to authenticated using (true);

drop policy if exists "desafio_desafios: criar" on public.desafio_desafios;
create policy "desafio_desafios: criar" on public.desafio_desafios
  for insert to authenticated with check (criado_por = auth.uid());

drop policy if exists "desafio_desafios: responder" on public.desafio_desafios;
create policy "desafio_desafios: responder" on public.desafio_desafios
  for update to authenticated using (true) with check (true);

drop policy if exists "desafio_desafios: apagar" on public.desafio_desafios;
create policy "desafio_desafios: apagar" on public.desafio_desafios
  for delete to authenticated using (true);
