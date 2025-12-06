-- Criar tabela global_snippets para a Biblioteca TI
CREATE TABLE IF NOT EXISTS public.global_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'Outros',
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'HTML',
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_global_snippets_category ON public.global_snippets(category);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.global_snippets ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura pública (qualquer usuário autenticado ou anônimo)
CREATE POLICY "Permitir leitura pública de snippets globais"
ON public.global_snippets
FOR SELECT
TO public
USING (true);

-- Política: Permitir inserção pública (qualquer usuário pode adicionar códigos)
CREATE POLICY "Permitir inserção pública de snippets globais"
ON public.global_snippets
FOR INSERT
TO public
WITH CHECK (true);

-- Política: Permitir atualização pública (qualquer usuário pode editar)
CREATE POLICY "Permitir atualização pública de snippets globais"
ON public.global_snippets
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política: Permitir exclusão pública (qualquer usuário pode excluir)
CREATE POLICY "Permitir exclusão pública de snippets globais"
ON public.global_snippets
FOR DELETE
TO public
USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO public.global_snippets (category, title, description, type, code) VALUES
('Carrinho', 'Botão Add to Cart', 'Botão estilizado para adicionar produtos ao carrinho', 'HTML', '<button class="add-to-cart" data-product-id="{{id}}">
  <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
</button>

<style>
.add-to-cart {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.add-to-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}
</style>'),

('Página do Produto', 'Gallery de Imagens', 'Galeria de imagens responsiva para produtos', 'JavaScript', 'const productGallery = {
  init() {
    const thumbs = document.querySelectorAll(".thumb");
    const mainImg = document.getElementById("main-img");
    
    thumbs.forEach(thumb => {
      thumb.addEventListener("click", function() {
        mainImg.src = this.dataset.full;
        thumbs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
      });
    });
  }
};

// Chamar no DOMContentLoaded
productGallery.init();'),

('Checkout', 'Validação de CEP', 'Função para validar e buscar endereço via ViaCEP', 'JavaScript', 'async function buscarCEP(cep) {
  cep = cep.replace(/\D/g, "");
  
  if (cep.length !== 8) {
    alert("CEP inválido!");
    return;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      alert("CEP não encontrado!");
      return;
    }
    
    document.getElementById("rua").value = data.logradouro;
    document.getElementById("bairro").value = data.bairro;
    document.getElementById("cidade").value = data.localidade;
    document.getElementById("estado").value = data.uf;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    alert("Erro ao buscar CEP. Tente novamente.");
  }
}'),

('Integração', 'WhatsApp Button', 'Botão para abrir conversa no WhatsApp', 'HTML', '<a href="https://wa.me/5511999999999?text=Olá!%20Tenho%20interesse%20em%20seu%20produto" 
   class="whatsapp-btn" 
   target="_blank">
  <i class="fab fa-whatsapp"></i> Falar no WhatsApp
</a>

<style>
.whatsapp-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #25d366;
  color: white;
  padding: 15px 25px;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
  transition: all 0.3s;
  z-index: 1000;
}
.whatsapp-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6);
}
</style>');
