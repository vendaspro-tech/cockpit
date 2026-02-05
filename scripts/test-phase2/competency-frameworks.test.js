// Teste Automatizado: Competency Frameworks CRUD
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let testFrameworkId = null
let testJobTitleId = null
let passCount = 0
let failCount = 0

function log(test, status, message) {
  const icon = status === '✅' ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (status === '✅') passCount++
  else failCount++
}

async function setup() {
  console.log('\n🔧 SETUP: Criar cargo para testes')
  const { data, error } = await supabase
    .from('job_titles')
    .insert({
      name: 'Cargo Teste Framework',
      slug: 'cargo-teste-framework',
      hierarchy_level: 3,
      sector: 'Comercial',
      allows_seniority: true,
      mission: 'Cargo para testar frameworks',
      remuneration: {
        junior: { fixed: 2000 },
        pleno: { fixed: 3000 },
        senior: { fixed: 4000 }
      },
      requirements: { education: '', skills: [] },
      kpis: [],
      main_activities: []
    })
    .select()
    .single()

  if (error) {
    console.error('Erro no setup:', error.message)
    throw error
  }

  testJobTitleId = data.id
  console.log(`✅ Cargo criado: ${data.name} (ID: ${data.id})`)
}

async function teardown() {
  console.log('\n🧹 CLEANUP: Remover dados de teste')
  if (testFrameworkId) {
    await supabase.from('competency_frameworks').delete().eq('id', testFrameworkId)
  }
  if (testJobTitleId) {
    await supabase.from('job_titles').delete().eq('id', testJobTitleId)
  }
  console.log('✅ Dados de teste removidos')
}

