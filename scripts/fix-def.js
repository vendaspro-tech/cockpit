#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORRIGINDO ESTRUTURA DO TESTE DEF\n')

// Scale descriptors for 0-3 rating (CORRECT scale)
const SCALE_0_TO_3 = [
  { value: 0, label: '0 - Não fez', description: 'Não realizou o critério' },
  { value: 1, label: '1 - Insatisfatório', description: 'Realizou de forma inadequada' },
  { value: 2, label: '2 - Adequado', description: 'Realizou adequadamente' },
  { value: 3, label: '3 - Excelente', description: 'Realizou de forma excepcional' }
]

// DEF Categories with all criteria from documentation
const DEF_STRUCTURE = {
  whatsapp: {
    name: 'Whatsapp',
    criteria: [
      'Recuo Estratégico',
      'Usou Framework de Perguntas?',
      'Jab, Jab, Jab, Direto',
      'Áudio',
      'Agendamento',
      'Cumprimento do Agendamento',
      'Explicação do porquê da ligação',
      'SLA'
    ]
  },
  descoberta: {
    name: 'Descoberta',
    criteria: [
      'Recuo Estratégico + Parafrasear',
      'Perguntas de Situação',
      'Perguntas de Motivação',
      'Perguntas de Impeditivo',
      'Usou Framework de Perguntas?',
      'Investigação de Red Flag(s)',
      'Aumento de Limiar de Dor',
      'Extração de Dor/Desejo/Objetivo Principal',
      'Condução natural (diálogo)',
      'Capacidade de se conectar',
      'Escuta Ativa',
      'Acordo de Sinceridade',
      'Não Vendeu na Descoberta'
    ]
  },
  encantamento: {
    name: 'Encantamento',
    criteria: [
      'Pergunta de Abertura',
      'Organização por Tópicos',
      'CTA por tópico',
      'Variação de CTA',
      'Uso de Analogias',
      'Uso de Argumentos Racionais',
      'Uso de Argumentos Emocionais',
      'Adaptação do discurso à dor',
      'Pergunta de Verificação',
      'Isolamento de Variáveis',
      'Criação do Plano de Ação',
      'Lead conhece o Expert?'
    ]
  },
  fechamento: {
    name: 'Fechamento',
    criteria: [
      'Uso de Ancoragem',
      'CTA de Preço',
      'Fechamento Presumido',
      'Fechamento Acompanhado'
    ]
  },
  objecoes: {
    name: 'Contorno de Objeções',
    criteria: [
      'Mostrou Empatia',
      'Alteração de Voz',
      'Uso de Perguntas Abertas e Reflexivas',
      'Argumentos de Contorno'
    ]
  }
}

async function fixDEF() {
  console.log('Criando estrutura corrigida do DEF...\n')

  // First, get current structure to preserve any existing data
  const { data: current } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', 'def_method')
    .single()

  if (!current) {
    console.error('❌ DEF structure not found')
    process.exit(1)
  }

  const categories = []
  let catOrder = 0

  // Build categories with proper scale_descriptors
  for (const [catId, catData] of Object.entries(DEF_STRUCTURE)) {
    const questions = catData.criteria.map((criterion, idx) => ({
      id: `${catId}_${idx + 1}`,
      text: criterion,
      type: 'scale',
      order: idx,
      required: true,
      scale_descriptors: SCALE_0_TO_3,
      metadata: {
        category: catId,
        criterion: criterion
      }
    }))

    categories.push({
      id: catId,
      name: catData.name,
      description: `Avalie cada critério de 0 a 3`,
      order: catOrder++,
      questions
    })
  }

  const structure = {
    metadata: {
      name: 'Método DEF - Avaliação de Call',
      description: 'Matriz de análise de calls de vendas baseada no Método DEF. Avalie cada critério de 0 a 3.',
      instructions: 'Avalie cada critério da call de vendas: 0 = Não fez, 1 = Insatisfatório, 2 = Adequado, 3 = Excelente. Esta avaliação permite acompanhar a evolução do vendedor ao longo do tempo.',
      estimated_duration_minutes: 15
    },
    categories,
    scoring: {
      method: 'sum',
      category_weights: {}, // Equal weight for all categories
      scale: {
        min: 0,
        max: 3,
        labels: {
          min: 'Não fez',
          max: 'Excelente'
        }
      },
      ranges: [] // No global ranges, scoring is per-category
    }
  }

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0)
  console.log(`✅ Estrutura criada:`)
  console.log(`   - 5 categorias`)
  console.log(`   - ${totalQuestions} critérios total`)
  console.log(`   - Escala 0-3 (corrigida de 1-3)`)

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'def_method')

  if (error) {
    console.error('❌ Erro ao atualizar DEF:', error)
    process.exit(1)
  }

  console.log('\n✅ DEF atualizado com sucesso!')
  console.log('\n⚠️  PENDENTE (requer mudanças no metamodelo):')
  console.log('    - Comentários padrão selecionáveis por categoria')
  console.log('    - Campo de comentário livre adicional')
}

fixDEF()
