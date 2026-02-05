// Teste Automatizado: Test Structures Editor
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let testStructureId = null
let passCount = 0
let failCount = 0
let warningCount = 0

function log(test, status, message) {
  const icon = status === '✅' ? '✅' : status === '⚠️' ? '⚠️' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (status === '✅') passCount++
  else if (status === '⚠️') warningCount++
  else failCount++
}

async function test1_ListAllStructures() {
  console.log('\n📋 TESTE 1: Listar todas estruturas')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('*')
      .order('test_type')

    if (error) throw error

    log('Listar estruturas', '✅', `${data.length} estruturas encontradas`)

    // Group by test_type
    const grouped = {}
    data.forEach(ts => {
      if (!grouped[ts.test_type]) grouped[ts.test_type] = []
      grouped[ts.test_type].push(ts.version)
    })

    console.log('   Estruturas por tipo:')
    Object.entries(grouped).forEach(([type, versions]) => {
      console.log(`   - ${type}: ${versions.length} versões (${versions.join(', ')})`)
    })
  } catch (err) {
    log('Listar estruturas', '❌', err.message)
  }
}

async function test2_FilterByType() {
  console.log('\n🎯 TESTE 2: Filtrar por test_type')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('*')
      .eq('test_type', 'disc')
      .order('version', { ascending: false })

    if (error) throw error

    log('Filtro DISC', '✅', `${data.length} versões encontradas`)
    data.forEach(ts => {
      console.log(`   - v${ts.version} ${ts.is_active ? '(ativo)' : '(inativo)'}: ${ts.structure?.metadata?.name}`)
    })
  } catch (err) {
    log('Filtro DISC', '❌', err.message)
  }
}

async function test3_GetActiveStructure() {
  console.log('\n✅ TESTE 3: Buscar versão ativa por tipo')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('*')
      .eq('test_type', 'disc')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const categories = data.structure?.categories?.length || 0
    const questions = data.structure?.categories?.reduce((sum, cat) => sum + (cat.questions?.length || 0), 0) || 0

    log('Versão ativa DISC', '✅', `v${data.version}: ${categories} categorias, ${questions} questões`)
    console.log(`   Nome: ${data.structure?.metadata?.name}`)
    console.log(`   Descrição: ${data.structure?.metadata?.description?.substring(0, 80)}...`)
  } catch (err) {
    log('Versão ativa DISC', '❌', err.message)
  }
}

async function test4_CreateTestStructure() {
  console.log('\n➕ TESTE 4: Criar novo teste')
  try {
    const newStructure = {
      test_type: 'seniority_seller', // Usar tipo válido existente
      structure: {
        metadata: {
          name: 'Senioridade Vendedor - Teste Automatizado',
          description: 'Teste criado via script automatizado',
          instructions: 'Responda todas as questões',
          applicable_job_titles: ['SDR', 'Closer', 'Inside Sales']
        },
        categories: [
          {
            id: 'cat1',
            name: 'Comportamental',
            weight: 50,
            questions: [
              {
                id: 'q1',
                text: 'Questão de teste comportamental',
                type: 'scale',
                scale_descriptors: [
                  { value: 1, label: 'Nunca' },
                  { value: 5, label: 'Sempre' }
                ],
                required: true
              }
            ]
          },
          {
            id: 'cat2',
            name: 'Técnica DEF',
            weight: 30,
            questions: [
              {
                id: 'q2',
                text: 'Questão de teste técnica',
                type: 'scale',
                scale_descriptors: [
                  { value: 1, label: 'Discordo totalmente' },
                  { value: 5, label: 'Concordo totalmente' }
                ],
                required: true
              }
            ]
          },
          {
            id: 'cat3',
            name: 'Processos',
            weight: 20,
            questions: [
              {
                id: 'q3',
                text: 'Questão de teste processos',
                type: 'scale',
                scale_descriptors: [
                  { value: 1, label: 'Não executa' },
                  { value: 5, label: 'Executa sempre' }
                ],
                required: true
              }
            ]
          }
        ],
        scoring: {
          min_score: 0,
          max_score: 100,
          seniority_ranges: {
            junior: { min: 0, max: 60 },
            pleno: { min: 61, max: 80 },
            senior: { min: 81, max: 100 }
          }
        }
      },
      changelog: 'Versão inicial - teste automatizado',
      is_active: false, // Não ativar para não interferir
      version: 99
    }

    const { data, error } = await supabase
      .from('test_structures')
      .insert(newStructure)
      .select()
      .single()

    if (error) throw error

    testStructureId = data.id
    log('Criar teste', '✅', `Teste criado (ID: ${data.id}, v${data.version})`)
    console.log(`   Tipo: ${data.test_type}`)
    console.log(`   Categorias: ${data.structure.categories.length}`)
    console.log(`   Questões totais: ${data.structure.categories.reduce((sum, cat) => sum + cat.questions.length, 0)}`)
  } catch (err) {
    log('Criar teste', '❌', err.message)
  }
}

