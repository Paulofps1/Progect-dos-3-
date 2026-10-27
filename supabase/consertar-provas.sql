-- Conserta "Bucket not found" ao mandar a prova da caminhada.
-- Pode rodar quantas vezes quiser: não apaga nada.

-- 1) cria a pasta "provas" se ela não existir
insert into storage.buckets (id, name, public) values ('provas', 'provas', false) on conflict (id) do nothing;

-- 2) regras de acesso (todos os participantes veem; cada um envia/apaga só as suas)
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

-- 3) resultado: as duas pastas e quantas fotos cada uma já tem
select b.id as pasta, count(o.id) as fotos
from storage.buckets b left join storage.objects o on o.bucket_id = b.id
where b.id in ('refeicoes', 'provas')
group by b.id;
