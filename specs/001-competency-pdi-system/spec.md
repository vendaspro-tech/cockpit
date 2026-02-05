# Feature Specification: Sistema de Competências, Avaliações e PDI (Fundações)

**Feature Branch**: `001-competency-pdi-system`  
**Created**: 2026-01-12  
**Status**: Draft  
**Input**: Consolidar as evoluções do PRD `docs/prd/2025-01-01-refatoracao-cargos-e-competencias.md` em um conjunto de entregas incrementais e testáveis.

**Constitution**: `.specify/memory/constitution.md` (non-negotiable constraints)

## Clarifications

### Session 2026-01-12

- Q: Os cargos (job titles) são globais ou por workspace? → A: Globais (catálogo único administrado por admin global; workspaces apenas referenciam `job_title_id`).
- Q: A visibilidade hierárquica depende de squad? → A: Não; a regra de hierarquia vale no workspace inteiro (squad não restringe acesso).
- Q: Competency Frameworks são globais ou por workspace? → A: Globais (catálogo/template por cargo; workspaces apenas usam/referenciam).
- Q: Qual fonte define a senioridade “atual” no perfil? → A: Somente o fluxo novo (seniority v2 após calibração); legado permanece apenas como histórico.

## Scope

### In scope (this feature)
- Gestão administrativa de Cargos (catálogo global; estrutura enriquecida + hierarquia) e Frameworks de Competências (templates globais) por cargo.
- Fluxo de Avaliação de Senioridade 360° (autoavaliação + líder + calibração), com compatibilidade com avaliações já existentes.
- Regras de visibilidade e acesso a dados sensíveis baseadas em hierarquia de cargos no nível do workspace (sem restrição por squad).

### Out of scope (separate features)
- DEF multicanal (sparrings e real calls com IA).
- PDI holístico (migração e novo wizard).
- Transferência de histórico entre workspaces.
- Migração de bucket de avatar.

Rationale: O PRD descreve um programa amplo; para reduzir risco e permitir validação rápida, este recorte entrega fundações que destravam as próximas fases.

## Assumptions & Dependencies

### Assumptions
- O produto possui autenticação e papéis distintos para “admin global” (catálogos globais) e “admin do workspace” (gestão do workspace).
- Já existe um mecanismo de avaliação “legado” no produto e o histórico atual deve permanecer acessível.
- A hierarquia de cargos (níveis 0–3) é a fonte de verdade para visibilidade de dados sensíveis.

### Dependencies
- Papéis/perfis de usuários e vínculo de usuário ↔ workspace já funcionam.
- Há um local único para regras de autorização/roles conforme a constituição.
- O produto consegue registrar auditoria mínima de mudanças administrativas relevantes.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Administrar cargos e hierarquia (Priority: P1)

Como um administrador global, quero cadastrar e manter cargos (com missão, KPIs, atividades e nível hierárquico), para que o sistema consiga controlar visibilidade de dados e habilitar avaliações e dashboards.

**Why this priority**: Hierarquia e cargos são a base de autorização, filtros e mapeamentos do resto do sistema.

**Independent Test**: Em um workspace vazio, um admin global consegue criar/editar cargos com nível 0–3, e um usuário comum consegue visualizar apenas o que for permitido para seu nível.

**Acceptance Scenarios**:

1. **Given** um admin global autenticado, **When** ele cria ou edita um cargo com nível hierárquico válido, **Then** o cargo fica disponível no catálogo global para referência por workspaces e aparece ordenado/identificável pelo nível.
2. **Given** um usuário com cargo de nível N, **When** ele tenta acessar dados sensíveis de um usuário de nível menor ou igual (mais sênior), **Then** o acesso é negado.
3. **Given** um usuário com cargo de nível N, **When** ele acessa dados de um usuário de nível maior (subordinado), **Then** o acesso é permitido apenas no escopo definido pela hierarquia.

---

### User Story 2 - Configurar framework de competências por cargo (Priority: P2)

Como um administrador global, quero definir e versionar um framework de competências (template global) por cargo (com dimensões e pesos), para que as avaliações de senioridade sejam coerentes e comparáveis.

