#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORRIGINDO TESTE 8 DIMENSÕES DE VALORES\n')

// Scale descriptors for 0-5 rating
const SCALE_0_TO_5 = [
  { value: 0, label: '0 - Nada relevante', description: 'Este valor não é relevante para mim' },
  { value: 1, label: '1 - Pouco relevante', description: 'Este valor tem pouca relevância' },
  { value: 2, label: '2 - Razoavelmente relevante', description: 'Este valor tem relevância razoável' },
  { value: 3, label: '3 - Relevante', description: 'Este valor é relevante para mim' },
  { value: 4, label: '4 - Muito relevante', description: 'Este valor é muito relevante' },
  { value: 5, label: '5 - Extremamente relevante', description: 'Este valor é extremamente importante para mim' }
]

// Load the 8D Values data from documentation
function extractJSON(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const match = content.match(/```json\n([\s\S]*?)\n```/)
  if (!match) {
    throw new Error(`No JSON found in ${filepath}`)
  }
  return JSON.parse(match[1])
}

const valuesData = extractJSON('./docs/roles_assessments/teste_8_dimensoes_valores.md')

async function fixValues8D() {
  console.log('Criando estrutura corrigida do 8D Values...\n')

  // Get current structure to see what we have
  const { data: current } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', 'values_8d')
    .single()

  if (!current) {
    console.error('❌ 8D Values structure not found')
    process.exit(1)
  }

  // Build categories from documentation
  const categories = valuesData.dimensions.map((dim, dimIdx) => {
    const questions = dim.questions.map((questionText, qIdx) => ({
      id: `${dim.id}_q${qIdx + 1}`,
      text: questionText,
      type: 'scale',
      order: qIdx,
      required: true,
      scale_descriptors: SCALE_0_TO_5,
      metadata: {
        dimension: dim.id,
        dimension_name: dim.name
      }
    }))

    return {
      id: dim.id,
      name: dim.name,
      description: 'Avalie a relevância de cada valor de 0 a 5',
      order: dimIdx,
      questions
    }
  })

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0)

  const structure = {
    metadata: {
      name: valuesData.title,
      description: valuesData.description,
      instructions: 'Avalie a relevância de cada valor para você: 0 = Nada relevante, 1 = Pouco relevante, 2 = Razoavelmente relevante, 3 = Relevante, 4 = Muito relevante, 5 = Extremamente relevante. Este mapa ajuda a identificar suas prioridades e valores pessoais.',
      estimated_duration_minutes: 30
    },
    categories,
    scoring: {
      method: 'average',
      category_weights: {}, // No weights, each dimension is independent
      scale: {
        min: 0,
        max: 5,
        labels: {
          min: 'Nada relevante',
          max: 'Extremamente relevante'
        }
      },
      ranges: [] // Results are shown as radar chart, not ranges
    }
  }

  console.log(`✅ Estrutura criada:`)
  console.log(`   - 8 dimensões`)
  console.log(`   - ${totalQuestions} questões total`)
  console.log(`   - Escala 0-5 (corrigida de 1-5)`)
  console.log(`   - Scoring: average per dimension`)

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'values_8d')

  if (error) {
    console.error('❌ Erro ao atualizar 8D Values:', error)
    process.exit(1)
  }

  console.log('\n✅ 8 Dimensões de Valores atualizado com sucesso!')
  console.log('\n📊 Visualização sugerida:')
  console.log('   - Gráfico radar com 8 eixos')
  console.log('   - Score normalizado: (média / 5) * 100 = 0-100 por dimensão')
  console.log('   - Destacar top 3 e bottom 3 dimensões')
}

fixValues8D()
