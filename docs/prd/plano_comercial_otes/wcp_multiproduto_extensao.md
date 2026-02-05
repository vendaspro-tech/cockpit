# Extensão: Planejamento Multi-Produto

## Complemento à Documentação Principal - Sistema de Cascateamento para Múltiplos Produtos

---

## 1. Conceito: De Produto Único para Multi-Produto

### 1.1 Modelo Atual (Produto Único)

```
Meta Global (R$ 10M)
    ├── FCP (50% = R$ 5M) 
    └── FLP (50% = R$ 5M)
        ↓
    Produto Consolidado
    (Ticket: R$ 2.497)
        ↓
    Cascateamento Mensal
```

### 1.2 Modelo Multi-Produto

```
Meta Global (R$ 10M)
    ├── Produto A - Curso Avançado (40% = R$ 4M)
    │   ├── Ticket: R$ 3.997
    │   ├── Estratégia Principal: Perpétuo
    │   └── OTEs específicos
    │
    ├── Produto B - Curso Básico (30% = R$ 3M)
    │   ├── Ticket: R$ 997
    │   ├── Estratégia Principal: Perpétuo
    │   └── OTEs específicos
    │
    ├── Produto C - Mentoria Premium (20% = R$ 2M)
    │   ├── Ticket: R$ 12.997
    │   ├── Estratégia: Lançamentos Trimestrais
    │   └── OTEs específicos (Closer)
    │
    └── Produto D - Ebook/Tripwire (10% = R$ 1M)
        ├── Ticket: R$ 47
        ├── Estratégia: Perpétuo (Self-Service)
        └── Sem time comercial dedicado
```

---

## 2. Estrutura de Dados para Multi-Produto

### 2.1 Configuração Global

```javascript
const configuracaoGlobal = {
  metaGlobal: 10000000,
  anoReferencia: 2026,
  
  // Distribuição de produtos
  produtos: [
    {
      id: 'prod-001',
      nome: 'Curso Avançado de Vendas',
      categoria: 'core-product',
      shareMetaGlobal: 0.40, // 40% da meta global
      ativo: true
    },
    {
      id: 'prod-002',
      nome: 'Curso Básico de Prospecção',
      categoria: 'front-product',
      shareMetaGlobal: 0.30,
      ativo: true
    },
    {
      id: 'prod-003',
      nome: 'Mentoria Premium',
      categoria: 'high-ticket',
      shareMetaGlobal: 0.20,
      ativo: true
    },
    {
      id: 'prod-004',
      nome: 'Ebook Gatilhos Mentais',
      categoria: 'tripwire',
      shareMetaGlobal: 0.10,
      ativo: true
    }
  ]
}
```

### 2.2 Configuração por Produto

