# VIZZU Briefing System

Sistema de gerenciamento de briefings para a VIZZU Digital.

## Funcionalidades

- **Painel Administrativo**: Geração de links únicos para clientes.
- **Formulário do Cliente**: Briefing interativo e seguro.
- **Integração Supabase**: Banco de dados em tempo real.
- **Upload direto**: Referências enviadas pelo cliente ao Supabase Storage.
- **Automação n8n**: Notificação do briefing concluído via webhook.
- **CRM comercial**: Pipeline kanban, métricas, funil e conversão de leads em projetos.
- **Atendimento multiagente**: Templates n8n para recepção, vendas, pagamento e onboarding pelo WhatsApp.

## Configuração do CRM

Execute [`crm_setup.sql`](crm_setup.sql) no SQL Editor do Supabase Vendas antes de abrir a seção CRM no painel administrativo.

## Sistema multiagente

Execute [`agente_sessoes_setup.sql`](agente_sessoes_setup.sql) no Supabase de Briefings e siga o guia em [`n8n/README.md`](n8n/README.md) para importar e configurar os workflows.

## Como Fazer Deploy no Netlify

Este projeto já está configurado para o Netlify.

1. Acesse [Netlify](https://app.netlify.com/).
2. Clique em **"Add new site"** > **"Import from an existing project"**.
3. Conecte com o **GitHub**.
4. Selecione o repositório **VIZZUDIGITAL**.
5. Clique em **Deploy**.

[![Netlify Status](https://api.netlify.com/api/v1/badges/b5c7e9e8-8f1a-4b5a-9a1a-8b5a9a1a8b5a/deploy-status)](https://app.netlify.com/sites/vizzu-briefing/deploys)