**Why this priority**: Sem frameworks bem definidos, as avaliações de senioridade perdem consistência e governança.

**Independent Test**: Um admin global cria um framework para um cargo, ajusta pesos e competências, e o sistema valida regras de consistência antes de permitir publicação/uso.

**Acceptance Scenarios**:

1. **Given** um admin global autenticado, **When** ele cria ou atualiza um framework (template global) para um cargo, **Then** o framework fica associado ao cargo e é recuperável para uso em avaliações.
2. **Given** um framework com pesos inválidos (não totalizam 100%), **When** o admin tenta salvar/publicar, **Then** o sistema bloqueia e explica o erro.
3. **Given** um cargo sem framework publicado, **When** um usuário tenta iniciar avaliação de senioridade para esse cargo, **Then** o sistema informa indisponibilidade e orienta que um admin configure o framework.

---

### User Story 3 - Realizar avaliação de senioridade 360° e calibrar (Priority: P3)

Como colaborador, quero realizar uma autoavaliação de senioridade; como líder, quero avaliar o colaborador e calibrar o resultado final, para que a senioridade seja definida com transparência e rastreabilidade.

**Why this priority**: A senioridade alimenta dashboards, PDI e decisões de desenvolvimento, e o PRD define senioridade inicial indefinida até a primeira avaliação.

**Independent Test**: Para um cargo com framework publicado, um colaborador consegue completar a autoavaliação, o líder consegue completar a avaliação e a calibração, e o perfil do colaborador passa de “indefinido” para um nível definido.

**Acceptance Scenarios**:

1. **Given** um usuário com senioridade indefinida, **When** ele conclui a primeira autoavaliação e um líder conclui avaliação + calibração, **Then** a senioridade do usuário passa a ser exibida como definida.
2. **Given** um usuário com senioridade indefinida, **When** ele ainda não concluiu a primeira avaliação, **Then** o dashboard e o perfil exibem claramente o status “Aguardando Avaliação”.
3. **Given** que existem avaliações antigas (seller/leader) no sistema, **When** um usuário de cargo elegível inicia uma avaliação, **Then** o sistema mantém compatibilidade com os tipos existentes e não quebra o histórico.
4. **Given** que existem avaliações antigas no sistema, **When** um usuário visualiza seu perfil ou dashboard, **Then** a senioridade “atual” exibida é derivada apenas do fluxo novo (v2 após calibração) e o legado aparece apenas como histórico.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Usuário tenta criar avaliação de senioridade para um cargo que não tem avaliação definida (ainda em desenvolvimento).
- Usuário muda de cargo: como o sistema trata avaliações passadas e o status de senioridade atual.
- Liderança tenta ver dados de alguém fora do escopo hierárquico permitido.
- Admin configura pesos/competências inconsistentes no framework (ex.: soma incorreta, lacunas, dimensões vazias).
- Conflito de versões/alterações administrativas durante uma avaliação em andamento.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: O sistema MUST permitir que administradores globais gerenciem o catálogo global de cargos, incluindo nível hierárquico (0 a 3) e metadados descritivos do cargo.
- **FR-002**: O sistema MUST aplicar controle de acesso a dados sensíveis com base na regra: usuário de nível N pode acessar dados de usuários de nível maior (subordinados), e NÃO pode acessar dados de nível menor ou igual; esta regra se aplica no escopo do workspace (squad não restringe acesso).
- **FR-003**: O sistema MUST permitir que administradores globais criem, versionem e mantenham frameworks de competências (templates globais) por cargo com dimensões e pesos, validando consistência antes de disponibilizar para avaliações.
- **FR-004**: O sistema MUST permitir iniciar e concluir avaliações de senioridade 360° (auto + líder + calibração) para cargos com framework publicado.
- **FR-005**: O sistema MUST manter compatibilidade com avaliações de senioridade existentes e preservar histórico já registrado, sem usar o legado para calcular/exibir a senioridade “atual” (que deve vir apenas do fluxo novo v2 após calibração).
- **FR-006**: O sistema MUST iniciar novos usuários com senioridade indefinida, e apenas definir senioridade após conclusão da primeira calibração.
- **FR-007**: O sistema MUST apresentar de forma clara o estado “Aguardando Avaliação” quando a senioridade ainda estiver indefinida.
- **FR-008**: O sistema MUST registrar evidência mínima de auditoria de alterações administrativas relevantes (ex.: alterações em cargos, frameworks e calibrações), acessível a administradores.
- **FR-009**: O sistema MUST respeitar as restrições não-negociáveis da constituição (segredos nunca expostos ao cliente, autorização por padrão/least-privilege, auth centralizada, consistência visual via tokens, disciplina de migrations).

