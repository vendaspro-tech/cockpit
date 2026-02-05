# RLS Policies - Competency & PDI System

**Migração:** `20250108000001_rls_competency_and_pdi_system.sql`
**Data:** 2025-01-08
**Status:** ✅ Pronta para aplicação

---

## 📋 O Que Esta Migração Faz

Esta migração implementa **Row Level Security (RLS)** completo para o sistema de competências, avaliações de senioridade, DEF e PDI, baseado na **hierarquia de cargos**.

### Tabelas Protegidas

1. ✅ `competency_frameworks`
2. ✅ `seniority_assessments`
3. ✅ `def_call_evaluations`
4. ✅ `pdis`
5. ✅ `leadership_style_assessments`

---

## 🔐 Regras de Hierarquia (PRD Section 2.1)

A visibilidade de dados sensíveis é regida pela **Hierarquia de Cargos**:

| Nível | Tipo | Cargos | Visibilidade |
|-------|------|--------|--------------|
| **0** | Estratégico | Gerente Comercial | Vê **todos** abaixo (1, 2, 3) |
| **1** | Tático | Coordenador, Sales Ops, Enablement | Vê níveis **2 e 3** |
| **2** | Operacional | Supervisor Comercial | Vê nível **3** |
| **3** | Execução | SDR, Closer, Inside Sales, etc | Vê **apenas seus próprios dados** |

**Regra de Ouro:** `Usuario(N)` vê dados de `Usuario(>N)`

---

## 🛠️ Helper Functions Criadas

### 1. `get_user_hierarchy_level(user_id, workspace_id)`
Retorna o nível de hierarquia (0-3) de um usuário em um workspace.

```sql
-- Exemplo
SELECT get_user_hierarchy_level('user-uuid', 'workspace-uuid');
-- Retorna: 2 (Supervisor = Operacional)
```

### 2. `can_view_user_data(viewer_id, target_user_id, workspace_id)`
Verifica se o viewer pode ver dados do target_user baseado na hierarquia.

```sql
-- Exemplo: Gerente (Nível 0) pode ver SDR (Nível 3)?
SELECT can_view_user_data('gerente-uuid', 'sdr-uuid', 'workspace-uuid');
-- Retorna: TRUE

-- Exemplo: SDR (Nível 3) pode ver Coordenador (Nível 1)?
SELECT can_view_user_data('sdr-uuid', 'coordenador-uuid', 'workspace-uuid');
-- Retorna: FALSE
```

### 3. `is_leader(user_id, workspace_id)`
Retorna `TRUE` se o usuário é líder (níveis 0, 1 ou 2).

```sql
SELECT is_leader('user-uuid', 'workspace-uuid');
```

### 4. `is_system_owner(user_id)`
Retorna `TRUE` se o usuário é system owner (super admin).

```sql
SELECT is_system_owner('user-uuid');
```

---

## 📊 Policies Criadas por Tabela

### **competency_frameworks**

| Policy | Ação | Quem | Condição |
|--------|------|------|----------|
| System owners full access | ALL | System Owner | Sempre |
| Users can view frameworks | SELECT | Todos | No seu workspace ou templates globais |
| Leaders can manage frameworks | ALL | Líderes (0-2) | No seu workspace |

### **seniority_assessments**

| Policy | Ação | Quem | Condição |
|--------|------|------|----------|
| System owners full access | ALL | System Owner | Sempre |
| Users view own assessments | SELECT | Todos | Próprias avaliações (auto ou recebidas) |
| Leaders view subordinates | SELECT | Líderes | Baseado em hierarquia |
| Users create self | INSERT | Todos | `assessment_type='self'` |
| Leaders create for subordinates | INSERT | Líderes | `assessment_type='leader'` + hierarquia |
| Users update own draft | UPDATE | Todos | Status = 'draft' + próprias |
| Leaders calibrate | UPDATE | Líderes | Status = 'submitted' ou 'calibrated' |

### **def_call_evaluations**

| Policy | Ação | Quem | Condição |
|--------|------|------|----------|
| System owners full access | ALL | System Owner | Sempre |
| Users view own evaluations | SELECT | Todos | Próprias ou que avaliaram |
| Leaders view subordinates | SELECT | Líderes | Baseado em hierarquia |
| Users create own | INSERT | Todos | Platform tests, self-assessments |
| Leaders create for subordinates | INSERT | Líderes | Sparrings, real calls + hierarquia |
| AI can create | INSERT | Sistema/IA | `is_ai_evaluation=TRUE` |
| Evaluators update own | UPDATE | Avaliadores | Próprias avaliações |

### **pdis**

| Policy | Ação | Quem | Condição |
|--------|------|------|----------|
| System owners full access | ALL | System Owner | Sempre |
| Users view own | SELECT | Todos | Próprios ou como líder |
| Leaders view subordinates | SELECT | Líderes | Baseado em hierarquia |
| Users create own | INSERT | Todos | `user_id = auth.uid()` |
| Leaders create for subordinates | INSERT | Líderes | `leader_id = auth.uid()` + hierarquia |
| Users update own | UPDATE | Usuário | Status = 'draft' ou 'active' |
| Leaders update managed | UPDATE | Líder | É o líder ou superior na hierarquia |
| Users delete own draft | DELETE | Usuário | Status = 'draft' |
| Leaders delete subordinates draft | DELETE | Líderes | Status = 'draft' + hierarquia |

