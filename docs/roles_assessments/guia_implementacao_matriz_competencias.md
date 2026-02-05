# Guia de Implementação - Job Descriptions no SaaS de Sales Enablement

## 🎯 Visão Geral da Implementação

Este documento apresenta como estruturar e implementar as job descriptions em um SaaS de Sales Enablement, otimizando para uso prático pela equipe comercial.

---

## 📱 Arquitetura da Interface

### 1. Estrutura de Navegação Recomendada

```
📂 Sales Playbook
├── 👥 Estrutura de Cargos
│   ├── 🔵 Pré-vendas & Prospecção
│   │   ├── SDR
│   │   └── Social Seller
│   ├── 💰 Vendas
│   │   ├── Inside Sales
│   │   └── Closer
│   ├── 👔 Liderança
│   │   ├── Supervisor Comercial
│   │   ├── Coordenador Comercial
│   │   └── Gerente Comercial
│   ├── ⚙️ Operações
│   │   ├── Sales Operations
│   │   └── Sales Enablement
│   └── 🤝 Pós-venda
│       └── Customer Success
├── 📊 Comparativo de Cargos
├── 💼 Plano de Carreira
└── 📈 Matriz de Competências
```

---

## 🖥️ Proposta de Telas

### Tela 1: Dashboard Principal - "Career Path"

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  🎯 Seu Cargo Atual: CLOSER (Pleno)                     │
│  Próxima Progressão: Closer Sênior ou Supervisor        │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Seu Nível  │  │ Próximo    │  │ Meta Final │       │
│  │            │  │ Nível      │  │            │       │
│  │  Closer    │→ │  Closer    │→ │ Supervisor │       │
│  │  Pleno     │  │  Sênior    │  │  Comercial │       │
│  │            │  │            │  │            │       │
│  │ R$ 3.500   │  │ R$ 4.000   │  │ R$ 5.000   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                          │
│  📊 Seu Progresso: 67% completo                         │
│  ━━━━━━━━━━━━━━━━━━░░░░░░░                           │
│                                                          │
│  ✅ Competências Desenvolvidas: 8/12                    │
│  📚 Cursos Pendentes: 1                                 │
│  🎯 KPIs no Alvo: 4/6                                   │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Visualização do cargo atual e progressão sugerida
- Comparativo de remuneração entre níveis
- Status de competências e requisitos
- Gamificação da evolução profissional

---

### Tela 2: Detalhamento do Cargo (Card Expandido)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  CLOSER                                [⭐ Favoritar]     │
│  Setor: Comercial | Subordinação: Supervisor Comercial  │
│                                                           │
│  📋 Abas:                                                │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │Visão│ KPIs│Ativi│Compe│Remu │Carre│                │
│  │Geral│     │dades│tênc.│neraç│ira  │                │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                │
│                                                           │
│  🎯 MISSÃO DO CARGO                                      │
│  Transformar leads qualificados em clientes por meio...  │
│                                                           │
│  📊 PRINCIPAIS KPIs (Expandir ▼)                         │
│  • Taxa de fechamento: Meta 15% | Seu: 12% 🔴          │
│  • Receita mensal: Meta R$ 50k | Seu: R$ 48k 🟡        │
│  • Ticket médio: Meta R$ 3k | Seu: R$ 3.2k ✅          │
│                                                           │
│  🔧 ATIVIDADES PRINCIPAIS (15) [Ver todas ▼]            │
│  1. ✅ Conduzir calls de vendas 1:1                      │
│  2. ✅ Aplicar vendas consultivas                        │
│  3. 🔲 Seguir o método de vendas da empresa             │
│  ...                                                      │
│                                                           │
│  🎓 COMPETÊNCIAS NECESSÁRIAS                             │
│  ┌────────────────────────────────────┐                 │
│  │ Coachability          ████░░ 80%   │                 │
│  │ Comunicação           █████░ 100%  │                 │
│  │ Resiliência           ███░░░ 60%   │                 │
│  │ Gestão do Tempo       ████░░ 75%   │                 │
│  └────────────────────────────────────┘                 │
│                                                           │
│  💰 REMUNERAÇÃO [🔒 Ver Detalhes]                        │
│  Júnior: R$ 3.000 | Pleno: R$ 3.500 | Sênior: R$ 4.000 │
│                                                           │
│  📚 CURSOS OBRIGATÓRIOS                                  │
│  • Formação Closer Pro [✅ Concluído]                    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Recursos Interativos:**
- Toggle entre abas para navegação rápida
- Checkboxes para marcar atividades realizadas
- Progress bars para competências
- Comparação de KPIs pessoais vs metas
- Links diretos para cursos/treinamentos

