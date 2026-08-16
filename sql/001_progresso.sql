-- ===========================================================
-- Harmonia Prime · progresso de prática
-- -----------------------------------------------------------
-- Uma linha por pessoa. O corpo é o mesmo objeto que o app já
-- guarda no navegador, então o banco não precisa entender o
-- formato do treinador para servir de espelho entre aparelhos.
-- Quando as micropráticas mudarem, aqui não muda nada.
-- ===========================================================

create table if not exists public.progresso (
  usuario_id    uuid primary key references auth.users (id) on delete cascade,
  dados         jsonb not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- histórico de prática não passa perto disso; o teto existe para
  -- que uma chave pública não vire porta de entupir a base
  constraint progresso_tamanho check (pg_column_size(dados) < 1000000)
);

alter table public.progresso enable row level security;

-- Cada pessoa enxerga e mexe só na própria linha. Sem policy de delete:
-- apagar o histórico é gravar um estado vazio, não sumir com a linha.
drop policy if exists "cada um le o seu" on public.progresso;
create policy "cada um le o seu"
  on public.progresso for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

drop policy if exists "cada um cria o seu" on public.progresso;
create policy "cada um cria o seu"
  on public.progresso for insert
  to authenticated
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "cada um atualiza o seu" on public.progresso;
create policy "cada um atualiza o seu"
  on public.progresso for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

-- A data vem do servidor. O cliente manda o campo, o gatilho ignora.
create or replace function public.progresso_carimbo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists progresso_carimbo on public.progresso;
create trigger progresso_carimbo
  before insert or update on public.progresso
  for each row execute function public.progresso_carimbo();
