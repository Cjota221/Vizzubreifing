-- 1. Cria a tabela 'projects' se ela não existir
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text,
  status text default 'Pendente',
  briefing_data jsonb default '{}'::jsonb,
  admin_data jsonb default '{}'::jsonb
);

-- 2. Garante que as colunas existam (caso a tabela já exista mas falte alguma coluna)
alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists status text default 'Pendente';
alter table public.projects add column if not exists briefing_data jsonb default '{}'::jsonb;
alter table public.projects add column if not exists admin_data jsonb default '{}'::jsonb;

-- 3. Habilita segurança (RLS)
alter table public.projects enable row level security;

-- 4. Cria uma política para permitir acesso total (Leitura e Escrita)
-- ATENÇÃO: Isso permite que qualquer pessoa com a chave pública (anon key) edite os dados.
-- Se precisar de mais segurança, configure autenticação no Supabase.
create policy "Acesso total público" 
on public.projects 
for all 
using (true) 
with check (true);