```javascript
const configuracaoProduto = {
  // Produto A - Curso Avançado
  'prod-001': {
    nome: 'Curso Avançado de Vendas',
    
    // Financeiro
    ticketBruto: 3997,
    formasPagamento: {
      aVista: { percentual: 0.20, desconto: 0.10 }, // 10% desc à vista
      parcelado: { percentual: 0.60, parcelas: 12 },
      recorrente: { percentual: 0.20, meses: 12 }
    },
    taxaReembolso: 0.25,
    
    // Estratégia de Vendas
    estrategiaPrincipal: 'perpetuo', // ou 'lancamento' ou 'misto'
    
    // Conversão e Produtividade
    perpetuo: {
      shareComercial: 0.70, // 70% vendido por comercial, 30% orgânico
      conversao: 0.08,
      sqlDiaVendedor: 15,
      diasTrabalhadosMes: 22,
      cicloVenda: 7 // dias médio do ciclo de vendas
    },
    
    lancamento: {
      shareComercial: 0.40,
      conversao: 0.18,
      sqlDiaVendedor: 30,
      diasEvento: 10,
      cicloVenda: 3
    },
    
    // Estrutura de Time Específica
    estruturaTime: {
      modelo: 'vendedor-supervisor-coordenador', // ou 'closer-setter'
      vendedorPorSupervisor: 5,
      supervisorPorCoordenador: 3
    },
    
    // OTEs Personalizados
    otes: {
      vendedor: {
        jr: {
          fixo: 2500,
          perpetuo: {
            niveis: [
              { percentualMeta: 0.5, comissao: 0.005, bonus: 100 },
              { percentualMeta: 0.7, comissao: 0.010, bonus: 300 },
              { percentualMeta: 1.0, comissao: 0.040, bonus: 1500 },
              { percentualMeta: 1.2, comissao: 0.048, bonus: 2000 },
              { percentualMeta: 1.4, comissao: 0.056, bonus: 2500 }
            ]
          },
          lancamento: {
            niveis: [
              { percentualMeta: 0.5, comissao: 0.007 },
              { percentualMeta: 0.7, comissao: 0.015 },
              { percentualMeta: 1.0, comissao: 0.030 },
              { percentualMeta: 1.2, comissao: 0.035 }
            ]
          }
        },
        pleno: { /* ... */ },
        senior: { /* ... */ }
      },
      supervisor: { /* ... */ },
      coordenador: { /* ... */ }
    }
  },
  
  // Produto B - Curso Básico
  'prod-002': {
    nome: 'Curso Básico de Prospecção',
    ticketBruto: 997,
    formasPagamento: {
      aVista: { percentual: 0.30, desconto: 0.15 },
      parcelado: { percentual: 0.50, parcelas: 6 },
      recorrente: { percentual: 0.20, meses: 6 }
    },
    taxaReembolso: 0.35,
    
    estrategiaPrincipal: 'perpetuo',
    
    perpetuo: {
      shareComercial: 0.50, // Mais vendas orgânicas
      conversao: 0.12, // Conversão maior (produto mais barato)
      sqlDiaVendedor: 25,
      diasTrabalhadosMes: 22,
      cicloVenda: 3
    },
    
    // Time compartilhado ou dedicado?
    estruturaTime: {
      modelo: 'compartilhado', // Usa mesmo time do Produto A
      dedicado: false
    },
    
    otes: {
      vendedor: {
        jr: {
          fixo: 2500, // Mesmo fixo, varia comissão
          perpetuo: {
            niveis: [
              { percentualMeta: 0.5, comissao: 0.008, bonus: 50 },
              { percentualMeta: 0.7, comissao: 0.015, bonus: 150 },
              { percentualMeta: 1.0, comissao: 0.050, bonus: 800 },
              { percentualMeta: 1.2, comissao: 0.060, bonus: 1200 },
              { percentualMeta: 1.4, comissao: 0.070, bonus: 1500 }
            ]
          }
        }
      }
    }
  },
  
  // Produto C - Mentoria Premium (High-Ticket)
  'prod-003': {
    nome: 'Mentoria Premium',
    ticketBruto: 12997,
    formasPagamento: {
      aVista: { percentual: 0.40, desconto: 0.08 },
      parcelado: { percentual: 0.60, parcelas: 12 }
    },
    taxaReembolso: 0.15, // Menor reembolso (mais qualificado)
    
    estrategiaPrincipal: 'lancamento',
    
    lancamento: {
      shareComercial: 0.90, // Quase 100% comercial
      conversao: 0.25, // Alta conversão (mais qualificado)
      sqlDiaVendedor: 10, // Menos volume, mais qualificado
      diasEvento: 7,
      cicloVenda: 14 // Ciclo mais longo
    },
    
    // Estrutura de Closer
    estruturaTime: {
      modelo: 'closer-setter',
      setterPorCloser: 3,
      closerPorGestor: 4
    },
    
    otes: {
      closer: {
        jr: {
          fixo: 4000,
          lancamento: {
            niveis: [
              { percentualMeta: 0.5, comissao: 0.03, bonus: 500 },
              { percentualMeta: 0.7, comissao: 0.05, bonus: 1500 },
              { percentualMeta: 1.0, comissao: 0.08, bonus: 4000 },
              { percentualMeta: 1.2, comissao: 0.10, bonus: 6000 }
            ]
          }
        }
      },
      setter: {
        jr: {
          fixo: 2000,
          variavel: {
            tipo: 'por-agendamento-qualificado',
            valorPorSQL: 50, // R$ 50 por SQL qualificado gerado
            bonusConversao: 200 // Bonus se o SQL converter
          }
        }
      }
    }
  },
  
  // Produto D - Tripwire (Self-Service)
  'prod-004': {
    nome: 'Ebook Gatilhos Mentais',
    ticketBruto: 47,
    formasPagamento: {
      aVista: { percentual: 1.0, desconto: 0 }
    },
    taxaReembolso: 0.05,
    
    estrategiaPrincipal: 'perpetuo',
    
    perpetuo: {
      shareComercial: 0, // 100% self-service
      conversao: 0.35, // Alta conversão (baixo risco)
      automacao: true
    },
    
    estruturaTime: {
      modelo: 'self-service',
      dedicado: false,
      custo: {
        tipo: 'fixo-mensal',
        valor: 2000 // Custo de automação/plataforma
      }
    }
  }
}
```

