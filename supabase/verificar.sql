-- Confere se o banco do Desafio está completo. Cole no SQL Editor e rode:
-- cada linha diz OK ou FALTA. Não muda nada no banco.
with checks(ordem, item, ok) as (
  select 1, 'tabela profiles', to_regclass('public.profiles') is not null union all
  select 2, 'tabela meals', to_regclass('public.meals') is not null union all
  select 3, 'tabela water_consumption', to_regclass('public.water_consumption') is not null union all
  select 4, 'tabela workout_sessions', to_regclass('public.workout_sessions') is not null union all
  select 5, 'tabela desafio_dados', to_regclass('public.desafio_dados') is not null union all
  select 6, 'tabela desafio_desafios', to_regclass('public.desafio_desafios') is not null union all
  select 7, 'segurança ligada nas 6 tabelas (RLS)',
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relrowsecurity
       and c.relname in ('profiles', 'meals', 'water_consumption', 'workout_sessions', 'desafio_dados', 'desafio_desafios')) = 6 union all
  select 8, 'permissões das tabelas (políticas)',
    (select count(*) from pg_policies where schemaname = 'public'
       and tablename in ('profiles', 'meals', 'water_consumption', 'workout_sessions', 'desafio_dados', 'desafio_desafios')) >= 15 union all
  select 9, 'perfil criado sozinho no cadastro (gatilho)',
    exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal) union all
  select 10, 'tipos aceitos em desafio_dados (sono e perfil)',
    exists (select 1 from pg_constraint where conname = 'desafio_dados_tipo_check'
      and pg_get_constraintdef(oid) like '%sleep%' and pg_get_constraintdef(oid) like '%profile%') union all
  select 11, 'nome do jogador livre (aceita o Rogério)',
    not exists (select 1 from pg_constraint where conname = 'desafio_dados_jogador_check') union all
  select 12, 'pasta de fotos refeicoes', exists (select 1 from storage.buckets where id = 'refeicoes') union all
  select 13, 'pasta de fotos provas', exists (select 1 from storage.buckets where id = 'provas') union all
  select 14, 'permissões das fotos',
    (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
       and policyname in ('refeicoes: ver as proprias', 'provas: participantes veem', 'fotos: enviar as proprias',
                          'fotos: trocar as proprias', 'fotos: apagar as proprias')) = 5 union all
  select 15, 'Hoje atualiza sozinho (realtime de água e refeições)',
    (select count(*) from pg_publication_tables where pubname = 'supabase_realtime'
       and tablename in ('water_consumption', 'meals')) = 2 union all
  select 16, 'contas dos 4 jogadores',
    (select count(*) from auth.users where email in ('paulo@desafiodos3.app', 'arthur@desafiodos3.app',
       'rafaela@desafiodos3.app', 'rogerio@desafiodos3.app')) = 4 union all
  select 17, 'dia 19 importado (checklist de Paulo, Arthur e Rafaela)',
    (select count(distinct d.user_id) from public.desafio_dados d join auth.users u on u.id = d.user_id
     where d.tipo = 'checks' and d.valor ? '2026-10-19'
       and u.email in ('paulo@desafiodos3.app', 'arthur@desafiodos3.app', 'rafaela@desafiodos3.app')) = 3 union all
  select 18, 'desafio Semana sem doce', exists (select 1 from public.desafio_desafios where id = 'mvcpbd8xdh8e') union all
  select 19, 'Rogério na Semana sem doce',
    exists (select 1 from public.desafio_desafios where id = 'mvcpbd8xdh8e' and dados -> 'players' ? 'Rogério')
)
select item, case when ok then 'OK' else 'FALTA' end as situacao from checks order by ordem;
