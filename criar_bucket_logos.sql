-- 1. Cria o bucket 'logos' e define como público
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Logos Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos Delete Access" ON storage.objects;

-- 3. Cria política para permitir LEITURA pública (qualquer um pode ver as imagens)
CREATE POLICY "Logos Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- 4. Cria política para permitir UPLOAD (inserção) para qualquer um (anon)
-- ATENÇÃO: Em produção, idealmente você restringiria isso a usuários autenticados.
CREATE POLICY "Logos Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' );

-- 5. Cria política para permitir ATUALIZAÇÃO (update)
CREATE POLICY "Logos Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' );

-- 6. Cria política para permitir DELETAR
CREATE POLICY "Logos Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'logos' );
