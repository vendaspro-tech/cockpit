# Sistema de Planejamento Comercial - Lógica de Cascateamento e OTEs

## 1. Visão Geral do Sistema

Este documento detalha a lógica completa de um sistema de planejamento comercial Top-Down para infoprodutos, incluindo:
- Cascateamento de metas anuais para mensais
- Cálculo de estrutura de time (vendedores, supervisores, coordenadores)
- Sistema de OTEs (On-Target Earnings) por nível de senioridade
- Cálculo de CAC, ROI e folha de pagamento

---

## 2. Parâmetros Configuráveis (Inputs do Sistema)

### 2.1 Meta e Distribuição Global

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| Meta Global | R$ 10.000.000,00 | Meta anual total |
| % FCP | 50% | Percentual de faturamento Front Core Product |
| % FLP | 50% | Percentual de faturamento Low Price |

**Cálculo:**
- FCP = Meta Global × % FCP
- FLP = Meta Global × % FLP

### 2.2 Parâmetros de Produto

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| Ticket Bruto | R$ 2.497,00 | Valor bruto do produto |
| % À vista | 15% | Vendas pagas à vista |
| % Parcelado | 45% | Vendas parceladas |
| % Recorrente/Boleto | 40% | Vendas recorrentes (calculado automaticamente) |
| % Reembolso | 40% | Taxa de reembolso média |

**Cálculo do Ticket Médio Recebido:**
```
Ticket Recebido = (Ticket Bruto × % À vista × (1 - % Reembolso)) +
                  (Ticket Bruto × % Parcelado × (1 - % Reembolso)) +
                  (Ticket Bruto × % Recorrente) -
                  (Ticket Bruto × % Recorrente × % Reembolso)
```

### 2.3 Estratégias de Aquisição

**Perpétuo (Evergreen):**
- % Share Comercial: 60%
- % Conversão: 6%
- SQL/Dia por Vendedor: 20
- Dias Trabalhados: 22

**Lançamento (Launch):**
- % Share Comercial: 30%
- % Conversão: 15%
- SQL/Dia por Vendedor: 40
- Dias Trabalhados: 10

### 2.4 Estrutura de Time

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| Vendedor/Supervisor | 5 | Qtd de vendedores por supervisor |
| Supervisor/Coordenador | 3 | Qtd de supervisores por coordenador |

---

## 3. Cascateamento Mensal (Top-Down)

### 3.1 Estrutura de Dados Mensal

Para cada mês, define-se:
1. **Meta de Faturamento Recebido** (input manual)
2. **Estratégia de Aquisição** (Perpétuo ou Lançamento)

### 3.2 Fluxo de Cálculo por Mês

```
1. Meta Faturamento Recebido (input manual)
   ↓
2. % Share Comercial (baseado na estratégia)
   Fórmula: IF(Estratégia = "Perpétuo", 60%, IF(Estratégia = "Lançamento", 30%, 0))
   ↓
3. Meta Faturamento Comercial
   Fórmula: Meta Faturamento Recebido × % Share Comercial
   ↓
4. OTEs - Faturamento por Nível (5 níveis de multiplicadores)
   ↓
5. Número de Vendas por Nível
   ↓
6. % Conversão
   ↓
7. Número de SQLs
   ↓
8. Estrutura de Time (Vendedores, Supervisores, Coordenadores)
   ↓
9. Folha de Pagamento (Fixa + Variável)
   ↓
10. CAC e ROI do Time Comercial
```

---

## 4. Sistema de OTEs (Multiplicadores de Performance)

### 4.1 Conceito de Multiplicadores

O sistema trabalha com 5 níveis de performance baseados em multiplicadores:

| Multiplicador | Descrição | % Meta Base |
|---------------|-----------|-------------|
| 1.4 | Performance excepcional | 140% da meta |
| 1.2 | Performance alta | 120% da meta |
| 1.0 | Performance na meta | 100% da meta |
| 0.7 | Performance abaixo da meta | 70% da meta |
| 0.5 | Performance muito abaixo | 50% da meta |

### 4.2 Cascateamento de OTEs

Para cada nível de multiplicador, calcula-se:

**1. Faturamento Comercial por Nível**
```
Faturamento OTE = Meta Faturamento Comercial × Multiplicador
```

**2. Número de Vendas por Nível**
```
# Vendas = Faturamento OTE ÷ Ticket Médio Recebido
```

