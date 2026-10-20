-- ============================================================================
-- Traz para o banco novo o que cada um marcou no banco antigo (Lovable) até 19/10:
-- checklist, injeções, sono, água, treinos, meta de água e o desafio "sem doce".
-- Cole no SQL Editor do Supabase novo e clique em Run.
-- Encontra cada pessoa pelo e-mail interno (paulo@desafiodos3.app etc.): quem ainda
-- não entrou no app novo fica de fora. Pode rodar de novo depois que todos
-- entrarem: não duplica nada e não apaga o que já foi marcado no app novo.
-- ============================================================================

-- junta o que já está no banco novo com o que veio do antigo (o novo vale mais):
-- objetos por dia são mesclados; listas (injeções, sono) juntam sem repetir o dia
create or replace function pg_temp.mesclar(novo jsonb, antigo jsonb) returns jsonb language sql as $$
  select case
    when novo is null then antigo
    when jsonb_typeof(novo) = 'object' and jsonb_typeof(antigo) = 'object' then (
      select coalesce(jsonb_object_agg(k, case
        when jsonb_typeof(novo -> k) = 'object' and jsonb_typeof(antigo -> k) = 'object' then (antigo -> k) || (novo -> k)
        else coalesce(novo -> k, antigo -> k) end), '{}'::jsonb)
      from (select jsonb_object_keys(novo) k union select jsonb_object_keys(antigo)) ks)
    when jsonb_typeof(novo) = 'array' and jsonb_typeof(antigo) = 'array' then
      novo || coalesce((select jsonb_agg(a) from jsonb_array_elements(antigo) a
        where not exists (select 1 from jsonb_array_elements(novo) n where n ->> 'date' = a ->> 'date')), '[]'::jsonb)
    else novo
  end
$$;

create temp table antigo (email text, tipo text, jogador text, valor jsonb) on commit drop;
insert into antigo values
  -- checklist
  ('paulo@desafiodos3.app', 'checks', 'Paulo', '{"2026-10-17":{"cardio":false,"passos":false},"2026-10-19":{"cardio":true,"comida":true,"doce":true,"passos":true}}'),
  ('arthur@desafiodos3.app', 'checks', 'Arthur', '{"2026-10-17":{"cardio":true,"passos":true},"2026-10-19":{"cardio":true,"comida":true,"doce":true,"passos":true,"proteina":true}}'),
  ('rafaela@desafiodos3.app', 'checks', 'Rafaela', '{"2026-10-17":{"cardio":true},"2026-10-18":{"doce":false},"2026-10-19":{"cardio":true,"comida":true,"doce":true,"passos":true,"proteina":false}}'),
  -- Rogério em 19/10: não treinou, comeu doce, não comeu direito, sem passos e sem cardio
  ('rogerio@desafiodos3.app', 'checks', 'Rogério', '{"2026-10-19":{"cardio":false,"comida":false,"doce":false,"passos":false}}'),
  -- injeções (a 1ª dose de 16/10)
  ('paulo@desafiodos3.app', 'injections', 'Paulo', '[{"date":"2026-10-16","ml":2.5,"note":"1ª dose","site":"Abdômen"}]'),
  ('arthur@desafiodos3.app', 'injections', 'Arthur', '[{"date":"2026-10-16","ml":2.5,"note":"1ª dose"}]'),
  ('rafaela@desafiodos3.app', 'injections', 'Rafaela', '[{"date":"2026-10-16","ml":2.5,"site":"Abdômen","note":"1ª dose"}]'),
  -- sono
  ('paulo@desafiodos3.app', 'sleep', 'Paulo', '[{"bed":"01:20","date":"2026-10-19","hours":8.17,"id":"mvf96juv","wake":"09:30"}]'),
  ('rafaela@desafiodos3.app', 'sleep', 'Rafaela', '[{"bed":"00:30","date":"2026-10-19","hours":8.5,"id":"mvfii4qb","wake":"09:00"}]'),
  -- meta de água que cada um usava (o banco novo começaria em 3 L e tiraria o dia perfeito)
  ('paulo@desafiodos3.app', 'profile', 'Paulo', '{"waterGoalMl":2500}'),
  ('arthur@desafiodos3.app', 'profile', 'Arthur', '{"waterGoalMl":2000}'),
  ('rafaela@desafiodos3.app', 'profile', 'Rafaela', '{"waterGoalMl":2000}'),
  -- resumo dos dias (o que os outros veem no Placar até a pessoa abrir o app novo)
  ('paulo@desafiodos3.app', 'days', 'Paulo', '{"2026-10-16":{"date":"2026-10-16","inj":true,"treino":false,"waterGoalMl":2500,"waterMl":0},"2026-10-17":{"cardio":false,"date":"2026-10-17","inj":false,"passos":false,"treino":false,"waterGoalMl":2500,"waterMl":200},"2026-10-19":{"cardio":true,"comida":true,"date":"2026-10-19","doce":true,"inj":false,"passos":true,"treino":true,"waterGoalMl":2500,"waterMl":3000}}'),
  ('arthur@desafiodos3.app', 'days', 'Arthur', '{"2026-10-16":{"date":"2026-10-16","inj":true,"treino":false,"waterGoalMl":2000,"waterMl":0},"2026-10-17":{"cardio":true,"date":"2026-10-17","inj":false,"passos":true,"treino":false,"waterGoalMl":2000,"waterMl":1400},"2026-10-19":{"cardio":true,"comida":true,"date":"2026-10-19","doce":true,"inj":false,"passos":true,"proteina":true,"treino":true,"waterGoalMl":2000,"waterMl":2000}}'),
  ('rafaela@desafiodos3.app', 'days', 'Rafaela', '{"2026-10-16":{"date":"2026-10-16","inj":true,"mealPhotos":0,"treino":false,"waterGoalMl":2000,"waterMl":0},"2026-10-17":{"cardio":true,"date":"2026-10-17","inj":false,"mealPhotos":0,"treino":true,"waterGoalMl":2000,"waterMl":1000},"2026-10-18":{"date":"2026-10-18","doce":false,"inj":false,"mealPhotos":0,"treino":false,"waterGoalMl":2000,"waterMl":1500},"2026-10-19":{"cardio":true,"comida":true,"date":"2026-10-19","doce":true,"inj":false,"mealPhotos":0,"passos":true,"proteina":false,"treino":true,"waterGoalMl":2000,"waterMl":2000}}'),
  ('rogerio@desafiodos3.app', 'days', 'Rogério', '{"2026-10-19":{"date":"2026-10-19","treino":false,"cardio":false,"comida":false,"doce":false,"passos":false,"waterGoalMl":3000,"waterMl":0}}');

