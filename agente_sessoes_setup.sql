-- Execute no SQL Editor do Supabase de Briefings.

create table if not exists public.agente_sessoes (
  id uuid primary key default gen_random_uuid(),
  telefone text not null unique,
  nome text,
  loja text,
  segmento text,
  usa_facilzap boolean,
  anos_loja text,
  dores text,
  estagio text not null default 'recepcao'
    check (estagio in ('recepcao', 'vendas', 'aguardando_pagamento', 'onboarding', 'concluido', 'humano')),
  plano_escolhido text,
  valor_plano numeric(12,2),
  link_pagamento text,
  link_briefing text,
  projeto_id uuid references public.projects(id) on delete set null,
  historico jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agente_pagamentos (
  id uuid primary key default gen_random_uuid(),
  mercadopago_payment_id text not null unique,
  sessao_id uuid not null references public.agente_sessoes(id) on delete cascade,
  status text not null,
  projeto_id uuid references public.projects(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agente_sessoes_telefone on public.agente_sessoes(telefone);
create index if not exists idx_agente_sessoes_estagio on public.agente_sessoes(estagio);
create index if not exists idx_agente_sessoes_onboarding on public.agente_sessoes(updated_at) where estagio = 'onboarding';

alter table public.agente_sessoes enable row level security;
alter table public.agente_pagamentos enable row level security;

drop policy if exists "sessoes_all" on public.agente_sessoes;
create policy "sessoes_all" on public.agente_sessoes for all using (true) with check (true);
drop policy if exists "pagamentos_all" on public.agente_pagamentos;
create policy "pagamentos_all" on public.agente_pagamentos for all using (true) with check (true);

grant select, insert, update on public.agente_sessoes to anon, authenticated;
grant select, insert, update on public.agente_pagamentos to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agente_sessoes_updated_at on public.agente_sessoes;
create trigger agente_sessoes_updated_at before update on public.agente_sessoes
for each row execute function public.set_updated_at();

drop trigger if exists agente_pagamentos_updated_at on public.agente_pagamentos;
create trigger agente_pagamentos_updated_at before update on public.agente_pagamentos
for each row execute function public.set_updated_at();