**3. % Conversão (baseada na estratégia do mês)**
```
% Conversão = IF(Estratégia = "Perpétuo", 6%, IF(Estratégia = "Lançamento", 15%, 0))
```

**4. Número de SQLs Necessários**
```
# SQLs = # Vendas ÷ % Conversão
```

**5. Número de Vendedores**
```
SQL por Vendedor/Mês = SQL/Dia × Dias Trabalhados
# Vendedores = ROUNDUP(# SQLs ÷ SQL por Vendedor/Mês, 0)
```

**6. Número de Supervisores**
```
# Supervisores = ROUNDUP(# Vendedores ÷ 5, 0)
```

**7. Número de Coordenadores**
```
# Coordenadores = ROUNDUP(# Supervisores ÷ 3, 0)
```

---

## 5. Estrutura Detalhada de OTEs por Nível de Senioridade

### 5.1 Modelo de Remuneração

#### Vendedor

| Nível | Salário Fixo | Cálculo Variável |
|-------|--------------|------------------|
| Júnior | R$ 2.500 | % comissão sobre faturamento |
| Pleno | R$ 2.750 | % comissão sobre faturamento |
| Sênior | R$ 3.000 | % comissão sobre faturamento |

#### Supervisor

| Nível | Salário Fixo | Variável |
|-------|--------------|----------|
| Júnior | R$ 4.000 | Média das comissões dos vendedores |
| Pleno | R$ 5.000 | Média das comissões dos vendedores |
| Sênior | R$ 6.000 | Média das comissões dos vendedores |

#### Coordenador

| Nível | Salário Fixo | Variável |
|-------|--------------|----------|
| Júnior | R$ 7.000 | 50% do fixo |
| Pleno | R$ 8.000 | 50% do fixo |
| Sênior/Gerente | R$ 10.000 | 50% do fixo |

### 5.2 Estrutura de OTE Vendedor (Exemplo: Júnior)

#### OTE Perpétuo

Matriz de performance com 5 níveis baseados em % de meta atingida:

| Nível | % Meta | # Vendas Base | # Vendas/Dia | % Comissão | Bônus Conversão |
|-------|--------|---------------|--------------|------------|-----------------|
| 1 | 50% | 10 | 0.45 | 0.5% | R$ 100 |
| 2 | 70% | 14 | 0.64 | 1.0% | R$ 300 |
| 3 | 100% | 20 | 0.91 | 3.5% | R$ 1.000 |
| 4 | 120% | 24 | 1.09 | 4.2% | R$ 1.500 |
| 5 | 140% | 28 | 1.27 | 4.9% | R$ 2.000 |

**Fórmulas de Cálculo:**

```javascript
// Nível 3 (100%) é a base de referência
vendas_base = 20 // input configurável

// Outros níveis calculam proporcionalmente
vendas_nivel = vendas_base × percentual_meta

// Vendas por dia
vendas_dia = vendas_nivel ÷ 22 dias

// Meta de faturamento
meta_faturamento = vendas_nivel × ticket_medio_recebido

// Variável do vendedor
faturamento_recebido = vendas_nivel × ticket_medio_recebido
variavel = faturamento_recebido × percentual_comissao

// Remuneração total
remuneracao_total = salario_fixo + variavel + bonus_conversao
```

#### OTE Lançamento

Similar ao perpétuo, mas com diferenças:

| Nível | % Meta | # Vendas Base | # Vendas/Dia | % Comissão |
|-------|--------|---------------|--------------|------------|
| 1 | 50% | Ref × 50% | ÷ 22 dias | 0.5% |
| 2 | 70% | Ref × 70% | ÷ 22 dias | Escalonado |
| 3 | 100% | Referência* | ÷ 22 dias | 2.0% |
| 4 | 120% | Ref × 120% | ÷ 22 dias | 3.0% |

*Referência = Média de vendas em período de lançamento

**Diferenças do Lançamento:**
- Não possui bônus por conversão fixo
- % Comissão geralmente mais alta
- Calculado com base em ações/eventos específicos

### 5.3 Cálculo de Métricas Individuais

Para cada nível de OTE, calcula-se:

**Faturamento Bruto Individual:**
```
Fat_Bruto = # Vendas × Ticket Bruto
```

