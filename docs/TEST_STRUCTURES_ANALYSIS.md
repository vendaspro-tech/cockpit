# Análise e Melhorias do Sistema de Test Structures

## Problemas Identificados

### 1. **Preview mostra "Tipo de questão não suportado"**
**Causa Raiz**: As questões no banco de dados provavelmente têm tipos não mapeados no enum `QuestionType`.

**Diagnóstico**:
- Adicionado logging detalhado no preview que mostrará no console qual tipo está sendo usado
- Mensagem de erro agora exibe o tipo recebido e lista os tipos suportados

**Tipos Suportados Atualmente**:
- `single_choice` - Radio buttons
- `multiple_choice` - Checkboxes
- `scale` - Likert scale (slider)
- `text` - Campo de texto curto
- `textarea` - Campo de texto longo
- `number` - Campo numérico

**Ação Necessária**: Verificar no console do navegador qual tipo está sendo retornado pelas questões existentes.

---

### 2. **Falta Suporte para Comentários por Categoria (DEF)**

**Problema**: O teste DEF e outros possuem campos de comentário vinculados a categorias ou respostas específicas, o que não está contemplado no metamodelo atual.

**Proposta de Solução**:

#### A. Adicionar campo de comentário opcional nas questões

```typescript
interface Question {
  id: string
  text: string
  type: QuestionType
  order: number
  required?: boolean
  options?: QuestionOption[]

  // NOVO: Suporte para comentários
  comment?: {
    enabled: boolean
    label?: string  // "Justifique sua resposta", "Observações", etc.
    placeholder?: string
    required?: boolean
    maxLength?: number
  }

  validation?: QuestionValidation
  metadata?: QuestionMetadata
}
```

#### B. Adicionar comentários por categoria

```typescript
interface Category {
  id: string
  name: string
  description?: string
  order: number
  questions: Question[]

  // NOVO: Comentário da categoria
  categoryComment?: {
    enabled: boolean
    label?: string  // "Observações gerais sobre esta dimensão"
    placeholder?: string
    required?: boolean
    position?: 'before' | 'after'  // Antes ou depois das questões
  }
}
```

---

### 3. **Cálculos de Scoring Não Refletem a Realidade**

**Problemas Identificados**:

#### A. Métodos de Cálculo Limitados
Atualmente temos apenas:
- `sum` - Soma simples
- `weighted_sum` - Soma ponderada por categoria
- `weighted_average` - Média ponderada
- `average` - Média simples

**Necessidades Reais dos Testes**:

1. **DISC**:
   - Não é soma/média
   - Cada questão contribui para 4 perfis (D, I, S, C)
   - Resultado final é o perfil dominante + secundário

2. **DEF (Desempenho, Esforço, Facilidade)**:
   - 3 dimensões independentes
   - Cada dimensão tem score próprio
   - Matriz 3x3 com 9 possíveis resultados
   - Necessita justificativas por dimensão

3. **Senioridade**:
   - Baseado em competências
   - Cada competência tem peso diferente
   - Ranges definem níveis (Júnior, Pleno, Sênior)
   - Considera também tempo de experiência

4. **8 Dimensões de Valores**:
   - 8 escalas independentes
   - Cada escala é um espectro (ex: Tradição vs Inovação)
   - Resultado é um perfil de valores, não um score único

#### B. Proposta: Sistema de Scoring Flexível

```typescript
type ScoringMethod =
  | 'sum'
  | 'average'
  | 'weighted_sum'
  | 'weighted_average'
  | 'profile'        // NOVO: Para DISC, 8D
  | 'matrix'         // NOVO: Para DEF (3x3)
  | 'competency'     // NOVO: Para Senioridade
  | 'custom'         // NOVO: Script customizado

interface ScoringConfig {
  method: ScoringMethod

  // Para métodos existentes
  category_weights?: Record<string, number>
  scale?: {
    min: number
    max: number
    labels?: { min?: string; max?: string }
  }
  ranges?: ScoringRange[]

  // NOVO: Para método 'profile' (DISC, 8D)
  profiles?: {
    id: string
    name: string
    dimensions: {
      id: string
      name: string
      questions: string[]  // IDs das questões que contribuem
      weights?: Record<string, number>  // Peso de cada questão
    }[]
  }[]

  // NOVO: Para método 'matrix' (DEF)
  matrix?: {
    dimensions: {
      id: string  // 'desempenho', 'esforco', 'facilidade'
      name: string
      questions: string[]
      scale: { min: number; max: number }
    }[]
    results: {
      coordinates: Record<string, number>  // {desempenho: 3, esforco: 2, facilidade: 3}
      label: string  // "Alto Potencial", "Desafiador", etc.
      description: string
    }[]
  }

  // NOVO: Para método 'competency' (Senioridade)
  competencies?: {
    id: string
    name: string
    weight: number
    questions: string[]
    requiredLevel?: number  // Nível mínimo necessário
  }[]

  // NOVO: Para método 'custom'
  customScript?: {
    calculate: string  // Função JavaScript como string
    validate: string   // Validação customizada
  }
}
```