---

## 3. Lógica de Cascateamento Multi-Produto

### 3.1 Nível 1: Distribuição da Meta Global

```javascript
function distribuirMetaGlobal(configuracao) {
  const { metaGlobal, produtos } = configuracao
  
  return produtos.map(produto => {
    const metaProduto = metaGlobal * produto.shareMetaGlobal
    
    return {
      produtoId: produto.id,
      nome: produto.nome,
      metaAnual: metaProduto,
      metaMensal: metaProduto / 12,
      shareGlobal: produto.shareMetaGlobal
    }
  })
}

// Resultado:
// [
//   { produtoId: 'prod-001', metaAnual: 4000000, metaMensal: 333333.33 },
//   { produtoId: 'prod-002', metaAnual: 3000000, metaMensal: 250000 },
//   { produtoId: 'prod-003', metaAnual: 2000000, metaMensal: 166666.67 },
//   { produtoId: 'prod-004', metaAnual: 1000000, metaMensal: 83333.33 }
// ]
```

### 3.2 Nível 2: Distribuição Mensal por Produto

Cada produto pode ter distribuição mensal diferente:

```javascript
const distribuicaoMensalPorProduto = {
  'prod-001': {
    // Curso Avançado - Perpétuo uniforme
    janeiro: 0.083, fevereiro: 0.083, marco: 0.083,
    abril: 0.083, maio: 0.083, junho: 0.083,
    julho: 0.083, agosto: 0.083, setembro: 0.083,
    outubro: 0.083, novembro: 0.083, dezembro: 0.083
  },
  
  'prod-002': {
    // Curso Básico - Picos sazonais (início de trimestre)
    janeiro: 0.12, fevereiro: 0.07, marco: 0.07,
    abril: 0.12, maio: 0.07, junho: 0.07,
    julho: 0.12, agosto: 0.07, setembro: 0.07,
    outubro: 0.12, novembro: 0.07, dezembro: 0.07
  },
  
  'prod-003': {
    // Mentoria Premium - Lançamentos Trimestrais
    janeiro: 0.25, fevereiro: 0, marco: 0,
    abril: 0.25, maio: 0, junho: 0,
    julho: 0, agosto: 0.25, setembro: 0,
    outubro: 0, novembro: 0.25, dezembro: 0
  },
  
  'prod-004': {
    // Tripwire - Self-service constante
    janeiro: 0.083, fevereiro: 0.083, marco: 0.083,
    abril: 0.083, maio: 0.083, junho: 0.083,
    julho: 0.083, agosto: 0.083, setembro: 0.083,
    outubro: 0.083, novembro: 0.083, dezembro: 0.083
  }
}

function calcularMetaMensalProduto(produtoId, metaAnual, mes) {
  const distribuicao = distribuicaoMensalPorProduto[produtoId]
  return metaAnual * distribuicao[mes]
}
```

### 3.3 Nível 3: Estratégia e Share Comercial

```javascript
function calcularShareComercial(produtoId, mes) {
  const config = configuracaoProduto[produtoId]
  const estrategiaMes = determinarEstrategiaMes(produtoId, mes)
  
  if (estrategiaMes === 'perpetuo') {
    return config.perpetuo.shareComercial
  } else if (estrategiaMes === 'lancamento') {
    return config.lancamento.shareComercial
  }
  
  return 0
}

function calcularMetaComercial(produtoId, metaMes, mes) {
  const shareComercial = calcularShareComercial(produtoId, mes)
  return metaMes * shareComercial
}
```

### 3.4 Nível 4: OTEs por Produto

Cada produto tem seus próprios OTEs:

```javascript
function calcularOTEsPorProduto(produtoId, metaComercialMes, mes) {
  const config = configuracaoProduto[produtoId]
  const estrategia = determinarEstrategiaMes(produtoId, mes)
  const multiplicadores = [1.4, 1.2, 1.0, 0.7, 0.5]
  
  return multiplicadores.map(mult => {
    const faturamentoOTE = metaComercialMes * mult
    const ticketRecebido = calcularTicketRecebido(produtoId)
    const numVendas = faturamentoOTE / ticketRecebido
    
    // Usar conversão específica do produto
    const conversao = config[estrategia].conversao
    const numSQLs = numVendas / conversao
    
    // Estrutura de time específica
    const estruturaTime = calcularEstruturaTimeProduto(
      produtoId, 
      numSQLs, 
      estrategia
    )
    
    // OTEs específicos do produto
    const otes = calcularRemuneracaoProduto(
      produtoId,
      estruturaTime,
      faturamentoOTE,
      estrategia
    )
    
    return {
      multiplicador: mult,
      faturamentoOTE,
      numVendas,
      numSQLs,
      estruturaTime,
      otes,
      cac: otes.total / faturamentoOTE,
      roi: (faturamentoOTE - otes.total) / otes.total
    }
  })
}
```