**Faturamento Recebido Individual:**
```
Fat_Recebido = # Vendas × Ticket Médio Recebido
```

**CAC Individual (Fat Bruto):**
```
CAC_Bruto = Remuneração Total ÷ Faturamento Bruto
```

**ROI Individual (Fat Bruto):**
```
ROI_Bruto = (Faturamento Bruto - Remuneração) ÷ Remuneração
```

**CAC Individual (Fat Recebido):**
```
CAC_Recebido = Remuneração Total ÷ Faturamento Recebido
```

**ROI Individual (Fat Recebido):**
```
ROI_Recebido = (Faturamento Recebido - Remuneração) ÷ Remuneração
```

---

## 6. Folha de Pagamento por Nível

### 6.1 Folha Vendedor

**Fixo:**
```
Folha_Fixa_Vendedor = # Vendedores × Salário_Médio_Fixo
Salário_Médio_Fixo = MÉDIA(Jr, Pleno, Sênior)
```

**Variável:**
```
Folha_Variável_Vendedor = Faturamento_Comercial × % Média_Comissão
% Média_Comissão = MÉDIA(% comissões dos níveis Jr, Pl, Sr)
```

**Total:**
```
Total_Folha_Vendedor = Folha_Fixa + Folha_Variável
```

### 6.2 Folha Supervisor

**Fixo:**
```
Folha_Fixa_Supervisor = # Supervisores × Salário_Médio_Fixo
```

**Variável:**
```
Folha_Variável_Supervisor = Faturamento_Comercial × % Média_Comissão_Supervisor
```

### 6.3 Folha Coordenador

**Fixo:**
```
Folha_Fixa_Coordenador = # Coordenadores × Salário_Médio_Fixo
```

**Variável:**
```
Folha_Variável_Coordenador = # Coordenadores × (Salário_Médio_Fixo × 50%)
```

### 6.4 Total Folha Comercial

```
Total_Folha = Total_Vendedor + Total_Supervisor + Total_Coordenador
```

---

## 7. Métricas Consolidadas

### 7.1 CAC Time Comercial

Para cada nível de multiplicador:

```
% CAC = Total_Folha_Comercial ÷ Faturamento_OTE
```

### 7.2 ROI Time Comercial

```
# ROI = (Faturamento_OTE - Total_Folha) ÷ Total_Folha
```

### 7.3 Médias de Perpétuo

O sistema calcula médias apenas dos meses com estratégia "Perpétuo":

```
Média_Perpétuo = MÉDIA(valores dos meses perpétuos)
```

Aplicável a:
- Faturamento
- Número de vendas
- SQLs
- CAC
- ROI

---

## 8. Ascensão de Senioridade

### 8.1 Regras de Promoção

| Transição | Aumento Performance | Aumento Remuneração |
|-----------|---------------------|---------------------|
| Jr → Pleno | +10% | +20% |
| Pleno → Sênior | +10% | +20% |

### 8.2 Aplicação

Quando um vendedor/supervisor/coordenador é promovido:
- Performance esperada aumenta 10%
- Remuneração fixa aumenta 20%
- % Comissão pode ser reajustada

---

## 9. Lógica de Implementação para SaaS

### 9.1 Estrutura de Dados

```javascript
// Configurações Globais
const globalConfig = {
  metaGlobal: 10000000,
  percFCP: 0.5,
  percFLP: 0.5,
  ticketBruto: 2497,
  percAVista: 0.15,
  percParcelado: 0.45,
  percReembolso: 0.4,
  vendedorPorSupervisor: 5,
  supervisorPorCoordenador: 3
}

// Estratégias
const estrategias = {
  perpetuo: {
    shareComercial: 0.6,
    conversao: 0.06,
    sqlDia: 20,
    diasTrabalhados: 22
  },
  lancamento: {
    shareComercial: 0.3,
    conversao: 0.15,
    sqlDia: 40,
    diasTrabalhados: 10
  }
}

// Remuneração
const remuneracao = {
  vendedor: {
    jr: { fixo: 2500, niveis: [...] },
    pleno: { fixo: 2750, niveis: [...] },
    senior: { fixo: 3000, niveis: [...] }
  },
  supervisor: {
    jr: { fixo: 4000 },
    pleno: { fixo: 5000 },
    senior: { fixo: 6000 }
  },
  coordenador: {
    jr: { fixo: 7000 },
    pleno: { fixo: 8000 },
    senior: { fixo: 10000 }
  }
}

// Multiplicadores de OTE
const multiplicadores = [1.4, 1.2, 1.0, 0.7, 0.5]
```