### Key Entities *(include if feature involves data)*

- **Cargo (Job Title)**: Representa a função do colaborador; possui nível hierárquico, descrição, responsabilidades e metadados para gestão.
- **Framework de Competências**: Estrutura por cargo que define dimensões, competências e pesos usados em avaliações.
- **Avaliação de Senioridade 360°**: Conjunto de registros (autoavaliação, avaliação do líder e calibração) que resultam em um nível final e observações.
- **Mapeamento Cargo ↔ Tipo de Avaliação**: Regras que determinam quais cargos podem realizar quais avaliações (inclui compatibilidade com tipos legados).
- **Regra de Visibilidade Hierárquica**: Critério de autorização que controla leitura/escrita de avaliações e dados sensíveis.

## Data Model Notes: Versioned Global Templates (Postgres Best Practices)

Esta seção descreve padrões recomendados para modelar **templates globais versionados** em Postgres, com foco em **frameworks de competências por cargo**. Objetivo: permitir edição em rascunho, **publicação imutável**, e seleção consistente de versões em avaliações já iniciadas.

### Core Pattern (Canonical Template + Immutable Versions)

Evite colocar o “conteúdo editável” diretamente na tabela canônica. Em vez disso, use:

- **Tabela canônica (template)**: representa o “produto” (ex.: framework do cargo X) e aponta para a versão ativa.
- **Tabela de versões**: cada versão publicada é um snapshot imutável; rascunhos são versões com estado `draft`.

Estrutura típica:

- `competency_framework_templates`
  - `id`
  - `job_title_id` (global)
  - `slug` ou `code` (identificador estável para UI/API)
  - `active_version_id` (FK → `competency_framework_versions.id`, nullable enquanto não publicado)
  - `created_at`, `updated_at`

- `competency_framework_versions`
  - `id`
  - `template_id` (FK)
  - `version` (INTEGER incrementável por template)
  - `status` (`draft` | `published` | `retired`)
  - `published_at`, `published_by`
  - `content_hash` (ex.: `sha256` do snapshot para detecção de duplicatas)
  - `created_at`

Conteúdo da versão (duas abordagens):

- **Relacional (recomendado quando você precisa de queries e analytics)**
  - `competency_framework_dimensions(version_id, dimension_key, weight, order_index, ...)`
  - `competency_framework_competencies(version_id, competency_key, dimension_key, weight, ...)`
  - Vantagem: filtros, joins e relatórios fáceis.

- **Documento único (JSONB) (recomendado quando você prioriza “snapshot imutável” e simplicidade de writes)**
  - `competency_framework_versions.snapshot JSONB NOT NULL`
  - Vantagem: publicar = inserir 1 linha; o snapshot é naturalmente imutável.
  - Desvantagem: validações e queries complexas podem ficar mais custosas.

### Recommended Constraints (Integrity + One Active Version)

1) Um template por cargo (se isso for a regra de negócio):

- `UNIQUE(job_title_id)` em `competency_framework_templates`.

2) Versionamento consistente:

- `UNIQUE(template_id, version)` em `competency_framework_versions`.
- `CHECK (version > 0)`.

3) Publicação única por versão:

- `CHECK ((status = 'published') = (published_at IS NOT NULL))` (ou mais explícito com campos `published_by`).

4) “Somente uma versão ativa publicada por template”:

- Evite boolean `is_active` em múltiplas versões; prefira **ponteiro canônico** `active_version_id` no template.
- Alternativa complementar/defensiva: índice único parcial garantindo no máximo 1 `published` por template com flag `is_current` (se existir):
  - `CREATE UNIQUE INDEX ... ON competency_framework_versions(template_id) WHERE status = 'published' AND is_current;`