---

### Tela 3: Comparativo de Cargos (Matriz)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  📊 COMPARATIVO DE CARGOS                                  │
│                                                             │
│  Filtros: [Pré-vendas ▼] [Júnior ▼] [📍 Todos os Cargos]  │
│                                                             │
│  ┌────────┬────────┬────────┬────────┬────────┬─────────┐ │
│  │ Cargo  │ Nível  │ Fixo   │Variável│ Total  │ Ação    │ │
│  ├────────┼────────┼────────┼────────┼────────┼─────────┤ │
│  │ SDR    │ Júnior │ 1.800  │ Comiss.│~3.000  │[Ver +]  │ │
│  │        │ Pleno  │ 2.000  │ Comiss.│~3.500  │[Ver +]  │ │
│  │        │ Sênior │ 2.700  │ Comiss.│~5.000  │[Ver +]  │ │
│  ├────────┼────────┼────────┼────────┼────────┼─────────┤ │
│  │Social  │ Júnior │ 2.000  │ Comiss.│~3.500  │[Ver +]  │ │
│  │Seller  │ Pleno  │ 2.500  │ Comiss.│~4.500  │[Ver +]  │ │
│  │        │ Sênior │ 3.000  │ Comiss.│~6.000  │[Ver +]  │ │
│  └────────┴────────┴────────┴────────┴────────┴─────────┘ │
│                                                             │
│  📈 Visualização: [Tabela] [Gráfico] [Organograma]        │
└────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Ordenação por qualquer coluna
- Filtros dinâmicos (cargo, nível, área)
- Exportação para PDF/Excel
- Comparação lado a lado (até 3 cargos)

---

### Tela 4: Plano de Carreira (Visão de Jornada)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  🗺️ SUA JORNADA DE CARREIRA                             │
│                                                          │
│  Início → SDR Júnior (12 meses)                         │
│    ↓                                                     │
│  SDR Pleno (18 meses)                                   │
│    ↓                                                     │
│  Bifurcação:                                            │
│  ┌─────────────────┬─────────────────┐                 │
│  │ Path 1:         │ Path 2:         │                 │
│  │ SDR Sênior      │ Closer Júnior   │                 │
│  │ (12 meses)      │ (24 meses)      │                 │
│  │      ↓          │      ↓          │                 │
│  │ Supervisor      │ Closer Pleno    │                 │
│  │ Comercial       │ (18 meses)      │                 │
│  │      ↓          │      ↓          │                 │
│  │ Coordenador     │ Closer Sênior   │                 │
│  │ Comercial       │ / Supervisor    │                 │
│  └─────────────────┴─────────────────┘                 │
│                                                          │
│  💡 Recomendação baseada no seu perfil:                 │
│  "Seu forte em conversão sugere progressão para Closer" │
│                                                          │
│  ✅ Pré-requisitos para próximo nível:                  │
│  • 6 meses no cargo atual (faltam 2 meses)             │
│  • Taxa de conversão > 12% (atual: 11.8%) 🔴           │
│  • Certificação Closer Pro ✅                           │
│  • Feedback positivo 360° (agendar)                    │
└─────────────────────────────────────────────────────────┘
```

**Recursos:**
- Timeline visual da progressão
- Requisitos automáticos baseados em KPIs
- Sugestão de path personalizada
- Alertas de pré-requisitos pendentes

---

## 💡 Sobre a Inclusão de Faixas Salariais

### ✅ **SIM, vale muito a pena incluir as faixas salariais. Aqui está o porquê:**

#### Benefícios Estratégicos:

1. **Transparência Salarial = Retenção**
   - Vendedores sabem exatamente quanto podem ganhar
   - Reduz churn causado por "surpresas" salariais
   - Atrai candidatos qualificados com expectativas alinhadas

2. **Gamificação Intrínseca**
   - Meta financeira clara estimula desempenho
   - Cria senso de progressão tangível
   - Facilita conversas de promoção/desenvolvimento

3. **Redução de Atrito em RH**
   - Menos negociações por falta de referência
   - Standardização de faixas facilita budgeting
   - Diminui conflitos internos sobre "quem ganha mais"

4. **Competitividade no Mercado**
   - Empresas modernas (Netflix, Buffer) usam transparência
   - Sinaliza confiança e cultura aberta
   - Fortalece employer branding

#### ⚠️ Considerações de Implementação:

**Opção 1: Visibilidade Completa**
- Todos veem todas as faixas
- Máxima transparência
- Requer cultura organizacional madura

**Opção 2: Visibilidade Progressiva (Recomendado)**
```
Seu Cargo: Visível ✅
Cargo Anterior: Visível ✅
Próximo Cargo: Visível ✅
Demais Cargos: 🔒 Solicitar acesso ao RH
```

**Opção 3: Faixas Relativas**
- Mostrar em % ou multiplicadores
- "Sênior ganha 33% a mais que Pleno"
- Menos transparente, mas mais flexível

#### Formato Sugerido para Exibição:

```
💰 REMUNERAÇÃO