---

### 4. **Falta de Validação de Respostas por Tipo de Teste**

Cada teste tem regras específicas:

```typescript
interface TestMetadata {
  name: string
  description: string
  instructions: string
  applicable_job_titles?: string[]
  estimated_duration_minutes?: number

  // NOVO: Validações e comportamentos
  validation?: {
    requireAllQuestions?: boolean  // Todas obrigatórias por padrão
    allowSkip?: boolean            // Permite pular questões
    showProgress?: boolean         // Mostra barra de progresso
    randomizeQuestions?: boolean   // Embaralha ordem
    randomizeOptions?: boolean     // Embaralha opções
  }

  // NOVO: Configuração de exibição
  display?: {
    questionsPerPage?: number      // Quantas questões por página
    showCategoryHeaders?: boolean  // Mostra título das categorias
    allowReview?: boolean          // Permite revisar antes de enviar
    showResultsImmediately?: boolean
  }
}
```

---

## Plano de Implementação

### Fase 1: Diagnóstico (ATUAL)
- ✅ Melhorar mensagens de erro no preview
- ✅ Adicionar logging detalhado
- 🔄 Identificar tipos de questão usados nos testes existentes
- 🔄 Documentar necessidades específicas de cada teste

### Fase 2: Expansão do Metamodelo
1. Adicionar suporte para comentários
2. Adicionar novos tipos de scoring
3. Adicionar validações por teste
4. Atualizar migrations

### Fase 3: Migração de Dados
1. Criar scripts de migração para testes existentes
2. Validar integridade dos dados
3. Testar scoring com dados reais

### Fase 4: UI/UX
1. Atualizar formulários do editor
2. Adicionar configuração de comentários
3. Melhorar preview para mostrar comentários
4. Adicionar wizard para tipos de scoring específicos

---

## Tipos de Questão Personalizados Necessários

Baseado nos testes, precisamos adicionar:

```typescript
export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'scale'
  | 'text'
  | 'textarea'
  | 'number'
  | 'likert'           // NOVO: Escala Likert com labels
  | 'rating_stars'     // NOVO: Avaliação com estrelas
  | 'slider_range'     // NOVO: Slider com range
  | 'matrix_single'    // NOVO: Matriz de escolha única
  | 'matrix_multiple'  // NOVO: Matriz de múltipla escolha
  | 'ranking'          // NOVO: Ordenar opções por preferência
  | 'semantic_diff'    // NOVO: Diferencial semântico (ex: Tradição <---> Inovação)
```

---

## Próximos Passos Recomendados

1. **URGENTE**: Verificar no console qual tipo de questão está sendo retornado
2. **CURTO PRAZO**: Revisar cada teste (DISC, DEF, Senioridade, etc.) e documentar:
   - Tipos de questão usados
   - Como o scoring é calculado
   - Quais campos de comentário são necessários
3. **MÉDIO PRAZO**: Implementar suporte para comentários
4. **LONGO PRAZO**: Refatorar sistema de scoring para suportar métodos personalizados

---

## Questões para o Product Owner

1. Qual a prioridade entre os testes? Começar pelo DEF?
2. Os testes existentes no banco têm dados ou são apenas estruturas?
3. Há documentação de como cada teste deve calcular o resultado?
4. Os comentários devem ser opcionais ou obrigatórios por teste?
5. Precisa de aprovação para alterar o metamodelo de forma breaking change?
