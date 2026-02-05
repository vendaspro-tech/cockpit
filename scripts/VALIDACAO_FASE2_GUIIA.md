# Guia de Validação Fase 2 - Supabase Cloud

## 📋 Objetivo

Validar todos os dados da Fase 2 no banco de dados Supabase Cloud para garantir que:
- Migrações foram aplicadas corretamente
- Seeds foram executados com sucesso
- Dados estão consistentes
- RLS policies estão ativas

---

## 🚀 Como Executar a Validação

### Opção 1: Supabase Dashboard (Recomendado)

1. **Acessar o Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Executar Script**
   - Copie o conteúdo de `scripts/validate_fase2.sql`
   - Cole no SQL Editor
   - Clique em "Run" ou pressione `Ctrl+Enter`

4. **Analisar Resultados**
   - Cada query retorna um resultado separado
   - Compare com os resultados esperados nos comentários

### Opção 2: psql via Command Line

```bash
# 1. Obter connection string do Supabase
# No Dashboard: Settings > Database > Connection String > URI
# Exemplo: postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# 2. Exportar variável de ambiente
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# 3. Executar script
psql $SUPABASE_DB_URL -f scripts/validate_fase2.sql
```

### Opção 3: Script Node.js

```bash
node scripts/validate-fase2.js
```

---

## ✅ Resultados Esperados

### 1. Job Titles por Nível Hierárquico

```
hierarchy_level | level_name              | total | job_titles
----------------+-------------------------+-------+------------------
0               | Estratégico (C-Level)   | 0-1   | [Diretor Comercial]
1               | Tático (Coordenação)    | 1-3   | [Gerente, Líder]
2               | Operacional (Supervisão)| 3-6   | [Supervisor]
3               | Execução (Vendas)       | 6-10  | [SDR, SDR Pleno, Closer, Closer Senior, ...]
```

**Validar:**
- ✅ Pelo menos 1 cargo em cada nível (0, 1, 2, 3)
- ✅ Total de 10+ cargos
- ✅ Níveis ordenados corretamente

---

### 2. Detalhes de um Job Title (SDR)

```
name    | slug | hierarchy_level | mission                                           | sector       | allows_seniority
--------+------+-----------------+---------------------------------------------------+--------------+------------------
SDR     | sdr  | 3               | Qualificar leads e agendar reuniões para closers | Comercial   | true
```

**Validar:**
- ✅ `slug` gerado automaticamente (lowercase, hífens)
- ✅ `mission` preenchida
- ✅ `hierarchy_level` correto (3 = Execução)
- ✅ `allows_seniority` true (permite avaliação de senioridade)

---

### 3. Competency Frameworks

```
name                    | type             | version | is_active | job_title
------------------------+------------------+---------+-----------+------------------
SDR Competency Matrix   | Global Template  | 1       | true      | SDR
Closer Competency Matrix| Global Template  | 1       | true      | Closer
```

**Validar:**
- ✅ 2+ frameworks templates (is_template = true)
- ✅ Pesos somam 100 (behavioral + technical_def + process)
- ✅ Cada framework vinculado a um job_title
- ✅ Apenas 1 versão ativa por job_title
- ⚠️ **NOTA:** Pesos são armazenados como decimais (0.50 = 50%) no banco

---

### 4. Competências de um Framework

```
beh_count | tech_count | proc_count | first_beh_competency
----------+------------+------------+--------------------------
4-6       | 3-5        | 2-4        | Comunicação Assertiva
```

**Validar:**
- ✅ `behavioral_competencies`: array NÃO vazio (mínimo 1)
- ✅ `technical_def_competencies`: array pode ser vazio
- ✅ `process_competencies`: array pode ser vazio
- ✅ Cada competência tem: id, name, description, levels (1, 2, 3)

---

### 5. Test Structures