### 9.2 Funções Principais

```javascript
// 1. Calcular Ticket Médio Recebido
function calcularTicketMedioRecebido(config) {
  const { ticketBruto, percAVista, percParcelado, percReembolso } = config
  const percRecorrente = 1 - percAVista - percParcelado
  
  return (ticketBruto * percAVista * (1 - percReembolso)) +
         (ticketBruto * percParcelado * (1 - percReembolso)) +
         (ticketBruto * percRecorrente) -
         (ticketBruto * percRecorrente * percReembolso)
}

// 2. Processar Mês
function processarMes(mes) {
  const { metaRecebido, estrategia } = mes
  const estratConfig = estrategias[estrategia]
  
  // Share comercial
  const shareComercial = estratConfig.shareComercial
  const metaComercial = metaRecebido * shareComercial
  
  // Processar cada multiplicador
  const otes = multiplicadores.map(mult => 
    processarOTE(metaComercial, mult, estrategia)
  )
  
  return { metaComercial, otes }
}

// 3. Processar OTE
function processarOTE(metaComercial, multiplicador, estrategia) {
  const faturamentoOTE = metaComercial * multiplicador
  const numVendas = faturamentoOTE / ticketMedioRecebido
  const conversao = estrategias[estrategia].conversao
  const numSQLs = numVendas / conversao
  
  const estruturaTime = calcularEstruturaTime(numSQLs, estrategia)
  const folha = calcularFolha(estruturaTime, faturamentoOTE)
  
  return {
    multiplicador,
    faturamentoOTE,
    numVendas,
    numSQLs,
    estruturaTime,
    folha,
    cac: folha.total / faturamentoOTE,
    roi: (faturamentoOTE - folha.total) / folha.total
  }
}

// 4. Calcular Estrutura de Time
function calcularEstruturaTime(numSQLs, estrategia) {
  const { sqlDia, diasTrabalhados } = estrategias[estrategia]
  const sqlPorVendedorMes = sqlDia * diasTrabalhados
  
  const vendedores = Math.ceil(numSQLs / sqlPorVendedorMes)
  const supervisores = Math.ceil(vendedores / 5)
  const coordenadores = Math.ceil(supervisores / 3)
  
  return { vendedores, supervisores, coordenadores }
}

// 5. Calcular Folha
function calcularFolha(estruturaTime, faturamento) {
  const folhaVendedor = calcularFolhaVendedor(estruturaTime.vendedores, faturamento)
  const folhaSupervisor = calcularFolhaSupervisor(estruturaTime.supervisores, faturamento)
  const folhaCoordenador = calcularFolhaCoordenador(estruturaTime.coordenadores)
  
  return {
    vendedor: folhaVendedor,
    supervisor: folhaSupervisor,
    coordenador: folhaCoordenador,
    total: folhaVendedor.total + folhaSupervisor.total + folhaCoordenador.total
  }
}

// 6. Calcular OTE Detalhado por Vendedor
function calcularOTEVendedor(nivel, senioridade, estrategia, percentualMeta) {
  const config = remuneracao.vendedor[senioridade]
  const niveisOTE = estrategia === 'perpetuo' 
    ? config.niveis.perpetuo 
    : config.niveis.lancamento
  
  const nivelOTE = niveisOTE.find(n => n.percentualMeta === percentualMeta)
  
  const numVendas = nivelOTE.vendasBase * percentualMeta
  const vendasDia = numVendas / 22
  const faturamentoBruto = numVendas * ticketBruto
  const faturamentoRecebido = numVendas * ticketMedioRecebido
  const variavel = faturamentoRecebido * nivelOTE.percentualComissao
  const bonusConversao = nivelOTE.bonusConversao || 0
  
  const remuneracaoTotal = config.fixo + variavel + bonusConversao
  
  return {
    numVendas,
    vendasDia,
    faturamentoBruto,
    faturamentoRecebido,
    variavel,
    bonusConversao,
    remuneracaoTotal,
    cac: remuneracaoTotal / faturamentoRecebido,
    roi: (faturamentoRecebido - remuneracaoTotal) / remuneracaoTotal
  }
}
```

