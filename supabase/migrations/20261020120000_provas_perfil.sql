-- Perfil do desafio (altura, meta de peso, meta de água, foto) em desafio_dados,
-- e participantes além dos 3 (o nome deixa de ser fixo no banco).
alter table public.desafio_dados drop constraint if exists desafio_dados_tipo_check;
alter table public.desafio_dados add constraint desafio_dados_tipo_check
  check (tipo in ('checks', 'weights', 'injections', 'next_injection', 'days', 'sleep', 'profile'));
alter table public.desafio_dados drop constraint if exists desafio_dados_jogador_check;

-- Fotos de prova de treino/cardio: todos os participantes veem; cada um só
-- envia/apaga na própria subpasta (<id do usuário>/<dia>/treino.jpg).
insert into storage.buckets (id, name, public) values ('provas', 'provas', false)
on conflict (id) do nothing;

drop policy if exists "provas: participantes veem" on storage.objects;
create policy "provas: participantes veem" on storage.objects
  for select to authenticated using (bucket_id = 'provas');

drop policy if exists "provas: enviar as proprias" on storage.objects;
create policy "provas: enviar as proprias" on storage.objects
  for insert to authenticated with check (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "provas: trocar as proprias" on storage.objects;
create policy "provas: trocar as proprias" on storage.objects
  for update to authenticated using (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "provas: apagar as proprias" on storage.objects;
create policy "provas: apagar as proprias" on storage.objects
  for delete to authenticated using (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);