### **leadership_style_assessments**

| Policy | Ação | Quem | Condição |
|--------|------|------|----------|
| System owners full access | ALL | System Owner | Sempre |
| Users view own | SELECT | Todos | Próprias avaliações |
| Leaders view subordinates | SELECT | Líderes | Baseado em hierarquia |
| Leaders create own | INSERT | **Apenas Líderes** | `is_leader()` = TRUE |
| Users update own | UPDATE | Todos | Próprias avaliações |

**⚠️ IMPORTANTE:** Conforme PRD Seção 2.5, apenas cargos de liderança (0, 1, 2) podem criar Leadership Style Assessments.

---

## ⚠️ IMPORTANTE: Sobre o DROP CASCADE

Esta migração usa `DROP FUNCTION ... CASCADE` para remover funções existentes que podem ter nomes de parâmetros diferentes. Isso pode temporariamente remover algumas policies de outras tabelas (como `job_titles`) que dependem dessas funções.

**Não se preocupe:** A migração recria automaticamente:
1. ✅ Todas as funções helper
2. ✅ Todas as policies das novas tabelas
3. ✅ Policy crítica de `job_titles` para system owners

**O que pode acontecer:**
- Policies antigas que usavam `is_system_owner` serão removidas
- A policy "System owners can manage job titles" será recriada
- Outras policies que possam existir em `job_titles` (ex: admin-only) permanecerão intactas

## 🚀 Como Aplicar

### No Supabase Cloud (CLI)

```bash
# 1. Verificar se está conectado ao projeto correto
supabase status

# 2. Aplicar a migração
supabase db push

# 3. Verificar se foi aplicada
supabase db diff
```

### No Supabase Dashboard (Manual)

1. Acesse **SQL Editor** no dashboard
2. Copie o conteúdo de `20250108000001_rls_competency_and_pdi_system.sql`
3. Execute o script
4. Verifique se não há erros

---

## ✅ Como Testar

### Teste 1: Verificar Helper Functions

```sql
-- Deve retornar o nível de hierarquia do seu usuário
SELECT get_user_hierarchy_level(
  (SELECT id FROM users WHERE email = 'seu@email.com' LIMIT 1),
  (SELECT workspace_id FROM users WHERE email = 'seu@email.com' LIMIT 1)
);
```

### Teste 2: Testar Visibilidade Hierárquica

```sql
-- Criar usuários de teste com diferentes níveis
-- Então testar can_view_user_data()

-- Gerente (Nível 0) pode ver SDR (Nível 3)? → TRUE
-- SDR (Nível 3) pode ver Gerente (Nível 0)? → FALSE
-- Coordenador (Nível 1) pode ver Supervisor (Nível 2)? → TRUE
-- Supervisor (Nível 2) pode ver Coordenador (Nível 1)? → FALSE
```

### Teste 3: Testar Policies de Seniority Assessments

```sql
-- Como SDR (Nível 3), tentar criar avaliação para Gerente (Nível 0)
-- Deve FALHAR (sem permissão)

-- Como SDR, criar auto-avaliação
-- Deve FUNCIONAR

-- Como Gerente, criar avaliação para SDR
-- Deve FUNCIONAR
```

### Teste 4: Testar Policies de PDIs

```sql
-- Como usuário, criar PDI próprio
-- Deve FUNCIONAR

-- Como líder, criar PDI para subordinado
-- Deve FUNCIONAR

-- Como usuário de nível inferior, tentar ver PDI de superior
-- Deve FALHAR (SELECT retorna vazio)
```

---

## 🔍 Troubleshooting

### Erro: "function get_user_hierarchy_level does not exist"
**Solução:** A migração não foi aplicada. Execute `supabase db push`.

### Erro: "column hierarchy_level does not exist"
**Solução:** A migração `20250101000100_enrich_job_titles.sql` não foi aplicada. Aplique-a primeiro.

### Erro: "infinite recursion detected in policy"
**Solução:** Verifique se há loops nas helper functions. As funções estão marcadas como `SECURITY DEFINER` para evitar isso.

### Usuários não conseguem ver dados esperados
**Solução:**
1. Verifique se `job_title_id` está preenchido no usuário
2. Verifique se `hierarchy_level` está correto no job_title
3. Execute `SELECT get_user_hierarchy_level(...)` para debugar

---

## 📝 Próximos Passos

Após aplicar esta migração:

1. ✅ **Testar policies** com múltiplos usuários de diferentes níveis
2. 🚀 **Iniciar Fase 3:** Implementar componentes de Avaliações de Senioridade
3. 🚀 **Iniciar Fase 4:** Implementar DEF Multicanal (Sparrings + Real Calls)
4. 🚀 **Iniciar Fase 5:** Implementar PDI Holístico

---

## 📚 Referências

- **PRD:** `docs/prd/2025-01-01-refatoracao-cargos-e-competencias.md`
- **Seção 2.1:** Hierarquia e Visibilidade (CRÍTICO)
- **Seção 2.2:** Regra de Senioridade Inicial
- **Seção 2.5:** Mapeamento de Avaliações de Estilo de Liderança

---

**Status:** ✅ Pronto para aplicação
**Autor:** Claude Code
**Data:** 2025-01-08