### 9.3 Fluxo de Processamento

```javascript
// Processar ano completo
function processarAnoCompleto(meses) {
  const resultado = {
    meses: [],
    consolidado: {
      totalFaturamento: 0,
      totalFolha: 0,
      cacMedio: 0,
      roiMedio: 0
    }
  }
  
  // Processar cada mês
  meses.forEach(mes => {
    const processado = processarMes(mes)
    resultado.meses.push(processado)
    
    // Acumular totais
    resultado.consolidado.totalFaturamento += processado.metaComercial
    // ... outros acumuladores
  })
  
  // Calcular médias perpétuo
  const mesesPerpetuos = resultado.meses.filter(m => m.estrategia === 'perpetuo')
  resultado.mediaPerpetuos = calcularMedias(mesesPerpetuos)
  
  return resultado
}
```

---

## 10. Validações e Regras de Negócio

### 10.1 Validações de Input

- Meta Global > 0
- Percentuais entre 0 e 1 (0% a 100%)
- Ticket Bruto > 0
- SQL/Dia > 0
- Dias Trabalhados > 0
- Vendedor/Supervisor >= 1
- Supervisor/Coordenador >= 1

### 10.2 Regras de Cálculo

1. **Soma de Percentuais de Forma de Pagamento deve ser 100%**
   - % À vista + % Parcelado + % Recorrente = 1

2. **Arredondamento de Time**
   - Número de vendedores, supervisores e coordenadores sempre arredonda para CIMA

3. **Média Perpétuo**
   - Só considera meses com estratégia "Perpétuo"
   - Exclui meses de lançamento das médias

4. **Cascateamento de Fórmulas**
   - Toda alteração em parâmetro global recalcula todos os meses
   - Alteração em meta mensal recalcula apenas aquele mês

### 10.3 Tratamento de Erros

```javascript
function validarConfiguracao(config) {
  const erros = []
  
  if (config.metaGlobal <= 0) {
    erros.push("Meta Global deve ser maior que zero")
  }
  
  if (config.percAVista + config.percParcelado > 1) {
    erros.push("Soma de % À Vista e % Parcelado não pode ultrapassar 100%")
  }
  
  if (config.ticketBruto <= 0) {
    erros.push("Ticket Bruto deve ser maior que zero")
  }
  
  // ... outras validações
  
  return erros
}
```

---

## 11. Outputs do Sistema

### 11.1 Dashboard Principal

Para visualização executiva:
- Meta Global vs Realizado
- Distribuição FCP/FLP
- Gráfico de evolução mensal
- CAC e ROI médios
- Estrutura de time total (vendedores, supervisores, coordenadores)

### 11.2 Visão Mensal

Para cada mês:
- Meta de faturamento
- Estratégia (Perpétuo/Lançamento)
- Meta comercial
- OTEs por nível de performance
- Estrutura de time necessária
- Folha de pagamento detalhada
- CAC e ROI consolidados

### 11.3 Visão de OTE Individual

Para cada vendedor/supervisor/coordenador:
- Nível de senioridade
- Estratégia do mês
- Matriz de performance (5 níveis)
- Remuneração fixa e variável por nível
- Métricas individuais (CAC, ROI)
- Faturamento esperado por nível

### 11.4 Relatórios Comparativos

- Perpétuo vs Lançamento
- Evolução de CAC ao longo do ano
- Evolução de ROI ao longo do ano
- Análise de produtividade por vendedor
- Comparativo de senioridade (Jr vs Pl vs Sr)

---

## 12. Considerações para Implementação SaaS

### 12.1 Arquitetura Recomendada

**Frontend:**
- Formulários para input de configurações globais
- Tabela mensal editável (meta + estratégia)
- Dashboard com gráficos (ChartJS/Recharts)
- Matriz de OTE interativa
- Exportação para Excel/PDF

**Backend:**
- API RESTful para CRUD de configurações
- Endpoints de cálculo (processar mês, processar ano)
- Cache de resultados calculados
- Versionamento de configurações

**Banco de Dados:**
- Tabela de Configurações Globais
- Tabela de Meses (metas e estratégias)
- Tabela de Remunerações (OTEs por senioridade)
- Tabela de Resultados Calculados (cache)
- Histórico de alterações (audit log)

### 12.2 Performance