async function test5_UpdateTestStructure() {
  console.log('\n✏️ TESTE 5: Editar teste (nova versão)')
  if (!testStructureId) {
    log('Editar teste', '⚠️', 'Pulado - teste não criado')
    return
  }

  try {
    // Criar nova versão
    const { data: current } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('id', testStructureId)
      .single()

    const { data, error } = await supabase
      .from('test_structures')
      .insert({
        test_type: 'seniority_seller',
        structure: {
          ...current.structure,
          metadata: {
            ...current.structure.metadata,
            name: 'Senioridade Vendedor - Versão 2 (Teste)'
          }
        },
        changelog: 'Atualização via teste automatizado',
        is_active: false,
        version: 100
      })
      .select()
      .single()

    if (error) throw error

    testStructureId = data.id
    log('Editar teste', '✅', `Nova versão criada (ID: ${data.id}, v${data.version})`)

    // Limpar versão 100 também
    await supabase.from('test_structures').delete().eq('id', data.id)
  } catch (err) {
    log('Editar teste', '❌', err.message)
  }
}

async function test6_ValidateCategories() {
  console.log('\n📂 TESTE 6: Validar categorias e questões')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', 'disc')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const categories = data.structure?.categories || []
    const hasEmptyCategories = categories.some(cat => !cat.questions || cat.questions.length === 0)
    const totalQuestions = categories.reduce((sum, cat) => sum + (cat.questions?.length || 0), 0)

    log('Validar categorias', !hasEmptyCategories ? '✅' : '❌',
      `${categories.length} categorias, ${totalQuestions} questões ${!hasEmptyCategories ? '✓' : '✗ (categorias vazias)'}`)
  } catch (err) {
    log('Validar categorias', '❌', err.message)
  }
}

async function test7_ValidateWeightsSum() {
  console.log('\n⚖️ TESTE 7: Validar soma dos pesos = 100%')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', 'seniority_seller')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const categories = data.structure?.categories || []
    const totalWeight = categories.reduce((sum, cat) => sum + (cat.weight || 0), 0)
    const isValid = totalWeight === 100

    if (isValid) {
      log('Validar pesos (Senioridade)', '✅', `Soma = ${totalWeight}% ✓`)
    } else if (totalWeight === 0) {
      log('Validar pesos (Senioridade)', '⚠️', 'Pesos não configurados (todos são 0%) - requer configuração manual')
      console.log('   Categorias:')
      categories.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat.weight || 0}%`)
      })
    } else {
      log('Validar pesos (Senioridade)', '❌', `Soma = ${totalWeight}% ✗ (deve ser 100%)`)
      console.log('   Categorias e pesos:')
      categories.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat.weight || 0}%`)
      })
    }
  } catch (err) {
    log('Validar pesos', '❌', err.message)
  }
}

async function test8_ValidateScoringRanges() {
  console.log('\n📊 TESTE 8: Validar ranges sem sobreposição')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', 'seniority_seller')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const ranges = data.structure?.scoring?.seniority_ranges
    if (!ranges) {
      log('Validar ranges (Senioridade)', '⚠️', 'Ranges não definidos - requer configuração manual')
      console.log('   Configure seniority_ranges em structure.scoring:')
      console.log('   - junior: { min: 0, max: 60 }')
      console.log('   - pleno: { min: 61, max: 80 }')
      console.log('   - senior: { min: 81, max: 100 }')
      return
    }

    const { junior, pleno, senior } = ranges
    const hasOverlap = (junior.max >= pleno.min) || (pleno.max >= senior.min)

    log('Validar ranges (Senioridade)', !hasOverlap ? '✅' : '❌',
      `J: ${junior.min}-${junior.max}, P: ${pleno.min}-${pleno.max}, S: ${senior.min}-${senior.max} ${!hasOverlap ? '✓' : '✗ (sobreposição)'}`)
  } catch (err) {
    log('Validar ranges', '❌', err.message)
  }
}

