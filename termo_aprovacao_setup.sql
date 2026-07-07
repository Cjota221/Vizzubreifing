-- Execute no SQL Editor do Supabase de Briefings (khoyztycmrryrkbsvhja).
-- Tabela satelite de "projects", nos moldes de agente_sessoes_setup.sql.

create table if not exists public.termos_aprovacao (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'aceito')),
  cliente_nome text,
  projeto_nome text,
  aceito_em timestamptz,
  aceito_nome text,
  aceito_ip text,
  aceito_user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_termos_projeto on public.termos_aprovacao(projeto_id);

alter table public.termos_aprovacao enable row level security;

drop policy if exists "termos_all" on public.termos_aprovacao;
create policy "termos_all" on public.termos_aprovacao for all using (true) with check (true);

grant select, insert, update on public.termos_aprovacao to anon, authenticated;
