# Correção: Visibilidade de Job Titles e Limpeza de Roles

**Data:** 2026-01-08
**Status:** ✅ Implementado - Aguardando aplicação de migration

---

## 📋 Problemas Identificados

### Problema 1: Seletor de Cargos Vazio

**Sintoma:**
- Modal de convite mostra "Nenhum cargo cadastrado"
- Select de cargos aparece vazio
- Mas os cargos existem no admin

**Causa Raiz:**
```sql
-- RLS Policy atual para job_titles
CREATE POLICY "System owners can manage job titles"
  ON job_titles
  FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_system_owner(auth.uid()))
```

❌ **Apenas system owners podem fazer SELECT**
❌ Admins e members de workspace são bloqueados pelo RLS

### Problema 2: Permissões Erradas no Seletor

**Sintoma:**
- Seletor de "Nível de Permissão" mostra: owner, admin, leader, closer, sdr

**Causa Raiz:**
Tabela `roles` mistura conceitos:
```sql
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('owner', 'Dono', '...', TRUE),          -- ✅ Permissão
('admin', 'Administrador', '...', TRUE), -- ✅ Permissão
('leader', 'Líder', '...', TRUE),        -- ❌ É cargo, não permissão!
('closer', 'Closer', '...', TRUE),       -- ❌ É cargo, não permissão!
('sdr', 'SDR', '...', TRUE)              -- ❌ É cargo, não permissão!
```

**Confusão:**
- **Permissões** (access_level): owner, admin, member
- **Cargos** (job_title): SDR, Closer, Gerente Comercial, etc.

---

## ✅ Solução Implementada

### Migration Criada

**Arquivo:** `supabase/migrations/20260108000003_fix_job_titles_and_roles_visibility.sql`

### Fix 1: Job Titles já são Visíveis

**Descoberta:** A migration `20250105000001_job_titles_global_fix.sql` já criou a policy de SELECT:
```sql
CREATE POLICY job_titles_select_all
  ON job_titles FOR SELECT
  USING (true);
```

**Problema Real:** A query no `settings/page.tsx` estava tentando filtrar por `workspace_id`, mas essa coluna foi REMOVIDA na migration global fix.

**Correção no Código:**
```typescript
// ANTES (ERRADO):
.is('workspace_id', null)

// DEPOIS (CORRETO):
// Sem filtro - todos job_titles são globais
```

**Resultado:**
- ✅ Policy de leitura já existe
- ✅ Query corrigida para não usar workspace_id
- ✅ Select de cargos será populado corretamente

### Fix 2: Limpar Roles Table

**Problema:** Roles continha job titles (closer, sdr, leader, bdr, cs, social_seller)

**Solução:**
```sql
-- 1. Migrar workspace_members que usam QUALQUER role que não seja permissão
UPDATE workspace_members
SET role = 'member'
WHERE role NOT IN ('owner', 'admin', 'member') AND role IS NOT NULL;

-- 2. Deletar TODOS os job titles da tabela roles
DELETE FROM roles
WHERE slug NOT IN ('owner', 'admin', 'member');

-- 3. Garantir que 'member' existe
INSERT INTO roles (slug, name, description, is_system_role) VALUES
('member', 'Membro', 'Membro colaborador do workspace', TRUE)
ON CONFLICT (slug) DO NOTHING;
```

**Resultado:**
- ✅ Tabela `roles` contém APENAS: owner, admin, member
- ✅ Todos os cargos (SDR, Closer, BDR, CS, Social Seller, etc.) permanecem em `job_titles`
- ✅ Separação clara de conceitos
- ✅ Seletor de permissões mostra apenas 3 opções

### Fix 3: Correção na Query de Settings

**Arquivo:** `app/(dashboard)/[workspaceId]/settings/page.tsx:71-74`

**Antes (ERRADO):**
```typescript
.is('workspace_id', null) // Esta coluna NÃO EXISTE!
```

**Depois (CORRETO):**
```typescript
// Sem filtro - a coluna workspace_id foi removida
const { data: jobTitlesData } = await supabase
  .from('job_titles')
  .select('id, name, hierarchy_level')
  .order('hierarchy_level')
```

**Motivo:** A coluna `workspace_id` foi removida na migration `20250105000001_job_titles_global_fix.sql`. Todos os job titles são globais por padrão.

---

## 🎯 Estrutura Correta Após Correção

### Workspace Members

Cada membro tem:

```typescript
{
  user_id: UUID,
  workspace_id: UUID,

  // PERMISSÃO (access_level ou role)
  access_level: 'owner' | 'admin' | 'member',
  // OU
  role: 'owner' | 'admin' | 'member',  // Referencia tabela roles

  // CARGO
  job_title_id: UUID,  // Referencia job_titles (SDR, Closer, Gerente...)

  // SENIORIDADE
  seniority_level: 'junior' | 'pleno' | 'senior' | null,

  // SQUAD (opcional)
  squad_id: UUID | null
}
```

