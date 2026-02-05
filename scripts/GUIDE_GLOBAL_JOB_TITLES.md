# Guia Completo: Job Titles Globais

**Objetivo:** Transformar job titles de "por workspace" para "globais"

**Motivação:** Cargos são gerenciados apenas na rota `/admin`, não por workspace.

---

## 📋 Visão Geral das Mudanças

### ✅ Código Ajustado (TypeScript)

**Arquivo:** `app/actions/admin/job-titles.ts`

| Função | Mudança |
|--------|---------|
| `listJobTitles()` | Removido `workspaceId` param, removido deduplicação por slug |
| `createJobTitle()` | Cria apenas 1 registro com `workspace_id = NULL` |
| `updateJobTitle()` | Sem mudanças (já usava ID direto) |
| `deleteJobTitle()` | Simplificado (deleta apenas por ID, não por slug) |
| `getJobTitleHierarchy()` | Removido `workspaceId` param, removido deduplicação |
| `getJobTitleStats()` | Removido `workspaceId` param (agora global) |

**Arquivo:** `app/(admin)/admin/job-titles/page.tsx`
- Atualizado metadata description para "gerenciamento global"

---

## 🚀 Passo a Passo de Execução

### PASSO 1: Backup (Opcional mas Recomendado)

No Supabase Dashboard, execute:

```sql
-- Visualizar situação atual
SELECT COUNT(*) as total_registros, COUNT(DISTINCT slug) as slugs_unicos
FROM job_titles;

-- Esperado: total_registros > slugs_unicos (indica duplicatas)
```

---

### PASSO 2: Limpeza de Duplicatas

**Arquivo:** `scripts/cleanup_job_titles.sql`

Execute no Supabase Dashboard SQL Editor, **UMA QUERY POR VEZ**, em ordem:

#### 2.1. Diagnóstico
```sql
-- Verificar situação
SELECT
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as slugs_unicos,
  array_agg(DISTINCT workspace_id) as workspaces
FROM job_titles;
```

#### 2.2. PREVIEW (O que será deletado)
```sql
-- Preview antes de deletar
SELECT
  jt.id,
  jt.slug,
  jt.name,
  jt.workspace_id,
  MIN(jt2.id) as manter_id
FROM job_titles jt
INNER JOIN job_titles jt2 ON jt.slug = jt2.slug AND jt.id > jt2.id
LIMIT 20;
```

#### 2.3. DELETE (Executar após verificar preview)
```sql
-- Manter apenas a primeira cópia de cada slug (MIN(id))
DELETE FROM job_titles
WHERE id IN (
  SELECT jt.id
  FROM job_titles jt
  INNER JOIN job_titles jt2 ON jt.slug = jt2.slug AND jt.id > jt2.id
);
```

#### 2.4. Verificar Resultado
```sql
-- Após limpeza
SELECT
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as slugs_unicos
FROM job_titles;

-- Esperado: total_registros = slugs_unicos (10-15 registros)
```

---

### PASSO 3: Ajuste de Schema (Constraints e Índices)

**Arquivo:** `scripts/adjust_global_job_titles.sql`

Execute no Supabase Dashboard SQL Editor:

#### 3.1. Definir workspace_id = NULL
```sql
UPDATE job_titles
SET workspace_id = NULL
WHERE workspace_id IS NOT NULL;
```

#### 3.2. Criar índice único em slug
```sql
DROP INDEX IF EXISTS job_titles_slug_idx;

CREATE UNIQUE INDEX job_titles_slug_unique_idx
ON job_titles(slug);
```

#### 3.3. Adicionar constraint unique em name
```sql
ALTER TABLE job_titles
DROP CONSTRAINT IF EXISTS job_titles_name_key;

ALTER TABLE job_titles
ADD CONSTRAINT job_titles_name_unique
UNIQUE (name);
```

#### 3.4. Verificar constraints
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'job_titles' AND constraint_type = 'UNIQUE';
```

---

### PASSO 4: Ajustar RLS Policies

```sql
-- Drop policies existentes
DROP POLICY IF EXISTS "Users can view job titles" ON job_titles;
DROP POLICY IF EXISTS "Users can insert job titles" ON job_titles;
DROP POLICY IF EXISTS "Users can update job titles" ON job_titles;
DROP POLICY IF EXISTS "System owners can do anything" ON job_titles;