---

## 4. Estruturas de Time Multi-Produto

### 4.1 Modelo: Time Compartilhado vs Dedicado

**Opção A: Time Compartilhado (Mesmos vendedores vendem vários produtos)**

```javascript
const timeCompartilhado = {
  tipo: 'compartilhado',
  produtos: ['prod-001', 'prod-002'], // Produtos que compartilham time
  
  // Distribuição de esforço
  distribuicaoEsforco: {
    'prod-001': 0.60, // 60% do tempo em Produto A
    'prod-002': 0.40  // 40% do tempo em Produto B
  },
  
  // OTE combinado
  ote: {
    vendedor: {
      jr: {
        fixo: 2500,
        variavel: {
          'prod-001': { comissao: 0.035, peso: 0.6 },
          'prod-002': { comissao: 0.045, peso: 0.4 }
        }
      }
    }
  }
}

// Cálculo de variável em time compartilhado
function calcularVariavelCompartilhado(vendedor, vendas) {
  let totalVariavel = 0
  
  for (const [produtoId, venda] of Object.entries(vendas)) {
    const config = vendedor.variavel[produtoId]
    totalVariavel += venda.faturamento * config.comissao
  }
  
  return totalVariavel
}
```

**Opção B: Time Dedicado (Vendedores exclusivos por produto)**

```javascript
const timeDedicado = {
  'prod-001': {
    vendedores: 15,
    supervisores: 3,
    coordenadores: 1,
    ote: { /* OTE específico Produto A */ }
  },
  'prod-002': {
    vendedores: 10,
    supervisores: 2,
    coordenadores: 1,
    ote: { /* OTE específico Produto B */ }
  },
  'prod-003': {
    closers: 5,
    setters: 15,
    gestores: 2,
    ote: { /* OTE específico High-Ticket */ }
  }
}
```

### 4.2 Cálculo de Necessidade de Time Multi-Produto

```javascript
function calcularTimeTotalMultiProduto(mes) {
  const resultado = {
    compartilhado: {
      vendedores: 0,
      supervisores: 0,
      coordenadores: 0
    },
    dedicado: {},
    total: {
      vendedores: 0,
      supervisores: 0,
      coordenadores: 0,
      folha: 0
    }
  }
  
  // Produtos com time compartilhado
  const produtosCompartilhados = ['prod-001', 'prod-002']
  let sqlTotalCompartilhado = 0
  
  for (const produtoId of produtosCompartilhados) {
    const metaMes = calcularMetaMensalProduto(produtoId, mes)
    const sqlsNecessarios = calcularSQLsNecessarios(produtoId, metaMes)
    sqlTotalCompartilhado += sqlsNecessarios
  }
  
  // Calcular time para SQL total compartilhado
  resultado.compartilhado = calcularEstruturaTime(sqlTotalCompartilhado)
  
  // Produtos com time dedicado
  const produtosDedicados = ['prod-003']
  
  for (const produtoId of produtosDedicados) {
    const metaMes = calcularMetaMensalProduto(produtoId, mes)
    const sqlsNecessarios = calcularSQLsNecessarios(produtoId, metaMes)
    resultado.dedicado[produtoId] = calcularEstruturaTime(sqlsNecessarios)
  }
  
  // Consolidar totais
  resultado.total = consolidarTimes(resultado)
  
  return resultado
}
```

---

## 5. Consolidação e Dashboards Multi-Produto

### 5.1 Visão Consolidada

