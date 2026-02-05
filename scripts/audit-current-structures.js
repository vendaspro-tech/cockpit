#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function auditAllStructures() {
  console.log('🔍 AUDITORIA COMPLETA DAS ESTRUTURAS ATUAIS\n')
  console.log('='.repeat(80))

  const testTypes = [
    'disc',
    'def_method',
    'seniority_seller',
    'seniority_leader',
    'leadership_style',
    'values_8d'
  ]

  for (const testType of testTypes) {
    console.log(`\n📋 ${testType.toUpperCase()}`)
    console.log('-'.repeat(80))

    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', testType)
      .single()

    if (error) {
      console.log(`❌ Erro: ${error.message}`)
      continue
    }

    if (!data) {
      console.log('❌ Não encontrado')
      continue
    }

    const s = data.structure

    // Metadata
    console.log('\n📝 Metadata:')
    console.log(`  Nome: ${s.metadata?.name || 'FALTANDO'}`)
    console.log(`  Descrição: ${s.metadata?.description?.substring(0, 60) || 'FALTANDO'}...`)
    console.log(`  Duração estimada: ${s.metadata?.estimated_duration_minutes || 'FALTANDO'} min`)

    // Categories
    console.log('\n📂 Categorias:')
    if (s.categories && s.categories.length > 0) {
      console.log(`  Total: ${s.categories.length}`)
      s.categories.forEach((cat, idx) => {
        const qCount = cat.questions?.length || 0
        console.log(`  ${idx + 1}. ${cat.name} (${qCount} questões)`)

        // Check first question type
        if (cat.questions && cat.questions.length > 0) {
          const firstQ = cat.questions[0]
          console.log(`     Tipo questão: ${firstQ.type || 'UNDEFINED'}`)
          console.log(`     Opções: ${firstQ.options?.length || 0}`)
          console.log(`     Scale descriptors: ${firstQ.scale_descriptors?.length || 0}`)

          if (firstQ.scale_descriptors && firstQ.scale_descriptors.length > 0) {
            const values = firstQ.scale_descriptors.map(d => d.value).sort((a, b) => a - b)
            console.log(`     Escala: ${Math.min(...values)} a ${Math.max(...values)}`)
          }
        }
      })
    } else {
      console.log('  ❌ NENHUMA CATEGORIA')
    }

    // Scoring
    console.log('\n🎯 Scoring:')
    console.log(`  Method: ${s.scoring?.method || 'FALTANDO'}`)
    if (s.scoring?.scale) {
      console.log(`  Scale: ${s.scoring.scale.min} a ${s.scoring.scale.max}`)
    }
    if (s.scoring?.category_weights) {
      console.log('  Category weights:')
      Object.entries(s.scoring.category_weights).forEach(([cat, weight]) => {
        console.log(`    ${cat}: ${weight}`)
      })
    }
    if (s.scoring?.ranges && s.scoring.ranges.length > 0) {
      console.log('  Ranges:')
      s.scoring.ranges.forEach(r => {
        console.log(`    ${r.label}: ${r.min}-${r.max}`)
      })
    }

    console.log('\n' + '='.repeat(80))
  }

  console.log('\n✅ Auditoria concluída!')
}

auditAllStructures()
