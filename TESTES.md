# TESTES

Data: 2026-02-06  
Ambiente: `.env.local` (Supabase remoto)  
Execução: local (máquina do usuário) — saída fornecida no chat

## Bateria completa
- Comando: `npm run test:phase2`
- Resultado: **passou** (✅ 26, ❌ 0)
- Taxa de sucesso: 100.0%

## Detalhe por suíte

### 1) Job Titles CRUD
- Comando: `node scripts/test-phase2/job-titles.test.js`
- Resultado: **passou** (✅ 8, ❌ 0)
- Principais verificações:
  - Listar cargos — ✅ (11 encontrados)
  - Filtrar por hierarchy_level=3 — ✅ (5 encontrados)
  - Filtrar por setor=Comercial — ✅ (0 encontrados)
  - Busca textual "sales" — ✅ (3 encontrados)
  - Criar cargo de teste — ✅ (criado e removido ao final)
  - Editar cargo — ✅ (nível alterado)
  - Visualizar hierarquia — ✅ (agrupado por nível)
  - Deletar cargo — ✅

### 2) Competency Frameworks CRUD
- Comando: `node scripts/test-phase2/competency-frameworks.test.js`
- Resultado: **passou** (✅ 8, ❌ 0)
- Principais verificações:
  - Listar templates — ✅ (10 encontrados)
  - Criar template global — ✅
  - Validar soma de pesos = 100% — ✅
  - Editar framework (nova versão) — ✅
  - Duplicar framework — ✅
  - Validar ranges sem sobreposição — ✅
  - Estatísticas — ✅ (11 frameworks, 11 templates, 11 ativos)
  - Deletar framework — ✅
  - Cleanup — ✅ (dados de teste removidos)

### 3) Test Structures Editor
- Comando: `node scripts/test-phase2/test-structures.test.js`
- Resultado: **passou com warnings** (✅ 10, ⚠️ 2, ❌ 0)
- Principais verificações:
  - Listar estruturas — ✅ (8 estruturas, 6 tipos)
  - Filtrar por `disc` — ✅ (3 versões)
  - Buscar versão ativa `disc` — ✅ (v3, 1 categoria, 24 questões)
  - Criar teste `seniority_seller` — ✅ (v99)
  - Criar nova versão — ✅ (v100)
  - Validar categorias/questões — ✅
  - Validar matrix_rating (DISC) — ✅
  - Histórico de versões — ✅
  - Deletar teste — ✅
  - Validar metadados — ✅
- Warnings:
  - Soma de pesos do `seniority_seller` ativo = 0% (pesos não configurados)
  - Ranges de senioridade do `seniority_seller` ativo não definidos
  - Cleanup — ✅ (dados de teste removidos)