```javascript
function gerarDashboardConsolidado(ano) {
  const dashboard = {
    resumoGlobal: {
      metaTotal: 10000000,
      produtos: []
    },
    
    porProduto: {},
    
    estruturaTime: {
      total: {},
      porProduto: {}
    },
    
    metricas: {
      cacMedio: 0,
      roiMedio: 0,
      ticketMedio: 0
    }
  }
  
  // Processar cada produto
  for (const produto of configuracaoGlobal.produtos) {
    const resultadoProduto = processarProdutoAnoCompleto(produto.id, ano)
    
    dashboard.resumoGlobal.produtos.push({
      id: produto.id,
      nome: produto.nome,
      meta: resultadoProduto.metaTotal,
      share: produto.shareMetaGlobal,
      realizado: resultadoProduto.realizadoTotal,
      atingimento: resultadoProduto.atingimento
    })
    
    dashboard.porProduto[produto.id] = resultadoProduto
  }
  
  // Consolidar métricas
  dashboard.metricas = consolidarMetricas(dashboard.porProduto)
  dashboard.estruturaTime = consolidarEstruturaTimes(dashboard.porProduto)
  
  return dashboard
}
```

### 5.2 Métricas Comparativas Entre Produtos

```javascript
function compararProdutos(produtoIds, mes) {
  return produtoIds.map(produtoId => {
    const config = configuracaoProduto[produtoId]
    const resultado = processarProdutoMes(produtoId, mes)
    
    return {
      produto: config.nome,
      ticket: config.ticketBruto,
      conversao: resultado.conversaoMedia,
      cac: resultado.cacMedio,
      roi: resultado.roiMedio,
      vendedoresNecessarios: resultado.estruturaTime.vendedores,
      folhaTotal: resultado.folhaTotal,
      eficiencia: resultado.faturamento / resultado.folhaTotal
    }
  }).sort((a, b) => b.eficiencia - a.eficiencia)
}

// Resultado exemplo:
// [
//   { produto: 'Mentoria Premium', eficiencia: 8.5, cac: 0.11, roi: 7.5 },
//   { produto: 'Curso Avançado', eficiencia: 5.2, cac: 0.18, roi: 4.5 },
//   { produto: 'Curso Básico', eficiencia: 4.1, cac: 0.23, roi: 3.3 }
// ]
```

---

## 6. Cenários Especiais Multi-Produto

### 6.1 Cross-Sell e Upsell

```javascript
const funiDeProdutos = {
  entrada: 'prod-004', // Tripwire
  
  crossSell: {
    'prod-004': {
      ofertas: ['prod-002'], // Ebook → Curso Básico
      conversao: 0.15,
      tempo: 'imediato' // ou dias
    },
    'prod-002': {
      ofertas: ['prod-001'], // Curso Básico → Curso Avançado
      conversao: 0.25,
      tempo: 30 // dias
    }
  },
  
  upsell: {
    'prod-001': {
      ofertas: ['prod-003'], // Curso Avançado → Mentoria
      conversao: 0.08,
      tempo: 60
    }
  }
}

function calcularReceitaCrossSell(produtoOrigem, mes) {
  const vendasOrigem = obterVendasProduto(produtoOrigem, mes)
  const config = funiDeProdutos.crossSell[produtoOrigem]
  
  let receitaCrossSell = 0
  
  for (const produtoDestino of config.ofertas) {
    const vendasCross = vendasOrigem * config.conversao
    const ticketDestino = configuracaoProduto[produtoDestino].ticketBruto
    receitaCrossSell += vendasCross * ticketDestino
  }
  
  return receitaCrossSell
}
```

### 6.2 Sazonalidade por Produto

```javascript
const sazonalidadePorProduto = {
  'prod-001': {
    // Curso Avançado - Menor sazonalidade
    janeiro: 1.0, fevereiro: 0.9, marco: 1.0,
    abril: 1.1, maio: 1.0, junho: 0.8,
    julho: 0.7, agosto: 1.2, setembro: 1.1,
    outubro: 1.0, novembro: 1.0, dezembro: 0.8
  },
  
  'prod-002': {
    // Curso Básico - Alta sazonalidade (início de trimestre)
    janeiro: 1.5, fevereiro: 0.7, marco: 0.8,
    abril: 1.4, maio: 0.8, junho: 0.7,
    julho: 1.3, agosto: 0.9, setembro: 0.8,
    outubro: 1.2, novembro: 0.9, dezembro: 0.6
  },
  
  'prod-003': {
    // Mentoria - Apenas em lançamentos
    janeiro: 3.0, fevereiro: 0, marco: 0,
    abril: 3.0, maio: 0, junho: 0,
    julho: 0, agosto: 3.0, setembro: 0,
    outubro: 0, novembro: 3.0, dezembro: 0
  }
}

function ajustarMetaPorSazonalidade(produtoId, metaBase, mes) {
  const fatorSazonalidade = sazonalidadePorProduto[produtoId][mes]
  return metaBase * fatorSazonalidade
}
```

### 6.3 Dependências Entre Produtos

