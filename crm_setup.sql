-- Execute este arquivo no SQL Editor do Supabase Vendas.
-- projects fica em outro projeto Supabase, portanto projeto_id armazena o UUID
-- sem uma foreign key entre bancos (PostgreSQL não permite esse vínculo direto).

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  nome text not null,
  loja text,
  telefone text,
  email text,
  origem text not null default 'manual' check (origem in ('landing', 'whatsapp', 'orcamento', 'manual')),
  estagio text not null default 'Lead' check (estagio in ('Lead', 'Contatado', 'Proposta', 'Negociando', 'Convertido', 'Perdido')),
  valor_estimado numeric(12,2) not null default 0,
  notas text,
  projeto_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_estagio on public.crm_leads(estagio);
create index if not exists idx_crm_leads_origem on public.crm_leads(origem);
create index if not exists idx_crm_leads_telefone on public.crm_leads(telefone);
create unique index if not exists idx_crm_leads_lead_id on public.crm_leads(lead_id) where lead_id is not null;

alter table public.crm_leads enable row level security;
drop policy if exists "crm_leads_all" on public.crm_leads;
create policy "crm_leads_all" on public.crm_leads for all using (true) with check (true);

grant select, insert, update, delete on public.crm_leads to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.crm_leads;
exception
  when duplicate_object then null;
end $$;
