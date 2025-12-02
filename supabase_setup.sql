-- 1. Criação da tabela (caso não exista)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT,
    status TEXT DEFAULT 'Pendente',
    briefing_data JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 1.1 GARANTIR que a coluna completed_at exista
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 1.2 Adicionar coluna para dados administrativos (Plano, Pagamento, Códigos)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS admin_data JSONB DEFAULT '{}'::jsonb;

-- 2. Habilitar Row Level Security (Segurança)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar erro de duplicidade
DROP POLICY IF EXISTS "Permitir Leitura Publica" ON projects;
DROP POLICY IF EXISTS "Permitir Edicao Publica" ON projects;

-- 4. Política para PERMITIR que qualquer pessoa LEIA os projetos
CREATE POLICY "Permitir Leitura Publica"
ON projects FOR SELECT
USING (true);

-- 5. Política para PERMITIR que qualquer pessoa ATUALIZE os projetos
CREATE POLICY "Permitir Edicao Publica"
ON projects FOR UPDATE
USING (true);

-- 6. Criação do Bucket de Armazenamento (Fotos)
INSERT INTO storage.buckets (id, name, public) VALUES ('briefing-files', 'briefing-files', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Remover políticas de storage antigas
DROP POLICY IF EXISTS "Permitir Upload Publico" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Leitura Publica Arquivos" ON storage.objects;

-- 8. Política de Storage para permitir Uploads públicos
CREATE POLICY "Permitir Upload Publico"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'briefing-files' );

CREATE POLICY "Permitir Leitura Publica Arquivos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'briefing-files' );