```javascript
const dependenciasProdutos = {
  'prod-003': {
    // Mentoria Premium depende de pipeline do Curso Avançado
    dependeDe: 'prod-001',
    
    // 80% dos alunos de Mentoria vêm do Curso Avançado
    percentualDependencia: 0.80,
    
    // Pipeline de 90 dias
    leadTime: 90,
    
    // Calculadora de meta viável
    calcularMetaViavel: function(vendasProdutoDependente, mes) {
      const mesOrigem = mes - 3 // 90 dias atrás
      const vendasOrigem = obterVendasProduto('prod-001', mesOrigem)
      const pipelineDisponivel = vendasOrigem * this.percentualDependencia
      
      return {
        metaViavel: pipelineDisponivel * configuracaoProduto['prod-003'].ticketBruto,
        pipelineDisponivel,
        restricao: pipelineDisponivel < vendasProdutoDependente
      }
    }
  }
}
```

---

## 7. Interface SaaS para Multi-Produto

### 7.1 Tela de Configuração de Produtos

```
┌─────────────────────────────────────────────────────────────┐
│ Produtos & Metas                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Meta Global: R$ 10.000.000,00                              │
│                                                             │
│ [+ Adicionar Produto]                                       │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 📦 Curso Avançado de Vendas                     │ [⚙️] [❌] │
│ │ Share: 40% → R$ 4.000.000,00                    │        │
│ │ Ticket: R$ 3.997 | Estratégia: Perpétuo         │        │
│ │ Time: Compartilhado | OTE: Padrão               │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 📚 Curso Básico de Prospecção                   │ [⚙️] [❌] │
│ │ Share: 30% → R$ 3.000.000,00                    │        │
│ │ Ticket: R$ 997 | Estratégia: Perpétuo           │        │
│ │ Time: Compartilhado | OTE: Padrão               │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 🎯 Mentoria Premium                              │ [⚙️] [❌] │
│ │ Share: 20% → R$ 2.000.000,00                    │        │
│ │ Ticket: R$ 12.997 | Estratégia: Lançamentos     │        │
│ │ Time: Dedicado (Closer) | OTE: High-Ticket      │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 📖 Ebook Gatilhos Mentais                       │ [⚙️] [❌] │
│ │ Share: 10% → R$ 1.000.000,00                    │        │
│ │ Ticket: R$ 47 | Estratégia: Self-Service        │        │
│ │ Time: Automação | OTE: N/A                      │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ [Validar Distribuição] [Salvar Alterações]                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Dashboard Multi-Produto

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard - Janeiro 2026                       [Filtros ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ VISÃO CONSOLIDADA                                           │
│ ┌──────────────┬──────────────┬──────────────┬──────────┐  │
│ │ Meta Total   │ Realizado    │ Ating.       │ CAC      │  │
│ │ R$ 833.333   │ R$ 745.200   │ 89.4%        │ 18.5%    │  │
│ └──────────────┴──────────────┴──────────────┴──────────┘  │
│                                                             │
│ POR PRODUTO                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Curso Avançado       R$ 333.333 │ ████████░░ 82%       │ │
│ │ Curso Básico         R$ 250.000 │ ██████████ 95%       │ │
│ │ Mentoria Premium     R$ 166.667 │ ███████░░░ 75%       │ │
│ │ Ebook                R$ 83.333  │ ██████████ 102%      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ESTRUTURA DE TIME CONSOLIDADA                               │
│ Vendedores: 18 | Supervisores: 4 | Coordenadores: 2        │
│ Closers: 5 | Setters: 15                                    │
│                                                             │
│ MÉTRICAS COMPARATIVAS                                       │
│ ┌──────────────┬─────────┬─────────┬─────────┬──────────┐  │
│ │ Produto      │ CAC     │ ROI     │ Conv%   │ Efic.    │  │
│ ├──────────────┼─────────┼─────────┼─────────┼──────────┤  │
│ │ Mentoria     │ 11.2%   │ 7.9x    │ 25.0%   │ ⭐⭐⭐⭐⭐ │  │
│ │ Curso Avanç. │ 17.5%   │ 4.7x    │ 8.0%    │ ⭐⭐⭐⭐   │  │
│ │ Curso Básico │ 22.3%   │ 3.5x    │ 12.0%   │ ⭐⭐⭐     │  │
│ │ Ebook        │ 2.1%    │ 46.6x   │ 35.0%   │ ⭐⭐⭐⭐⭐ │  │
│ └──────────────┴─────────┴─────────┴─────────┴──────────┘  │
│                                                             │
│ [Ver Detalhes por Produto] [Simulador] [Exportar]          │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Simulador Multi-Produto

```
┌─────────────────────────────────────────────────────────────┐
│ Simulador: E Se...                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Cenário: Aumentar investimento em Mentoria Premium         │
│                                                             │
│ AJUSTES:                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Produto: [Mentoria Premium ▼]                           │ │
│ │                                                          │ │
│ │ Share da Meta Global:                                    │ │
│ │ 20% ░░░░░░████░░░░░░ 30% (+10pp)                        │ │
│ │                                                          │ │
│ │ Onde tirar os 10pp?                                      │ │
│ │ ☑ Curso Básico: -5pp (30% → 25%)                        │ │
│ │ ☑ Ebook: -5pp (10% → 5%)                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ IMPACTO PROJETADO:                                          │
│ ┌──────────────┬──────────────┬──────────────┬──────────┐  │
│ │ Métrica      │ Antes        │ Depois       │ Δ        │  │
│ ├──────────────┼──────────────┼──────────────┼──────────┤  │
│ │ Receita      │ R$ 10.000k   │ R$ 10.000k   │ --       │  │
│ │ CAC Médio    │ 18.5%        │ 16.2%        │ -2.3pp ✓ │  │
│ │ ROI Médio    │ 4.4x         │ 5.1x         │ +0.7x ✓  │  │
│ │ Closers      │ 5            │ 8            │ +3       │  │
│ │ Vendedores   │ 18           │ 15           │ -3       │  │
│ │ Folha Total  │ R$ 1.850k    │ R$ 1.620k    │ -12.4% ✓ │  │
│ └──────────────┴──────────────┴──────────────┴──────────┘  │
│                                                             │
│ ⚠️ ATENÇÃO:                                                 │
│ • Mentoria depende de pipeline do Curso Avançado           │
│ • Reduzir Curso Básico pode afetar funil de entrada        │
│                                                             │
│ [Descartar] [Aplicar Simulação] [Salvar como Cenário]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Fluxo de Implementação Multi-Produto