```
test_type           | version | is_active | categories_count
--------------------+---------+-----------+-----------------
disc                | 3       | true      | 24
disc                | 2       | false     | 24
disc                | 1       | false     | 24
seniority_seller    | 1       | true      | 3
seniority_leader    | 1       | true      | 3
def_method          | 1       | true      | 4
values_8d           | 1       | true      | 8
leadership_style    | 1       | true      | 1
```

**Validar:**
- ✅ `disc`: 3 versões, v3 ativa
- ✅ Demais test_types: 1 versão ativa
- ✅ Apenas 1 versão ativa por test_type
- ✅ `categories_count` > 0

---

### 6. Total de Registros

```
table_name               | count
-------------------------+------
job_titles               | 10+
competency_frameworks    | 2+
test_structures          | 6+
seniority_assessments    | 0
def_call_evaluations     | 0+
pdi_plans                | 0+
```

**Validar:**
- ✅ `job_titles`: 10+ (seed inicial executado)
- ✅ `competency_frameworks`: 2+ (SDR e Closer)
- ✅ `test_structures`: 6+ (pelo menos 1 por test_type)
- ✅ `seniority_assessments`: 0 (Fase 3 ainda não implementada)
- ✅ `def_call_evaluations`: pode ter 0+ (depende de testes)
- ✅ `pdi_plans`: pode ter 0+ (depende de testes)

---

### 7. Estrutura DISC v3

```
test_type | version | is_active | total_categories | total_questions | scale_min | scale_max
----------+---------+-----------+------------------+-----------------+-----------+----------
disc      | 3       | true      | 24               | 24              | 1         | 4
```

**Validar:**
- ✅ `total_categories`: 24 (questões situacionais)
- ✅ `total_questions`: 24 (cada categoria tem 1 matrix_rating com 4 statements)
- ✅ `scale_min`: 1, `scale_max`: 4 (escala DISC)
- ✅ `is_active`: true

---

### 8. Integridade das Relações

```
name      | slug  | users_count | frameworks_count
----------+-------+-------------+------------------
SDR       | sdr   | 0+          | 1
Closer    | closer| 0+          | 1
```

**Validar:**
- ✅ Job titles podem ter 0 ou mais usuários vinculados
- ✅ Job titles devem ter 0 ou 1 framework ativo
- ✅ Não há job titles "órfãos" (sem users e sem frameworks)

---

### 9. RLS Policies

```
tablename                | policyname                            | cmd
-------------------------+---------------------------------------+--------
job_titles               | System owners can do anything         | ALL
competency_frameworks    | System owners can manage frameworks   | ALL
test_structures          | System owners can manage test_structures | ALL
```

**Validar:**
- ✅ Policies existem para job_titles, competency_frameworks, test_structures
- ✅ Cmd = ALL (INSERT, SELECT, UPDATE, DELETE)
- ✅ Roles = authenticated (usuários logados)
- ✅ Policy verifica `is_system_owner(auth.uid())`

---

### 10. Migrações Aplicadas

```
version   | name
----------+----------------------------------------------
...0100   | enrich_job_titles
...0101   | competency_system
...0102   | pdi_and_def
...0105   | test_structures_versioning
```

**Validar:**
- ✅ Migração 100: enrich_job_titles (14 novos campos em job_titles)
- ✅ Migração 101: competency_system (tabelas de competências)
- ✅ Migração 102: pdi_and_def (tabelas de PDI e DEF)
- ✅ Migração 105: test_structures_versioning (versionamento)

---

### 11. Seeding - Job Titles

```
name           | slug    | hierarchy_level | sector  | allows_seniority | kpis_count
---------------+---------+-----------------+---------+------------------+-------------
SDR            | sdr     | 3               | Comercial | true           | 5+
Closer         | closer  | 3               | Comercial | true           | 5+
SDR Pleno      | sdr-pleno| 3              | Comercial | true           | 5+
Closer Senior  | closer-senior| 3          | Comercial | true           | 5+
```

**Validar:**
- ✅ 4+ job titles com dados completos
- ✅ `remuneration` preenchida (junior/pleno/senior com fixed ou range)
- ✅ `requirements` preenchida (education, mandatory_courses, key_competencies)
- ✅ `kpis` array não vazio
- ✅ `main_activities` array não vazio
- ✅ `common_challenges` array não vazio

