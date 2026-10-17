-- Fotos das refeições: pasta privada "refeicoes", cada um só mexe na própria
-- subpasta (<id do usuário>/<id da refeição>/<n>.jpg).
insert into storage.buckets (id, name, public)
values ('refeicoes', 'refeicoes', false)
on conflict (id) do nothing;

drop policy if exists "refeicoes: ver as proprias" on storage.objects;
create policy "refeicoes: ver as proprias" on storage.objects
  for select to authenticated using (bucket_id = 'refeicoes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "refeicoes: enviar as proprias" on storage.objects;
create policy "refeicoes: enviar as proprias" on storage.objects
  for insert to authenticated with check (bucket_id = 'refeicoes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "refeicoes: trocar as proprias" on storage.objects;
create policy "refeicoes: trocar as proprias" on storage.objects
  for update to authenticated using (bucket_id = 'refeicoes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "refeicoes: apagar as proprias" on storage.objects;
create policy "refeicoes: apagar as proprias" on storage.objects
  for delete to authenticated using (bucket_id = 'refeicoes' and (storage.foldername(name))[1] = auth.uid()::text);