### Fase 1: Core Multi-Produto
- [ ] CRUD de produtos (nome, ticket, share)
- [ ] Distribuição de meta global entre produtos
- [ ] Configuração básica por produto (estratégia, conversão)
- [ ] Dashboard consolidado simples

### Fase 2: Cascateamento Avançado
- [ ] Distribuição mensal diferenciada por produto
- [ ] Sazonalidade por produto
- [ ] Cálculo de OTEs específicos por produto
- [ ] Comparativo entre produtos

### Fase 3: Estrutura de Time
- [ ] Time compartilhado vs dedicado
- [ ] Modelos diferentes (Vendedor vs Closer)
- [ ] Consolidação de estrutura total
- [ ] Folha de pagamento multi-produto

### Fase 4: Recursos Avançados
- [ ] Cross-sell e upsell entre produtos
- [ ] Dependências entre produtos
- [ ] Simulador multi-produto
- [ ] Recomendações de otimização de mix

---

## 9. Validações Multi-Produto

```javascript
function validarConfiguracaoMultiProduto(produtos) {
  const erros = []
  const avisos = []
  
  // 1. Share total deve somar 100%
  const shareTotal = produtos.reduce((acc, p) => acc + p.shareMetaGlobal, 0)
  if (Math.abs(shareTotal - 1.0) > 0.001) {
    erros.push(`Share total é ${shareTotal * 100}%, deve ser 100%`)
  }
  
  // 2. Produtos duplicados
  const nomes = produtos.map(p => p.nome)
  const duplicados = nomes.filter((n, i) => nomes.indexOf(n) !== i)
  if (duplicados.length > 0) {
    erros.push(`Produtos duplicados: ${duplicados.join(', ')}`)
  }
  
  // 3. Validar dependências
  for (const produto of produtos) {
    if (produto.dependeDe) {
      const dependencia = produtos.find(p => p.id === produto.dependeDe)
      if (!dependencia) {
        erros.push(`${produto.nome} depende de produto inexistente`)
      }
      if (!dependencia.ativo) {
        avisos.push(`${produto.nome} depende de produto inativo`)
      }
    }
  }
  
  // 4. Tickets muito próximos (pode confundir)
  const tickets = produtos.map(p => p.ticketBruto).sort((a, b) => a - b)
  for (let i = 1; i < tickets.length; i++) {
    const diferenca = tickets[i] / tickets[i-1]
    if (diferenca < 1.5) {
      avisos.push(`Tickets muito próximos: R$ ${tickets[i-1]} e R$ ${tickets[i]}`)
    }
  }
  
  // 5. Time compartilhado com produtos muito diferentes
  const compartilhados = produtos.filter(p => p.timeCompartilhado)
  if (compartilhados.length > 0) {
    const ticketMax = Math.max(...compartilhados.map(p => p.ticketBruto))
    const ticketMin = Math.min(...compartilhados.map(p => p.ticketBruto))
    if (ticketMax / ticketMin > 3) {
      avisos.push('Time compartilhado com produtos de tickets muito diferentes pode ser ineficiente')
    }
  }
  
  return { erros, avisos, valido: erros.length === 0 }
}
```