**Otimizações:**
- Calcular apenas o que mudou (delta calculation)
- Cache de resultados intermediários
- Processamento assíncrono para ano completo
- Debounce em inputs de formulário

### 12.3 Funcionalidades Adicionais

**Nice to have:**
- Templates de configuração (ex: "Infoproduto B2C", "SaaS B2B")
- Simulador "What-if" (ajustar parâmetros e ver impacto)
- Comparação de cenários (baseline vs otimista vs pessimista)
- Metas individuais por vendedor
- Integração com CRM (importar dados reais de vendas)
- Alertas quando performance < 70% da meta
- Recomendações automáticas de ajuste de time

### 12.4 Permissões e Roles

**Admin:**
- Editar configurações globais
- Editar estrutura de OTEs
- Visualizar todos os dados

**Gerente Comercial:**
- Editar metas mensais
- Visualizar dashboards e relatórios
- Exportar dados

**Vendedor:**
- Visualizar apenas seu OTE individual
- Acompanhar sua performance

---

## 13. Fórmulas Excel Originais (Referência)

### 13.1 Meta Comercial Mensal
```excel
=B26*B28
Onde:
B26 = Meta Faturamento Recebido (input manual)
B28 = % Share Comercial (calculado com base na estratégia)
```

### 13.2 % Share Comercial
```excel
=IF(B27="Perpétuo", $C$19, IF(B27="Lançamento", $C$20, 0))
Onde:
B27 = Estratégia de Aquisição
C19 = % Share Perpétuo (0.6)
C20 = % Share Lançamento (0.3)
```

### 13.3 Faturamento OTE
```excel
=IFERROR(B29*$A$32, 0)
Onde:
B29 = Meta Faturamento Comercial
A32 = Multiplicador (1.4, 1.2, 1.0, 0.7, 0.5)
```

### 13.4 Número de Vendas OTE
```excel
=IFERROR(B32/$C$18, 0)
Onde:
B32 = Faturamento OTE
C18 = Ticket Médio Recebido
```

### 13.5 Número de Vendedores
```excel
=IFERROR(IF(B56<1, 0, ROUNDUP(B56/$I$22, 0)), 0)
Onde:
B56 = Número de SQLs necessários
I22 = Vendedor por Supervisor (5)
```

### 13.6 Ticket Médio Recebido
```excel
=SUM(J17:J19)-(C17*I19*K17)
Onde:
J17:J19 = Soma dos componentes (à vista, parcelado, recorrente)
C17 = Ticket Bruto
I19 = % Recorrente/Boleto
K17 = % Reembolso
```

---

## 14. Glossário

| Termo | Significado |
|-------|-------------|
| OTE | On-Target Earnings - Remuneração esperada ao atingir a meta |
| SQL | Sales Qualified Lead - Lead qualificado para vendas |
| CAC | Custo de Aquisição de Cliente |
| ROI | Return on Investment - Retorno sobre Investimento |
| FCP | Front Core Product - Produto principal de entrada |
| FLP | Low Price - Produto de baixo ticket |
| Share Comercial | Percentual da meta total atribuído ao time comercial |
| Perpétuo | Estratégia evergreen de vendas contínuas |
| Lançamento | Estratégia de vendas concentradas em período específico |
| Top-Down | Abordagem de planejamento que parte da meta total e desce aos detalhes |
| Cascateamento | Processo de distribuir meta global em metas menores (mensal, por time, individual) |

---

## 15. Checklist de Implementação

### Fase 1: MVP (Core)
- [ ] CRUD de Configurações Globais
- [ ] CRUD de Metas Mensais
- [ ] Cálculo de cascateamento mensal básico
- [ ] Dashboard com métricas principais
- [ ] Exportação para Excel

### Fase 2: OTEs
- [ ] CRUD de estrutura de remuneração
- [ ] Matriz de OTE por senioridade
- [ ] Cálculo de OTEs individuais
- [ ] Visualização de OTEs por nível

### Fase 3: Time e Folha
- [ ] Cálculo de estrutura de time
- [ ] Cálculo de folha de pagamento
- [ ] Métricas de CAC e ROI
- [ ] Relatórios comparativos

### Fase 4: Avançado
- [ ] Simulador de cenários
- [ ] Histórico e versionamento
- [ ] Permissões por role
- [ ] Integração com CRM
- [ ] Alertas e notificações

---

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Propósito:** Documentação para replicação em SaaS