┌──────────────────────────────────────────────┐
│ Nível    │ Fixo Base │ OTE (On Target)      │
├──────────┼───────────┼──────────────────────┤
│ Júnior   │ R$ 3.000  │ R$ 5.000 - R$ 7.000 │
│ Pleno    │ R$ 3.500  │ R$ 6.000 - R$ 9.000 │
│ Sênior   │ R$ 4.000  │ R$ 8.000 - R$ 12.000│
└──────────┴───────────┴──────────────────────┘

📊 Componentes Variáveis:
• Comissão sobre vendas: 5-10% do valor fechado
• Bônus por meta excedida: até R$ 2.000/mês
• Acelerador trimestral: 1.5x após 120% de meta

💡 Top Performer do mês passado (Closer Pleno):
   Fixo R$ 3.500 + Variável R$ 8.200 = R$ 11.700
```

---

## 🛠️ Features Técnicas Recomendadas

### 1. Sistema de Busca Inteligente
```
🔍 Pesquisar: "Como aumentar taxa de conversão?"

Resultados:
→ Closer - Atividade #5: "Contornar objeções..."
→ Inside Sales - KPI: "Taxa de conversão de leads"
→ Sales Enablement - Material: "Playbook de Objeções"
```

### 2. Comparador de Cargos (Side-by-Side)
```
┌──────────────────┬──────────────────┐
│ Closer Pleno     │ Supervisor       │
├──────────────────┼──────────────────┤
│ R$ 3.500 fixo    │ R$ 5.000 fixo   │
│ Foco: Vendas 1:1 │ Foco: Gestão    │
│ KPI: Conversão   │ KPI: Time       │
│ Requisito: 2 anos│ Requisito: 3 anos│
└──────────────────┴──────────────────┘
```

### 3. Tracking de Progresso Individual
- Checklist de atividades realizadas
- Auto-avaliação de competências
- Upload de certificações
- Registro de KPIs pessoais

### 4. Módulo de Feedback 360°
- Pares avaliam competências
- Líder valida progressão
- Cliente interno dá feedback (ex: SDR avalia qualidade do lead)

### 5. Recomendações Personalizadas
```
🎯 Baseado no seu desempenho:

✅ Você está pronto para:
   • Closer Sênior (90% match)
   
⚠️ Desenvolva ainda:
   • Gestão do Tempo (60% → meta 80%)
   • Curso: Negociação Avançada (pendente)