### Tabelas e Responsabilidades

| Tabela | Gerenciada por | Propósito | Exemplos |
|--------|----------------|-----------|----------|
| `job_titles` | Admin (system_owner) | Cargos globais | SDR, Closer, Gerente Comercial |
| `roles` | Sistema | Níveis de permissão | owner, admin, member |
| `workspace_members` | Workspace owner/admin | Associação usuário↔workspace | Quem tem acesso + cargo + permissões |

---

## 🔄 Fluxo de Convite Após Correção

### 1. Abrir Modal de Convite

```
Admin clica "Convidar Colaborador"
```

### 2. Formulário

```
┌─────────────────────────────────────┐
│ Email *                             │
│ [colaborador@email.com]             │
│                                     │
│ Nome (opcional)                     │
│ [João Silva]                        │
│                                     │
│ Cargo * ← SERÁ POPULADO AGORA!     │
│ [Closer ▼]                          │
│  SDR                                │
│  BDR                                │
│  Closer                             │
│  Inside Sales                       │
│  Supervisor Comercial               │
│  ...                                │
│                                     │
│ Nível de Permissão                  │
│ [Membro ▼] ← APENAS 3 OPÇÕES!      │
│  Proprietário                       │
│  Administrador                      │
│  Membro                             │
│                                     │
│ [Cancelar] [Enviar Convite]         │
└─────────────────────────────────────┘
```

### 3. Ao Aceitar Convite

```sql
INSERT INTO workspace_members (
  workspace_id,
  user_id,
  access_level,
  job_title_id,      -- ✅ Do convite: UUID do cargo (Closer, SDR...)
  seniority_level,   -- ✅ null (PRD: definido após primeira avaliação)
  squad_id           -- ✅ null ou UUID do squad (se especificado)
)
```

---

## ⚠️ AÇÃO NECESSÁRIA: Aplicar Migration e Verificar

### 1. Aplicar Migration

#### Via Supabase CLI (Recomendado):
```bash
supabase db push
```

#### Via Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `supabase/migrations/20260108000003_fix_job_titles_and_roles_visibility.sql`
5. Execute

### 2. Verificar Correção

```bash
chmod +x scripts/run-verify.sh
bash scripts/run-verify.sh
```

**Resultado Esperado:**
```
=== Verificação Pós-Migration ===

1. ROLES (deve ter apenas owner, admin, member):
✅ Correto! Apenas permissões:
   - admin: Administrador
   - member: Membro
   - owner: Proprietário

2. JOB TITLES (cargos globais):
✅ Encontrados X cargos:
   - SDR (nível 3)
   - Closer (nível 3)
   - ...

3. WORKSPACE MEMBERS COM ROLES INVÁLIDOS:
✅ Nenhum membro com role inválido

=== Verificação Completa ===
```

---

## ✅ Checklist de Validação

Após aplicar a migration, testar:

- [ ] Ir em Settings → Usuários
- [ ] Clicar "Convidar Colaborador"
- [ ] **Verificar que campo "Cargo" está populado** ✅
- [ ] **Verificar lista de cargos:** SDR, Closer, Gerente, etc. ✅
- [ ] **Verificar "Nível de Permissão":** apenas owner, admin, member ✅
- [ ] Selecionar cargo e permissão
- [ ] Enviar convite
- [ ] Aceitar convite em outra aba
- [ ] Verificar que usuário tem job_title_id correto
- [ ] Verificar que seniority_level está NULL
- [ ] Tentar criar avaliação de senioridade para o novo usuário

---

## 📊 Antes vs Depois

### Antes:

**Job Titles:**
- ❌ RLS bloqueava leitura para usuários normais
- ❌ Select aparecia vazio
- ❌ Impossível convidar usuários

**Roles:**
- ❌ Misturava permissões (owner, admin) com cargos (closer, sdr)
- ❌ Confusão no formulário
- ❌ Dados inconsistentes

### Depois:

**Job Titles:**
- ✅ Todos podem ler job_titles
- ✅ Select populado corretamente
- ✅ Apenas system owners podem criar/editar cargos (via admin)

**Roles:**
- ✅ Apenas permissões: owner, admin, member
- ✅ Cargos separados em job_titles
- ✅ Conceitos claros e separados

---

## 🎓 Conceitos Clarificados

### Permissões (Roles)
Controla **o que o usuário pode fazer no workspace**:
- `owner` → Tudo
- `admin` → Gerenciar usuários, configurações
- `member` → Acesso básico

### Cargos (Job Titles)
Define **a função profissional do usuário**:
- SDR, BDR, Closer, Inside Sales (Execução)
- Supervisor Comercial (Operacional)
- Coordenador, Sales Ops, Enablement (Tático)
- Gerente Comercial (Estratégico)

### Senioridade
Define **o nível de experiência no cargo**:
- Júnior, Pleno, Sênior
- Definido APÓS avaliação de competências
- Inicialmente NULL

---

**Status:** ✅ Pronto para aplicar migration e testar
