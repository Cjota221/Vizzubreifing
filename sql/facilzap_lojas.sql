-- ================================================================
-- Tabela: facilzap_lojas
-- Projeto: https://khoyztycmrryrkbsvhja.supabase.co
-- Cole este SQL no SQL Editor do Supabase e execute.
-- ================================================================

create table if not exists facilzap_lojas (
  id              bigserial primary key,
  slug            text unique,
  nome            text,
  whatsapp        text,
  instagram       text,
  facebook        text,
  url_loja        text,

  -- campos disponíveis no CSV básico (acima) ↑
  -- campos do CSV completo (quando disponível) ↓

  nivel_nome               text,
  estado                   text,
  email                    text,
  website                  text,
  endereco                 text,
  cep                      text,
  total_pedidos            numeric,
  total_visualizacoes      numeric,
  total_seguidores         numeric,
  total_avaliacoes         numeric,
  nota_media               numeric,
  pedido_minimo            text,
  loja_verificada          text,
  selo_cupons              text,
  selo_cashback            text,
  cashback_porcentagem     text,
  selo_frete_gratis        text,
  frete_gratis_valor_minimo text,
  selo_brindes             text,
  selo_desconto_progressivo text,
  selo_revendedor_pro      text,
  selo_afiliados           text,
  comissao_afiliado        text,
  total_curtidas           numeric,
  total_perguntas          numeric,
  descricao                text,
  data_entrada_facilzap    text,
  created_at               timestamp default now()
);

-- Índices para performance nos filtros
create index if not exists idx_facilzap_nome          on facilzap_lojas (nome);
create index if not exists idx_facilzap_estado        on facilzap_lojas (estado);
create index if not exists idx_facilzap_nivel         on facilzap_lojas (nivel_nome);
create index if not exists idx_facilzap_verificada    on facilzap_lojas (loja_verificada);
create index if not exists idx_facilzap_views         on facilzap_lojas (total_visualizacoes desc nulls last);
create index if not exists idx_facilzap_pedidos       on facilzap_lojas (total_pedidos desc nulls last);