---

## 10. Exemplo Completo: Processando Janeiro

```javascript
function processarJaneiroMultiProduto() {
  const metaGlobal = 10000000
  const metaMensal = metaGlobal / 12 // R$ 833.333
  
  // Produto A: Curso Avançado (40%)
  const prodA = {
    meta: metaMensal * 0.40, // R$ 333.333
    sazonalidade: 1.0,
    metaAjustada: 333333,
    estrategia: 'perpetuo',
    shareComercial: 0.70,
    metaComercial: 233333, // 70% da meta
    ticketRecebido: 3200,
    
    otes: {
      '1.4x': { faturamento: 326666, vendas: 102, sqls: 1275, time: { vendedores: 3 } },
      '1.2x': { faturamento: 279999, vendas: 87, sqls: 1087, time: { vendedores: 2 } },
      '1.0x': { faturamento: 233333, vendas: 73, sqls: 913, time: { vendedores: 2 } },
      '0.7x': { faturamento: 163333, vendas: 51, sqls: 638, time: { vendedores: 2 } },
      '0.5x': { faturamento: 116666, vendas: 36, sqls: 450, time: { vendedores: 1 } }
    }
  }
  
  // Produto B: Curso Básico (30%)
  const prodB = {
    meta: metaMensal * 0.30, // R$ 250.000
    sazonalidade: 1.5, // Janeiro é pico
    metaAjustada: 375000,
    estrategia: 'perpetuo',
    shareComercial: 0.50,
    metaComercial: 187500,
    ticketRecebido: 680,
    
    otes: {
      '1.4x': { faturamento: 262500, vendas: 386, sqls: 3217, time: { vendedores: 6 } },
      // ... outros níveis
    }
  }
  
  // Produto C: Mentoria Premium (20%)
  const prodC = {
    meta: metaMensal * 0.20, // R$ 166.667
    sazonalidade: 3.0, // Janeiro é lançamento
    metaAjustada: 500000,
    estrategia: 'lancamento',
    shareComercial: 0.90,
    metaComercial: 450000,
    ticketRecebido: 12000,
    
    otes: {
      '1.4x': { faturamento: 630000, vendas: 52, sqls: 208, time: { closers: 3 } },
      // ... outros níveis
    }
  }
  
  // Produto D: Ebook (10%)
  const prodD = {
    meta: metaMensal * 0.10, // R$ 83.333
    estrategia: 'self-service',
    shareComercial: 0, // 100% automação
    custoFixo: 2000 // Plataforma
  }
  
  // Consolidação
  const consolidado = {
    metaTotal: metaMensal,
    faturamento: prodA.otes['1.0x'].faturamento + 
                 prodB.otes['1.0x'].faturamento + 
                 prodC.otes['1.0x'].faturamento + 
                 prodD.meta,
    
    time: {
      vendedores: prodA.otes['1.0x'].time.vendedores + 
                  prodB.otes['1.0x'].time.vendedores,
      closers: prodC.otes['1.0x'].time.closers,
      total: 4 + 3 // 4 vendedores + 3 closers
    },
    
    folha: calcularFolhaConsolidada(prodA, prodB, prodC, prodD),
    cac: calcularCACConsolidado(),
    roi: calcularROIConsolidado()
  }
  
  return consolidado
}
```

---

**Conclusão:**

O sistema multi-produto adiciona uma camada de complexidade, mas permite:
1. **Otimização de Mix**: Identificar produtos mais lucrativos
2. **Alocação Inteligente**: Distribuir recursos onde há melhor ROI
3. **Funis Completos**: Modelar cross-sell e upsell
4. **Especialização**: Times dedicados para high-ticket vs volume

A base de cascateamento continua a mesma, apenas multiplica-se por produto e consolida-se no final.