---

### 12. Seeding - Competency Frameworks

```
name                   | is_template | job_title | beh_count | tech_count | version
-----------------------+-------------+-----------+-----------+------------+--------
SDR Competency Matrix  | true        | SDR       | 4-6       | 3-5        | 1
Closer Competency Matrix| true       | Closer    | 4-6       | 3-5        | 1
```

**Validar:**
- ✅ 2 frameworks templates criados
- ✅ `is_template = true` (global, não workspace-specific)
- ✅ `workspace_id = null` (global)
- ✅ Cada competency tem 3 levels descritos (1, 2, 3)
- ✅ `scoring_ranges` configurado (junior/pleno/senior)

---

## 🐛 Troubleshooting

### Erro: "relation 'job_titles' does not exist"

**Causa:** Migração 100 (enrich_job_titles) não foi aplicada

**Solução:**
```bash
# Verificar migrações aplicadas
supabase migration list

# Aplicar migração 100
supabase db push
```

---

### Erro: "column 'remuneration' does not exist"

**Causa:** Migração 100 não aplicou corretamente os novos campos

**Solução:**
```bash
# Verificar schema da tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_titles';

# Reaplicar migração 100
supabase db push --debug
```

---

### Erro: "permission denied for table job_titles"

**Causa:** RLS policy bloqueando acesso ou usuário não é system owner

**Solução:**
```sql
-- Verificar se você é system owner
SELECT * FROM profiles WHERE id = auth.uid();

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'job_titles';
```

---

### Erro: "no results found" em test_structures

**Causa:** Migração 105 (test_structures_versioning) não aplicada ou seed não executado

**Solução:**
```bash
# Verificar se tabela existe
SELECT COUNT(*) FROM test_structures;

# Se tabela vazia, executar seed
node scripts/seed-test-structures.js
```

---

## 📊 Checklist de Validação

Após executar o script de validação, marque os itens validados:

### Banco de Dados
- [ ] Migrações 100-102 aplicadas
- [ ] Migração 105 aplicada
- [ ] 10+ job_titles criados
- [ ] 2+ competency_frameworks templates
- [ ] 6+ test_structures (1 por test_type + versões)
- [ ] DISC v3 está ativa
- [ ] RLS policies aplicadas

### Dados Consistentes
- [ ] Todos hierarchy_levels (0-3) têm job_titles
- [ ] Todos job_titles têm slug único
- [ ] Todos frameworks têm pesos somando 100
- [ ] Todas test_structures têm categorias não vazias
- [ ] Apenas 1 versão ativa por test_type

### Relacionamentos
- [ ] job_titles ↔ users (FK funcionando)
- [ ] job_titles ↔ competency_frameworks (FK funcionando)
- [ ] test_structures ↔ seniority_assessments (FK funcionando)

---

## 🎯 Próximos Passos

### Se Tudo Validou ✅

1. **Executar testes manuais da UI**
   - Acessar `/admin/job-titles`
   - Acessar `/admin/competency-frameworks`
   - Acessar `/admin/test-structures`
   - Seguir plano em `docs/phase1/FASE2_VALIDACAO.md`

2. **Avançar para Fase 3**
   - Implementar avaliações de senioridade
   - Criar formulários de avaliação
   - Implementar cálculo de níveis

### Se Encontrou Erros ❌

1. **Reaplicar migrações**
   ```bash
   supabase db reset
   supabase db push
   ```

2. **Reexecutar seeds**
   ```bash
   node scripts/seed-job-titles.js
   node scripts/seed-competency-frameworks.js
   node scripts/migrate-test-structures.ts
   ```

3. **Revalidar**
   - Executar script novamente
   - Verificar se resultados mudaram

---

**Data:** 2026-01-04
**Status:** ✅ Script pronto para execução
**Próximo:** Executar validação e documentar resultados
