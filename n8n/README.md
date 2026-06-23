# Sistema multiagente VIZZU

Este diretório contém três workflows importáveis no n8n:

1. `vizzu-agente-principal.json`: recebe texto, áudio e imagem da Evolution API, mantém a sessão no Supabase, roteia recepção/vendas, gera checkout e chama atendimento humano.
2. `vizzu-pagamento-aprovado.json`: valida o pagamento diretamente no Mercado Pago, impede processamento duplicado, cria o projeto e inicia o onboarding.
3. `vizzu-lembrete-briefing.json`: verifica briefings pendentes a cada hora e envia lembrete após 24 horas.

## Instalação

1. Execute `../agente_sessoes_setup.sql` no Supabase de Briefings.
2. Cadastre no ambiente do n8n as variáveis de `.env.example`. Nunca importe o arquivo `.env.example` como credencial nem coloque tokens diretamente nos workflows.
3. No n8n, use **Import from File** para importar os três arquivos da pasta `workflows`.
4. Abra cada node HTTP e confirme que as expressões `$env.*` estão disponíveis na sua instalação. Em ambientes que bloqueiam variáveis nos nodes, substitua-as por credenciais do n8n.
5. Confirme o endpoint de mídia da sua versão da Evolution API. Os templates usam `POST /chat/getBase64FromMediaMessage/{instance}` e envio por `POST /message/sendText/{instance}`.
6. Ative primeiro o workflow principal e copie a URL de produção do webhook `vizzu-agente` para a configuração de eventos da Evolution API.
7. Cadastre no Mercado Pago a URL de produção do webhook `vizzu-pagamento`.
8. Ative o workflow de pagamento e, por último, o lembrete.

## Segurança

- Use inicialmente credenciais sandbox do Mercado Pago.
- O webhook do Mercado Pago não confia no conteúdo recebido: ele consulta `/v1/payments/{id}` usando o token antes de processar.
- `agente_pagamentos.mercadopago_payment_id` é único; isso impede projetos duplicados quando o Mercado Pago reenvia uma notificação.
- A migration segue o acesso anônimo já usado pelo sistema atual. Para produção, prefira uma chave de serviço armazenada apenas no n8n e restrinja as políticas RLS públicas.
- Configure uma chave secreta ou assinatura no webhook da Evolution API antes da ativação pública.

## Teste recomendado

1. Importe os workflows com todos ainda inativos.
2. Configure uma instância de teste da Evolution API.
3. Envie uma mensagem de texto e confira a linha criada em `agente_sessoes`.
4. Teste áudio curto e uma imagem de produto.
5. Percorra a qualificação até `estagio = vendas`.
6. Gere uma preferência de pagamento usando Mercado Pago sandbox.
7. Aprove o pagamento de teste e confirme que apenas um projeto foi criado.
8. Para testar o lembrete, ajuste temporariamente a data da sessão para mais de 24 horas atrás.

## Prompts

Os arquivos em `prompts/` são as fontes legíveis para revisão do tom dos agentes. Os workflows carregam versões compactas desses prompts dentro dos nodes de código para permanecerem autocontidos durante a importação.

