#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORRIGINDO TESTES DE SENIORIDADE E LIDERANÇA\n')

// Load JSON data from documentation
function extractJSON(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const match = content.match(/```json\n([\s\S]*?)\n```/)
  if (!match) {
    throw new Error(`No JSON found in ${filepath}`)
  }
  return JSON.parse(match[1])
}

const senioritySellerData = extractJSON('./docs/roles_assessments/avaliacao_senioridade_do_vendedor.md')
const seniorityLeaderData = extractJSON('./docs/roles_assessments/avaliacao_senioridade_lider_comercial.md')
const leadershipStyleData = extractJSON('./docs/roles_assessments/teste_estilo_lideranca.md')

async function fixSenioritySeller() {
  console.log('1️⃣ Corrigindo Senioridade Vendedor...')

  const categories = senioritySellerData.categories.map((cat, catIdx) => ({
    id: cat.id,
    name: cat.name,
    description: 'Avalie cada habilidade de 1 a 3',
    order: catIdx,
    questions: cat.questions.map((q, qIdx) => ({
      id: q.id,
      text: q.question,
      type: 'single_choice',
      order: qIdx,
      required: true,
      options: q.options.map((opt, optIdx) => ({
        id: `${q.id}_opt${opt.value}`,
        label: opt.label,
        value: opt.value,
        order: optIdx,
        description: opt.label
      }))
    }))
  }))

  const structure = {
    metadata: {
      name: senioritySellerData.title,
      description: senioritySellerData.description,
      instructions: 'Avalie cada habilidade selecionando a opção que melhor descreve o nível atual. Esta avaliação é feita pelo próprio vendedor (autoavaliação) e pelo gestor para comparação.',
      estimated_duration_minutes: 20
    },
    categories,
    scoring: {
      method: 'weighted_sum',
      category_weights: senioritySellerData.global_scoring.weights,
      scale: {
        min: 1,
        max: 3,
        labels: {
          '1': 'Júnior',
          '2': 'Pleno',
          '3': 'Sênior'
        }
      },
      ranges: senioritySellerData.global_scoring.ranges.map(r => ({
        id: r.label.toLowerCase(),
        label: r.label,
        min: r.min,
        max: r.max
      }))
    }
  }

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'seniority_seller')

  if (error) {
    console.error('❌ Erro:', error)
    return false
  }

  console.log('✅ Senioridade Vendedor atualizado')
  return true
}

async function fixSeniorityLeader() {
  console.log('\n2️⃣ Corrigindo Senioridade Líder...')

  const categories = seniorityLeaderData.categories.map((cat, catIdx) => ({
    id: cat.id,
    name: cat.name,
    description: 'Avalie cada habilidade de 1 a 3',
    order: catIdx,
    questions: cat.questions.map((q, qIdx) => ({
      id: q.id,
      text: q.question,
      type: 'single_choice',
      order: qIdx,
      required: true,
      options: q.options.map((opt, optIdx) => ({
        id: `${q.id}_opt${opt.value}`,
        label: opt.label,
        value: opt.value,
        order: optIdx,
        description: opt.label
      }))
    }))
  }))

  const structure = {
    metadata: {
      name: seniorityLeaderData.title,
      description: seniorityLeaderData.description,
      instructions: 'Avalie cada habilidade selecionando a opção que melhor descreve o nível atual. Esta avaliação é feita pelo próprio líder (autoavaliação) e pelo gestor para comparação.',
      estimated_duration_minutes: 25
    },
    categories,
    scoring: {
      method: 'weighted_sum',
      category_weights: seniorityLeaderData.global_scoring.weights,
      scale: {
        min: 1,
        max: 3,
        labels: {
          '1': 'Júnior',
          '2': 'Pleno',
          '3': 'Sênior'
        }
      },
      ranges: seniorityLeaderData.global_scoring.ranges.map(r => ({
        id: r.label.toLowerCase(),
        label: r.label,
        min: r.min,
        max: r.max
      }))
    }
  }

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'seniority_leader')

  if (error) {
    console.error('❌ Erro:', error)
    return false
  }

  console.log('✅ Senioridade Líder atualizado')
  return true
}

async function fixLeadershipStyle() {
  console.log('\n3️⃣ Corrigindo Estilo de Liderança...')

  const questions = leadershipStyleData.questions.map((q, qIdx) => ({
    id: q.id,
    text: q.question,
    type: 'single_choice',
    order: qIdx,
    required: true,
    options: q.options.map((opt, optIdx) => ({
      id: `${q.id}_opt${opt.value}`,
      label: opt.label,
      value: opt.value,
      order: optIdx,
      description: opt.label
    }))
  }))

  const structure = {
    metadata: {
      name: leadershipStyleData.title,
      description: leadershipStyleData.description,
      instructions: 'Responda cada questão selecionando a alternativa que mais se parece com você. Descubra se seu perfil é Builder, Farmer ou Scale.',
      estimated_duration_minutes: 10
    },
    categories: [
      {
        id: 'leadership_style',
        name: 'Estilo de Liderança',
        description: 'Identifique seu perfil de liderança',
        order: 0,
        questions
      }
    ],
    scoring: {
      method: 'sum',
      category_weights: {},
      scale: {
        min: 10,
        max: 30,
        labels: {
          '10-16': 'Builder',
          '17-23': 'Farmer',
          '24-30': 'Scale'
        }
      },
      ranges: leadershipStyleData.results.map((r, idx) => ({
        id: r.label.toLowerCase(),
        label: r.label,
        min: r.range.min,
        max: r.range.max,
        description: r.description
      }))
    }
  }

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'leadership_style')

  if (error) {
    console.error('❌ Erro:', error)
    return false
  }

  console.log('✅ Estilo de Liderança atualizado')
  return true
}

async function main() {
  const results = await Promise.all([
    fixSenioritySeller(),
    fixSeniorityLeader(),
    fixLeadershipStyle()
  ])

  if (results.every(r => r === true)) {
    console.log('\n✅ Todos os 3 testes atualizados com sucesso!')
  } else {
    console.log('\n⚠️  Alguns testes falharam')
    process.exit(1)
  }
}

main()