async function test1_ListFrameworks() {
  console.log('\n📋 TESTE 1: Listar frameworks')
  try {
    const { data, error } = await supabase
      .from('competency_frameworks')
      .select('*, job_titles(name)')
      .eq('is_template', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    log('Listar frameworks', '✅', `${data.length} templates encontrados`)
    data.forEach(fw => {
      const jobName = fw.job_titles?.name || 'N/A'
      console.log(`   - ${fw.name} (${jobName}) v${fw.version}`)
    })
  } catch (err) {
    log('Listar frameworks', '❌', err.message)
  }
}

async function test2_CreateFramework() {
  console.log('\n➕ TESTE 2: Criar template global')
  try {
    const newFramework = {
      workspace_id: null, // Template global
      job_title_id: testJobTitleId,
      name: 'Framework Teste Automatizado',
      weights: {
        behavioral: 50,
        technical_def: 30,
        process: 20
      },
      behavioral_competencies: [
        {
          id: 1,
          name: 'Comunicação',
          description: 'Capacidade de se comunicar efetivamente',
          levels: {
            '1': 'Comunica basicamente',
            '2': 'Comunica claramente',
            '3': 'Comunica de forma excepcional'
          }
        },
        {
          id: 2,
          name: 'Proatividade',
          description: 'Age antecipadamente',
          levels: {
            '1': 'Recebe tarefas passivamente',
            '2': 'Propõe melhorias',
            '3': 'Antecipa problemas e resolve'
          }
        }
      ],
      technical_def_competencies: [
        {
          id: 1,
          name: 'Prospection',
          description: 'Capacidade de prospectar clientes',
          levels: {
            '1': 'Prospecta com supervisão',
            '2': 'Prospecta autonomamente',
            '3': 'Lidera estratégias de prospecção'
          }
        }
      ],
      process_competencies: [
        {
          id: 1,
          name: 'CRM Management',
          description: 'Gestão do CRM',
          levels: {
            '1': 'Registra dados básicos',
            '2': 'Mantém CRM atualizado',
            '3': 'Analisa dados e toma ações'
          }
        }
      ],
      scoring_ranges: {
        junior: { min: 0, max: 60 },
        pleno: { min: 61, max: 80 },
        senior: { min: 81, max: 100 }
      },
      is_template: true,
      version: 1,
      is_active: true
    }

    const { data, error } = await supabase
      .from('competency_frameworks')
      .insert(newFramework)
      .select()
      .single()

    if (error) throw error

    testFrameworkId = data.id
    log('Criar framework', '✅', `Framework criado (ID: ${data.id})`)
    console.log(`   Pesos: B=${data.weights.behavioral}%, T=${data.weights.technical_def}%, P=${data.weights.process}%`)
    console.log(`   Competências: ${data.behavioral_competencies.length} comportamentais, ${data.technical_def_competencies.length} técnicas, ${data.process_competencies.length} processos`)
  } catch (err) {
    log('Criar framework', '❌', err.message)
  }
}

async function test3_ValidateWeights() {
  console.log('\n⚖️ TESTE 3: Validar soma de pesos = 100%')
  try {
    const { data, error } = await supabase
      .from('competency_frameworks')
      .select('weights')
      .eq('id', testFrameworkId)
      .single()

    if (error) throw error

    const sum = data.weights.behavioral + data.weights.technical_def + data.weights.process
    const isValid = sum === 100

    log('Validar pesos', isValid ? '✅' : '❌', `Soma = ${sum}% ${isValid ? '✓' : '✗ (deve ser 100%)'}`)
  } catch (err) {
    log('Validar pesos', '❌', err.message)
  }
}

async function test4_UpdateFramework() {
  console.log('\n✏️ TESTE 4: Editar framework')
  if (!testFrameworkId) {
    log('Editar framework', '⚠️', 'Pulado - framework não criado')
    return
  }

  try {
    // Criar nova versão ao atualizar
    const { data, error } = await supabase
      .from('competency_frameworks')
      .update({
        name: 'Framework Teste - Versão 2',
        version: 2,
        behavioral_competencies: [
          ...[{
            id: 1,
            name: 'Comunicação',
            description: 'Capacidade de se comunicar efetivamente (atualizado)',
            levels: {
              '1': 'Comunica basicamente',
              '2': 'Comunica claramente',
              '3': 'Comunica de forma excepcional'
            }
          }],
          {
            id: 3,
            name: 'Liderança',
            description: 'Capacidade de liderar equipes',
            levels: {
              '1': 'Lidera pequenos grupos',
              '2': 'Lidera equipes',
              '3': 'Lidera múltiplas equipes'
            }
          }
        ]
      })
      .eq('id', testFrameworkId)
      .select()
      .single()

    if (error) throw error

    log('Editar framework', '✅', `Framework atualizado para v${data.version}`)
    console.log(`   Nome: ${data.name}`)
    console.log(`   Competências comportamentais: ${data.behavioral_competencies.length}`)
  } catch (err) {
    log('Editar framework', '❌', err.message)
  }
}

async function test5_DuplicateFramework() {
  console.log('\n📋 TESTE 5: Duplicar framework')
  if (!testFrameworkId) {
    log('Duplicar framework', '⚠️', 'Pulado - framework não criado')
    return
  }

  try {
    // Buscar framework original
    const { data: original } = await supabase
      .from('competency_frameworks')
      .select('*')
      .eq('id', testFrameworkId)
      .single()

    if (!original) throw new Error('Framework original não encontrado')

    // Criar cópia
    const { data, error } = await supabase
      .from('competency_frameworks')
      .insert({
        ...original,
        id: undefined, // Remove ID para criar novo
        name: `${original.name} (Cópia)`,
        version: 1,
        is_active: false,
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single()

    if (error) throw error

    log('Duplicar framework', '✅', `Framework duplicado (novo ID: ${data.id})`)

    // Limpar duplicata
    await supabase.from('competency_frameworks').delete().eq('id', data.id)
  } catch (err) {
    log('Duplicar framework', '❌', err.message)
  }
}

async function test6_ValidateScoringRanges() {
  console.log('\n📊 TESTE 6: Validar ranges sem sobreposição')
  try {
    const { data, error } = await supabase
      .from('competency_frameworks')
      .select('scoring_ranges')
      .eq('id', testFrameworkId)
      .single()

    if (error) throw error

    const { junior, pleno, senior } = data.scoring_ranges
    const hasOverlap = (junior.max >= pleno.min) || (pleno.max >= senior.min)

    log('Validar ranges', !hasOverlap ? '✅' : '❌',
      `Junior: ${junior.min}-${junior.max}, Pleno: ${pleno.min}-${pleno.max}, Senior: ${senior.min}-${senior.max} ${!hasOverlap ? '✓' : '✗ (sobreposição)'}`)
  } catch (err) {
    log('Validar ranges', '❌', err.message)
  }
}

async function test7_GetFrameworkStats() {
  console.log('\n📈 TESTE 7: Estatísticas de frameworks')
  try {
    const { data: frameworks, error } = await supabase
      .from('competency_frameworks')
      .select('id, is_template, is_active')

    if (error) throw error

    const templates = frameworks.filter(f => f.is_template).length
    const active = frameworks.filter(f => f.is_active).length
    const total = frameworks.length

    log('Estatísticas', '✅', `${total} frameworks (${templates} templates, ${active} ativos)`)
  } catch (err) {
    log('Estatísticas', '❌', err.message)
  }
}

async function test8_DeleteFramework() {
  console.log('\n🗑️ TESTE 8: Deletar framework')
  if (!testFrameworkId) {
    log('Deletar framework', '⚠️', 'Pulado - framework não criado')
    return
  }

  try {
    const { error } = await supabase
      .from('competency_frameworks')
      .delete()
      .eq('id', testFrameworkId)

    if (error) throw error

    testFrameworkId = null
    log('Deletar framework', '✅', 'Framework removido com sucesso')
  } catch (err) {
    log('Deletar framework', '❌', err.message)
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  FASE 2 - TESTES AUTOMATIZADOS: COMPETENCY FRAMEWORKS')
  console.log('═══════════════════════════════════════════════════════')

  try {
    await setup()
    await test1_ListFrameworks()
    await test2_CreateFramework()
    await test3_ValidateWeights()
    await test4_UpdateFramework()
    await test5_DuplicateFramework()
    await test6_ValidateScoringRanges()
    await test7_GetFrameworkStats()
    await test8_DeleteFramework()
  } finally {
    await teardown()
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('                    RESUMO FINAL')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`✅ Passou: ${passCount}`)
  console.log(`❌ Falhou: ${failCount}`)
  console.log(`📊 Total:  ${passCount + failCount} testes`)
  console.log('═══════════════════════════════════════════════════════\n')

  process.exit(failCount > 0 ? 1 : 0)
}

runTests()
    .catch(err => {
      console.error('Erro fatal:', err)
      process.exit(1)
    })
