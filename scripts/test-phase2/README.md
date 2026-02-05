# Fase 2 - Testes Automatizados

Suite completa de testes automatizados para validar a implementação da Fase 2 (Admin & Job Titles).

## 📋 Estrutura dos Testes

### 1. **Job Titles CRUD** (`job-titles.test.js`)
- ✅ Listar todos os cargos
- ✅ Filtrar por hierarchy_level
- ✅ Filtrar por setor
- ✅ Busca textual
- ✅ Criar novo cargo
- ✅ Editar cargo existente
- ✅ Visualizar hierarquia
- ✅ Deletar cargo

### 2. **Competency Frameworks CRUD** (`competency-frameworks.test.js`)
- ✅ Listar frameworks
- ✅ Criar template global
- ✅ Validar soma de pesos (100%)
- ✅ Editar framework (nova versão)
- ✅ Duplicar framework
- ✅ Validar ranges sem sobreposição
- ✅ Estatísticas de frameworks
- ✅ Deletar framework

### 3. **Test Structures Editor** (`test-structures.test.js`)
- ✅ Listar todas estruturas
- ✅ Filtrar por test_type
- ✅ Buscar versão ativa
- ✅ Criar novo teste
- ✅ Editar teste (nova versão)
- ✅ Validar categorias e questões
- ✅ Validar soma dos pesos = 100%
- ✅ Validar ranges sem sobreposição
- ✅ Validar matrix_rating (DISC)
- ✅ Histórico de versões
- ✅ Deletar teste
- ✅ Validar metadados obrigatórios

## 🚀 Como Executar

### Executar todos os testes
```bash
node scripts/test-phase2/run-all-tests.js
```

### Executar teste individual
```bash
# Job Titles
node scripts/test-phase2/job-titles.test.js

# Competency Frameworks
node scripts/test-phase2/competency-frameworks.test.js

# Test Structures
node scripts/test-phase2/test-structures.test.js
```

### Via npm scripts
```bash
npm run test:phase2
```

## 📊 Saída Esperada

Cada teste exibe:
- ✅ Status (passou/falhou)
- 📊 Contadores
- 💬 Detalhes dos resultados
- 📈 Resumo final com taxa de sucesso

Exemplo:
```
✅ Listar cargos: 11 cargos encontrados
   - Closer (Nível 3)
   - Coordenador Comercial (Nível 1)
   ...

═══════════════════════════════════════════════════════
                    RESUMO FINAL
═══════════════════════════════════════════════════════
✅ Passou: 8
❌ Falhou: 0
📊 Total:  8 testes
═══════════════════════════════════════════════════════
```

## 🔧 Requisitos

- Node.js 18+
- Supabase configurado (`.env.local`)
- Permissões de admin (service_role key)
- Database migrations aplicadas

## ⚠️ Notas Importantes

1. **Dados de Teste**: Os scripts criam e removem dados automaticamente
2. **Cleanup**: Sempre limpa após a execução (setup/teardown)
3. **Segurança**: Usa service_role key (só para testes locais)
4. **Isolamento**: Cada teste é independente

## 🐛 Troubleshooting

### Erro: "relation does not exist"
```bash
# Execute as migrations
npm run db:push
```

### Erro: "JWT expired"
```bash
# Verifique o SUPABASE_SERVICE_ROLE_KEY no .env.local
```

### Erro: "permission denied"
```bash
# Verifique se as RLS policies estão configuradas
# Use service_role key (não anon key)
```

## 📈 Próximos Passos

Após todos os testes passarem:
1. ✅ Fase 2 está validada
2. ✅ Pode avançar para Fase 3 (Seniority Assessments)
3. ✅ Ou fazer ajustes finos baseados nos resultados

---

**Status**: ✅ Pronto para execução
**Data**: 2026-01-05
**Versão**: 1.0