```

---

## 📊 Exemplo de Dashboard Gerencial (Para Líderes)

```
┌─────────────────────────────────────────────────────────┐
│  📈 VISÃO GERAL DO TIME                                 │
│                                                          │
│  Total de Pessoas: 24                                   │
│  ┌────────────────────────────────────────┐            │
│  │ SDR: 8 pessoas                         │            │
│  │ Closer: 10 pessoas                     │            │
│  │ Inside Sales: 4 pessoas                │            │
│  │ Supervisor: 2 pessoas                  │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  🎯 Prontos para Promoção: 3 pessoas                   │
│  • João Silva (SDR → Closer) - 95% pronto              │
│  • Maria Santos (Closer Pleno → Sênior) - 88%         │
│  • Pedro Costa (Inside → Supervisor) - 92%            │
│                                                          │
│  ⚠️ Em Risco (abaixo de performance): 2 pessoas        │
│  • Ana Lima (Closer Júnior) - KPIs 40%                │
│  • Carlos Souza (SDR Pleno) - KPIs 55%                │
│                                                          │
│  💰 Budget de Promoções próximo trimestre:             │
│  Estimado: R$ 12.500/mês adicional                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Princípios de UX/UI

### 1. **Mobile-First**
- 70% dos vendedores acessam via celular
- Cards colapsáveis para economia de espaço
- Navegação por swipe entre cargos

### 2. **Gamificação**
- Badges por competências dominadas
- Leaderboard de progressão de carreira
- Streak de atualização de KPIs

### 3. **Microinterações**
```
✅ Completou uma atividade → 🎉 +10 pontos XP
📊 KPI batido → 🏆 Badge "Batedor de Metas"
📚 Curso concluído → 🎓 Certificado visual
```

### 4. **Acessibilidade**
- Modo escuro/claro
- Fonte ajustável
- Narração de conteúdo (screen reader)

---

## 🔐 Permissões e Segurança

### Níveis de Acesso:

| Papel | Visualiza | Edita | Aprova Progressão |
|-------|-----------|-------|-------------------|
| Vendedor | Seu cargo + adjacentes | Seu progresso | ❌ |
| Líder | Time completo | ❌ | ✅ |
| RH | Todos | ✅ | ✅ |
| CEO/Diretor | Todos + Analytics | ✅ | ✅ |

---

## 📱 Integrações Sugeridas

1. **CRM (HubSpot/Pipedrive)**
   - Puxa KPIs automaticamente
   - Atualiza progresso em tempo real

2. **LMS (Learning Management System)**
   - Marca cursos como concluídos
   - Sugere próximos treinamentos

3. **Slack/Teams**
   - Notificações de progressão
   - Parabenizações por conquistas

4. **Plataforma de Avaliação (Culture Amp)**
   - Importa feedbacks 360°
   - Calcula score de competências

---

## 📈 Métricas de Sucesso da Ferramenta

1. **Adoção**
   - % de vendedores que acessam 1x/semana
   - Tempo médio na plataforma

2. **Engajamento**
   - Atividades marcadas como concluídas
   - Cursos iniciados via recomendação

3. **Impacto em Negócio**
   - Redução de turnover
   - Tempo médio de promoção
   - Aumento de performance pós-acesso

---

## 🚀 Roadmap de Implementação

### Fase 1 (MVP - 4 semanas)
- ✅ Estrutura de cargos básica
- ✅ Visualização de KPIs
- ✅ Comparativo de cargos

### Fase 2 (8 semanas)
- 🔄 Plano de carreira visual
- 🔄 Tracking de progresso
- 🔄 Sistema de busca

### Fase 3 (12 semanas)
- 🔮 Gamificação completa
- 🔮 Integrações com CRM/LMS
- 🔮 Dashboard gerencial

### Fase 4 (16 semanas)
- 🔮 IA para recomendações
- 🔮 Feedback 360° automatizado
- 🔮 Analytics preditivo

---

## 💼 Recomendação Final

**Para um SaaS de Sales Enablement, a inclusão de faixas salariais é ALTAMENTE RECOMENDADA**, desde que:

1. A empresa tenha cultura de transparência
2. As faixas sejam auditadas e justas
3. Haja governança clara sobre progressão
4. O time de liderança esteja alinhado

**Benefício-chave:** Um vendedor que vê claramente que ir de Closer Pleno (R$ 3.500) para Sênior (R$ 4.000) + variável maior, tem um incentivo CONCRETO para desenvolver as competências listadas. Isso transforma o job description de "documento burocrático" em "ferramenta de motivação".

---

*Documento de Implementação - v1.0 - 18/12/2025*