5) Evitar “active_version_id” inválido:

- FK de `competency_framework_templates.active_version_id` → `competency_framework_versions(id)`.
- Trigger (opcional) para garantir que `active_version_id` pertence ao mesmo `template_id` e que a versão está `published`.

### Immutability of Published Versions (Hard Guarantees)

Para impedir mutações de versões publicadas (e também de seus filhos), use **garantias no banco**, não só na aplicação.

Opções (você pode combinar):

1) **Permissões/GRANT (preferível)**
- Conceda ao papel usado pelo app apenas `SELECT` nas tabelas de versões publicadas.
- Permita `INSERT` apenas para criar rascunhos e publicar (via RPC). Não conceda `UPDATE/DELETE`.

2) **Trigger de proteção (robusta em qualquer papel)**
- `BEFORE UPDATE OR DELETE` em `competency_framework_versions`:
  - se `OLD.status = 'published'` então `RAISE EXCEPTION`.
- Replique a proteção para tabelas-filhas (`dimensions`, `competencies`) verificando o status da versão pai.

3) **Modelo “append-only”**
- Nunca atualize linhas de versão (nem para “retirar de ativo”).
- Publicar muda apenas `competency_framework_templates.active_version_id` dentro de uma transação.

### Publishing Workflow (Transactional)

Padrão recomendado para publicar:

1) Validar consistência do rascunho (ex.: pesos somam 100; chaves únicas; não há dimensão vazia).
2) Inserir uma nova linha `competency_framework_versions` com `status='published'` (separada do draft) **ou** promover o draft para published (se você aceitar update — geralmente evita-se).
3) Atualizar `competency_framework_templates.active_version_id` para a nova versão.

Tudo na **mesma transação** para evitar “janela” sem versão ativa.

### Referential Stability for Assessments

Toda avaliação deve “congelar” qual template+versão foi usada no momento do start:

- `assessments.framework_template_id`
- `assessments.framework_version_id`

Assim, relatórios antigos continuam reproduzíveis mesmo após mudança de framework.

### Migration Strategy (Safe, Incremental, Supabase-Friendly)

Recomendação: migração **aditiva** e com cutover controlado.

1) **Additive schema**
- Criar novas tabelas `*_templates` e `*_versions` sem mexer no legado.
- Criar funções/RPC de publicação (`publish_competency_framework`) como `SECURITY DEFINER` para encapsular regras.

2) **Backfill**
- Migrar frameworks atuais para versões `published` (1.0) com `content_hash`.
- Setar `active_version_id` para o published correspondente.

3) **Dual-read / Dual-write (curto período)**
- Leitura preferencial do novo modelo; fallback no legado se não existir `active_version_id`.
- Se o sistema ainda cria/edita frameworks no legado, implementar dual-write temporário (idealmente evitar e congelar o legado).

4) **Cutover**
- Bloquear escrita no legado (revogar permissões ou triggers).
- Atualizar código para usar somente o novo modelo.

5) **Cleanup**
- Remover colunas/tabelas antigas em migração futura quando não houver mais dependências.

Observação: Em Postgres, alterações de constraint podem ser feitas em fases (criar índices/constraints `NOT VALID`, validar depois) para reduzir lock em tabelas grandes. Para o tamanho típico de um SaaS early-stage, pode não ser necessário, mas é um padrão útil quando dados crescerem.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Um administrador consegue cadastrar ou atualizar um cargo com hierarquia em menos de 3 minutos (sem necessidade de suporte técnico).
- **SC-002**: Em testes de permissões com usuários de níveis 0–3, 100% das tentativas de acesso fora da hierarquia são bloqueadas.
- **SC-003**: Pelo menos 90% dos usuários elegíveis conseguem completar a primeira avaliação 360° (auto + líder + calibração) sem intervenção manual.
- **SC-004**: Para usuários novos, 100% iniciam como “Aguardando Avaliação” e passam a ter senioridade definida apenas após a primeira calibração.
- **SC-005**: Nenhum dado sensível vaza para usuários sem permissão durante testes de regressão de acesso.
