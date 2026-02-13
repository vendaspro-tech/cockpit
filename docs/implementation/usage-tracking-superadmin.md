# Usage Tracking Superadmin (v1)

## Objetivo
Entregar visibilidade de uso por workspace para superadmin sem rastrear clique por clique.
A métrica central de adoção usa eventos de valor do produto (acoes core).

## Escopo v1
- Modulos: `assessments`, `agents`, `pdi`
- Painel: `/admin/usage`
- Granularidade: agregado por workspace + top usuarios por workspace
- Atualizacao: quase em tempo real

## Taxonomia de eventos
Tabela: `usage_events`

Eventos permitidos:
- `assessment_started`
- `assessment_completed`
- `agent_conversation_started`
- `agent_message_sent`
- `pdi_created`
- `pdi_completed`

Campos principais:
- `occurred_at` timestamp do evento
- `workspace_id` workspace relacionado
- `actor_user_id` usuario que executou a acao
- `module` modulo de origem
- `entity_type` e `entity_id` para rastreabilidade da entidade
- `metadata` contexto adicional

## Instrumentacao (DB triggers)
- `assessments`
  - INSERT -> `assessment_started`
  - UPDATE `status` para `completed` -> `assessment_completed`
- `ai_conversations`
  - INSERT -> `agent_conversation_started`
- `ai_messages`
  - INSERT com `sender='user'` -> `agent_message_sent`
- `pdi_plans`
  - INSERT -> `pdi_created`
  - UPDATE `status` para `completed` -> `pdi_completed`

## Definicao de usuario ativo (core)
Usuario ativo no periodo = executou pelo menos uma acao entre:
- `assessment_started`
- `assessment_completed`
- `agent_conversation_started`
- `agent_message_sent`
- `pdi_created`
- `pdi_completed`

## RPCs de leitura
- `admin_usage_workspace_summary(date_from, date_to, workspace_id?, plan?)`
  - retorna funil e adocao por workspace
- `admin_usage_workspace_user_top(date_from, date_to, workspace_id, limit)`
  - retorna top usuarios por acoes core com breakdown por modulo

## Filtros do painel
- Periodo: 7d, 30d (default), 90d
- Plano
- Workspace
- Busca por nome de workspace

## Backfill inicial
A migration insere eventos historicos dos ultimos 90 dias para:
- `assessments`
- `ai_conversations`
- `ai_messages` (`sender='user'`)
- `pdi_plans`

Backfill e idempotente por `event_name + entity_id`.

## Seguranca
- `usage_events` com RLS habilitado
- SELECT permitido apenas para system owner
- INSERT nao permitido para clientes autenticados comuns
- Escrita de eventos via triggers/funcoes no banco e service role

## Limites da v1
- Nao inclui tracking de clique ou pageview
- Nao inclui alertas automatizados
- Nao inclui exportacao CSV
- Nao cobre modulos fora de Avaliacoes, Agentes e PDI