insert into public.desafio_dados (user_id, tipo, jogador, valor)
select u.id, a.tipo, a.jogador, a.valor
from antigo a join auth.users u on u.email = a.email
on conflict (user_id, tipo) do update
  set valor = pg_temp.mesclar(desafio_dados.valor, excluded.valor),
      jogador = coalesce(desafio_dados.jogador, excluded.jogador),
      atualizado_em = now();

-- água (só os dias que ainda não têm registro no banco novo)
insert into public.water_consumption (user_id, date, amount_ml)
select u.id, w.date::date, w.ml
from (values
  ('arthur@desafiodos3.app', '2026-10-17', 500), ('arthur@desafiodos3.app', '2026-10-17', 500),
  ('arthur@desafiodos3.app', '2026-10-17', 200), ('arthur@desafiodos3.app', '2026-10-17', 200),
  ('arthur@desafiodos3.app', '2026-10-19', 500), ('arthur@desafiodos3.app', '2026-10-19', 500),
  ('arthur@desafiodos3.app', '2026-10-19', 500), ('arthur@desafiodos3.app', '2026-10-19', 500),
  ('rafaela@desafiodos3.app', '2026-10-17', 500), ('rafaela@desafiodos3.app', '2026-10-17', 500),
  ('rafaela@desafiodos3.app', '2026-10-18', 300), ('rafaela@desafiodos3.app', '2026-10-18', 300),
  ('rafaela@desafiodos3.app', '2026-10-18', 300), ('rafaela@desafiodos3.app', '2026-10-18', 300),
  ('rafaela@desafiodos3.app', '2026-10-18', 300),
  ('rafaela@desafiodos3.app', '2026-10-19', 500), ('rafaela@desafiodos3.app', '2026-10-19', 300),
  ('rafaela@desafiodos3.app', '2026-10-19', 500), ('rafaela@desafiodos3.app', '2026-10-19', 500),
  ('rafaela@desafiodos3.app', '2026-10-19', 200),
  ('paulo@desafiodos3.app', '2026-10-17', 200),
  ('paulo@desafiodos3.app', '2026-10-19', 500), ('paulo@desafiodos3.app', '2026-10-19', 1000),
  ('paulo@desafiodos3.app', '2026-10-19', 1000), ('paulo@desafiodos3.app', '2026-10-19', 500)
) as w(email, date, ml)
join auth.users u on u.email = w.email
where not exists (select 1 from public.water_consumption x where x.user_id = u.id and x.date = w.date::date);

-- treinos
insert into public.workout_sessions (user_id, date, modality, notes, finished_at)
select u.id, t.date::date, 'academia', t.notes, (t.date || 'T20:00:00Z')::timestamptz
from (values
  ('arthur@desafiodos3.app', '2026-10-19', null),
  ('rafaela@desafiodos3.app', '2026-10-17', null),
  ('rafaela@desafiodos3.app', '2026-10-19', null),
  ('paulo@desafiodos3.app', '2026-10-19', 'Treinei perna')
) as t(email, date, notes)
join auth.users u on u.email = t.email
where not exists (select 1 from public.workout_sessions x where x.user_id = u.id and x.date = t.date::date);

-- desafio "Semana sem doce" (18 a 24/10, entre Paulo, Arthur e Rafaela)
insert into public.desafio_desafios (id, dados, criado_por)
select 'mvcpbd8xdh8e',
  '{"accepted":["Paulo","Arthur","Rafaela"],"createdAt":"2026-10-17T17:59:37.425Z","createdBy":"Paulo","days":7,"id":"mvcpbd8xdh8e","metric":"doce","start":"2026-10-18"}'::jsonb,
  u.id
from auth.users u where u.email = 'paulo@desafiodos3.app'
on conflict (id) do nothing;

-- mostra quem foi importado (quem faltar: entra no app e roda este arquivo de novo)
select a.email, case when u.id is null then 'falta entrar no app' else 'importado' end as situacao
from (select distinct email from antigo) a left join auth.users u on u.email = a.email
order by 1;