-- Criar policy restritiva
CREATE POLICY "System owners can manage job titles"
ON job_titles
FOR ALL
TO authenticated
USING (is_system_owner(auth.uid()))
WITH CHECK (is_system_owner(auth.uid()));
```

**Resultado:** Apenas system owners podem gerenciar job titles.

---

### PASSO 5: Validação Final

Execute o script de validação ajustado:

```sql
-- Validar estrutura final
SELECT
  hierarchy_level,
  CASE hierarchy_level
    WHEN 0 THEN 'Estratégico (C-Level)'
    WHEN 1 THEN 'Tático (Coordenação)'
    WHEN 2 THEN 'Operacional (Supervisão)'
    WHEN 3 THEN 'Execução (Vendas)'
  END as level_name,
  COUNT(*) as total,
  array_agg(name ORDER BY name) as job_titles
FROM job_titles
GROUP BY hierarchy_level
ORDER BY hierarchy_level;

-- Esperado: 4 níveis, 10-15 cargos totais, sem duplicatas
```

---

### PASSO 6: Testar na Aplicação

1. **Acessar:** `/admin/job-titles`
2. **Validar:**
   - Lista exibe job titles sem duplicatas
   - Criar novo cargo funciona
   - Editar cargo funciona
   - Deletar cargo funciona
   - Filtros funcionam

3. **Testar criação:**
   - Clicar "Novo Cargo"
   - Preencher nome "Teste Global"
   - Salvar
   - Validar que criou apenas 1 registro

4. **Verificar no banco:**
   ```sql
   SELECT name, slug, workspace_id
   FROM job_titles
   WHERE slug = 'teste-global';
   -- Esperado: 1 registro, workspace_id = NULL
   ```

---

## ✅ Resultado Esperado

### Antes
```
Total registros: 80
Slugs únicos: 10
Duplicatas: 8x (8 workspaces)
```

### Depois
```
Total registros: 10-15
Slugs únicos: 10-15
Duplicatas: 0
workspace_id: NULL para todos
```

### Estrutura Hierárquica
```
Nível 0 (Estratégico): 1-2 cargos
Nível 1 (Tático): 2-3 cargos
Nível 2 (Operacional): 3-5 cargos
Nível 3 (Execução): 5-8 cargos
```

---

## 🐛 Troubleshooting

### Erro: "duplicate key value violates unique constraint"

**Causa:** Tentativa de criar cargo com slug ou name já existente

**Solução:**
```sql
-- Verificar slugs existentes
SELECT slug, name FROM job_titles ORDER BY slug;
```

### Erro: "null value in column violates not-null constraint"

**Causa:** Tentativa de criar slug vazio

**Solução:** Action já gera slug automaticamente com `slugify(name)`

### Erro: "permission denied for table job_titles"

**Causa:** Usuário não é system owner

**Solução:** Apenas system owners podem acessar `/admin/job-titles`

---

## 📊 Checklist de Validação

Após executar todos os passos:

- [ ] PASSO 1: Backup visualizado
- [ ] PASSO 2: Duplicatas removidas (total = slugs únicos)
- [ ] PASSO 3: workspace_id = NULL para todos
- [ ] PASSO 4: Constraints criadas (slug unique, name unique)
- [ ] PASSO 5: RLS policy ajustada (apenas system owners)
- [ ] PASSO 6: Validação SQL funcionou (4 níveis, sem duplicatas)
- [ ] PASSO 7: Teste UI funcionou (criar, editar, deletar)
- [ ] PASSO 8: Criou cargo global (workspace_id = NULL)

---

## 📝 Resumo das Mudanças no Código

### Actions (`app/actions/admin/job-titles.ts`)

```typescript
// ANTES
export async function createJobTitle(input: CreateJobTitleInput) {
  // Busca todos workspaces
  // Cria uma cópia para CADA workspace
  const rows = workspaces.map(ws => ({ ...data, workspace_id: ws.id }))
  await supabase.from('job_titles').insert(rows)
}

// DEPOIS
export async function createJobTitle(input: CreateJobTitleInput) {
  // Cria APENAS 1 registro global
  const jobPayload = { ...data, workspace_id: null }
  await supabase.from('job_titles').insert(jobPayload).single()
}
```

### Schema (`job_titles` table)

```sql
-- ANTES
-- workspace_id pode ser NULL ou UUID
-- slug pode ser duplicado (por workspace)

-- DEPOIS
-- workspace_id SEMPRE NULL (global)
-- slug UNIQUE globalmente
-- name UNIQUE globalmente
```

---

## 🎯 Próximos Passos

Após concluir este guia:

1. ✅ Job titles são globais
2. ✅ Apenas `/admin` pode gerenciar cargos
3. ✅ Workspace não pode criar/editar/deletar cargos
4. ✅ Schema otimizado com constraints únicas

**Avançar para:** Fase 3 - Avaliações de Senioridade

---

**Data:** 2026-01-04
**Status:** ✅ Guia completo pronto para execução
