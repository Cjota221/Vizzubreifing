-- 1. Criação da tabela (caso não exista)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT,
    status TEXT DEFAULT 'Pendente',
    briefing_data JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Habilitar Row Level Security (Segurança)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Política para PERMITIR que qualquer pessoa LEIA os projetos (necessário para carregar o formulário)
CREATE POLICY "Permitir Leitura Publica"
ON projects FOR SELECT
USING (true);

-- 4. Política para PERMITIR que qualquer pessoa ATUALIZE os projetos (necessário para salvar o briefing)
-- ATENÇÃO: Isso permite que quem tiver o ID do projeto edite ele.
CREATE POLICY "Permitir Edicao Publica"
ON projects FOR UPDATE
USING (true);

-- 5. Criação do Bucket de Armazenamento para os Uploads (Fotos)
-- Você precisa ir no menu "Storage" do Supabase e criar um bucket público chamado 'briefing-files'
-- Ou rodar este comando se tiver permissão de admin total:
INSERT INTO storage.buckets (id, name, public) VALUES ('briefing-files', 'briefing-files', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Política de Storage para permitir Uploads públicos
CREATE POLICY "Permitir Upload Publico"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'briefing-files' );

CREATE POLICY "Permitir Leitura Publica Arquivos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'briefing-files' );
