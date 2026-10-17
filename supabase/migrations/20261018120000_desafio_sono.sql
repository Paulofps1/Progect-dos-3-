-- Registro de sono (página Noite) também vai para desafio_dados. Fica privado:
-- a política "ver placar dos 3" só mostra 'days' e 'weights' aos outros.
alter table public.desafio_dados drop constraint if exists desafio_dados_tipo_check;
alter table public.desafio_dados add constraint desafio_dados_tipo_check
  check (tipo in ('checks', 'weights', 'injections', 'next_injection', 'days', 'sleep'));
