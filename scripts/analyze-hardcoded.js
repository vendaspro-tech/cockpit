#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 ANALISANDO HARDCODED VALUES\n')

async function analyzeTest(testType, testName) {
  const { data, error } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', testType)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.log(`❌ ${testName}: Erro ao buscar`)
    return
  }

  const s = data.structure

  console.log(`\n📋 ${testName}:`)
  console.log(`   Categories: ${s.categories.length}`)

  // Check first question
  const firstQ = s.categories[0]?.questions[0]
  if (!firstQ) {
    console.log(`   ⚠️  Sem questões`)
    return
  }

  console.log(`   Primeira questão: ${firstQ.id}`)
  console.log(`   Tipo: ${firstQ.type}`)

  // Check scale info
  if (firstQ.scale_descriptors) {
    const max = Math.max(...firstQ.scale_descriptors.map(d => d.value))
    const min = Math.min(...firstQ.scale_descriptors.map(d => d.value))
    console.log(`   Escala: ${min}-${max} (scale_descriptors) ✅`)
  } else if (firstQ.matrix_config?.scale) {
    const { min, max } = firstQ.matrix_config.scale
    console.log(`   Escala: ${min}-${max} (matrix_config.scale) ✅`)
  } else if (firstQ.options) {
    const max = Math.max(...firstQ.options.map(o => Number(o.value)))
    const min = Math.min(...firstQ.options.map(o => Number(o.value)))
    console.log(`   Escala: ${min}-${max} (options) ✅`)
  } else {
    console.log(`   ⚠️  Escala NÃO encontrada na estrutura`)
  }

  // Check scoring config
  if (s.scoring) {
    console.log(`   Tem scoring.config ✅`)
    if (s.scoring.scale) {
      console.log(`   Escala global: ${s.scoring.scale.min}-${s.scoring.scale.max}`)
    }
    if (s.scoring.seniority_levels) {
      console.log(`   Seniority levels: ${s.scoring.seniority_levels.length} níveis`)
    }
    if (s.scoring.results) {
      console.log(`   Results mappings: ${s.scoring.results.length}`)
    }
  } else {
    console.log(`   ⚠️  Não tem scoring.config`)
  }
}

async function main() {
  await analyzeTest('disc', 'DISC')
  await analyzeTest('seniority_seller', 'Senioridade Vendedor')
  await analyzeTest('seniority_leader', 'Senioridade Líder')
  await analyzeTest('def_method', 'Método DEF')
  await analyzeTest('values_8d', '8 Dimensões de Valores')
  await analyzeTest('leadership_style', 'Estilo de Liderança')

  console.log('\n\n📝 ANÁLISE DOS HARDCODED VALUES:\n')
  console.log('1. Seniority: maxScore = 3 hardcoded ❌')
  console.log('2. DEF Method: maxScore = 3 hardcoded ❌')
  console.log('3. Values 8D: maxScore = 5 hardcoded ❌')
  console.log('4. DISC: maxScore = 4 hardcoded ❌')
  console.log('\n💡 SOLUÇÃO: Ler escala da estrutura (scale_descriptors, matrix_config.scale, ou scoring.scale)')
}

main()