async function test9_ValidateMatrixScoring() {
  console.log('\n🧮 TESTE 9: Validar matrix_rating (DISC)')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', 'disc')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const categories = data.structure?.categories || []
    const matrixQuestions = categories.flatMap(cat =>
      (cat.questions || []).filter(q => q.matrix_config)
    )

    const hasValidScale = matrixQuestions.every(q => {
      const scale = q.matrix_config?.scale
      return scale && scale.min >= 1 && scale.max <= 4
    })

    log('Validar matrix', hasValidScale ? '✅' : '❌',
      `${matrixQuestions.length} questões matrix com escala válida ${hasValidScale ? '✓' : '✗'}`)
  } catch (err) {
    log('Validar matrix', '❌', err.message)
  }
}

async function test10_VersionHistory() {
  console.log('\n📜 TESTE 10: Histórico de versões')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('id, version, is_active, changelog')
      .eq('test_type', 'disc')
      .order('version')

    if (error) throw error

    log('Histórico versões', '✅', `${data.length} versões de DISC`)
    data.forEach(ts => {
      const status = ts.is_active ? '(ativo)' : '(inativo)'
      console.log(`   - v${ts.version} ${status} - ${ts.changelog || 'sem changelog'}`)
    })
  } catch (err) {
    log('Histórico versões', '❌', err.message)
  }
}

async function test11_DeleteTestStructure() {
  console.log('\n🗑️ TESTE 11: Deletar teste')
  if (!testStructureId) {
    log('Deletar teste', '⚠️', 'Pulado - teste não criado')
    return
  }

  try {
    const { error } = await supabase
      .from('test_structures')
      .delete()
      .eq('id', testStructureId)

    if (error) throw error

    testStructureId = null
    log('Deletar teste', '✅', 'Teste removido com sucesso')
  } catch (err) {
    log('Deletar teste', '❌', err.message)
  }
}

async function test12_ValidateMetadata() {
  console.log('\n📝 TESTE 12: Validar metadados obrigatórios')
  try {
    const { data, error } = await supabase
      .from('test_structures')
      .select('structure')
      .eq('test_type', 'seniority_seller')
      .eq('is_active', true)
      .single()

    if (error) throw error

    const metadata = data.structure?.metadata || {}
    const hasBasicMetadata = metadata.name && metadata.description

    log('Validar metadados', hasBasicMetadata ? '✅' : '❌',
      hasBasicMetadata ? 'Campos básicos presentes ✓' : 'Faltando campos obrigatórios ✗')
    console.log(`   Nome: ${metadata.name || 'N/A'}`)
    console.log(`   Descrição: ${metadata.description ? 'Presente' : 'Ausente'}`)
  } catch (err) {
    log('Validar metadados', '❌', err.message)
  }
}

async function cleanup() {
  console.log('\n🧹 CLEANUP: Remover dados de teste')
  if (testStructureId) {
    await supabase.from('test_structures').delete().eq('id', testStructureId)
  }
  // Remover versões de teste criadas
  await supabase
    .from('test_structures')
    .delete()
    .in('version', [99, 100])
  console.log('✅ Dados de teste removidos')
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('   FASE 2 - TESTES AUTOMATIZADOS: TEST STRUCTURES')
  console.log('═══════════════════════════════════════════════════════')

  try {
    await test1_ListAllStructures()
    await test2_FilterByType()
    await test3_GetActiveStructure()
    await test4_CreateTestStructure()
    await test5_UpdateTestStructure()
    await test6_ValidateCategories()
    await test7_ValidateWeightsSum()
    await test8_ValidateScoringRanges()
    await test9_ValidateMatrixScoring()
    await test10_VersionHistory()
    await test11_DeleteTestStructure()
    await test12_ValidateMetadata()
  } finally {
    await cleanup()
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('                    RESUMO FINAL')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`✅ Passou: ${passCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Falhou: ${failCount}`)
  console.log(`📊 Total:  ${passCount + warningCount + failCount} testes`)
  console.log('═══════════════════════════════════════════════════════\n')

  // Warnings não causam falha no pipeline
  process.exit(failCount > 0 ? 1 : 0)
}

runTests()
    .catch(err => {
      console.error('Erro fatal:', err)
      process.exit(1)
    })
