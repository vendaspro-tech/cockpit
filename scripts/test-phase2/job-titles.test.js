// Teste Automatizado: Job Titles CRUD
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let testJobTitleId = null
let passCount = 0
let failCount = 0

function log(test, status, message) {
  const icon = status === '✅' ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (status === '✅') passCount++
  else failCount++
}

async function test1_ListAllJobTitles() {
  console.log('\n📋 TESTE 1: Listar todos os cargos')
  try {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .order('name')

    if (error) throw error

    log('Listar cargos', '✅', `${data.length} cargos encontrados`)
    data.forEach(job => {
      console.log(`   - ${job.name} (Nível ${job.hierarchy_level})`)
    })
  } catch (err) {
    log('Listar cargos', '❌', err.message)
  }
}

async function test2_FilterByHierarchy() {
  console.log('\n🎯 TESTE 2: Filtrar por hierarchy_level')
  try {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .eq('hierarchy_level', 3)
      .order('name')

    if (error) throw error

    log('Filtro nível 3', '✅', `${data.length} cargos de execução`)
    data.forEach(job => console.log(`   - ${job.name}`))
  } catch (err) {
    log('Filtro nível 3', '❌', err.message)
  }
}

async function test3_FilterBySector() {
  console.log('\n🏢 TESTE 3: Filtrar por setor')
  try {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .eq('sector', 'Comercial')
      .order('name')

    if (error) throw error

    log('Filtro setor Comercial', '✅', `${data.length} cargos encontrados`)
  } catch (err) {
    log('Filtro setor Comercial', '❌', err.message)
  }
}

async function test4_SearchText() {
  console.log('\n🔍 TESTE 4: Busca textual')
  try {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .ilike('name', '%sales%')
      .order('name')

    if (error) throw error

    log('Busca "sales"', '✅', `${data.length} cargos encontrados`)
    data.forEach(job => console.log(`   - ${job.name}`))
  } catch (err) {
    log('Busca "sales"', '❌', err.message)
  }
}

async function test5_CreateJobTitle() {
  console.log('\n➕ TESTE 5: Criar novo cargo')
  try {
    const newJobTitle = {
      name: 'Cargo Teste Automatizado',
      slug: 'cargo-teste-automatizado',
      hierarchy_level: 3,
      sector: 'Comercial',
      allows_seniority: true,
      mission: 'Missão do cargo teste',
      subordination: 'Gerente Comercial',
      remuneration: {
        junior: { fixed: 2000, variable_description: 'Teste junior' },
        pleno: { fixed: 3000, variable_description: 'Teste pleno' },
        senior: { fixed: 4000, variable_description: 'Teste senior' }
      },
      requirements: {
        education: 'Ensino Superior',
        experience: '2 anos',
        skills: ['Comunicação', 'Vendas']
      },
      kpis: ['Vendas', 'Conversão'],
      main_activities: ['Atender clientes', 'Vender produtos']
    }

    const { data, error } = await supabase
      .from('job_titles')
      .insert(newJobTitle)
      .select()
      .single()

    if (error) throw error

    testJobTitleId = data.id
    log('Criar cargo', '✅', `Cargo "${data.name}" criado (ID: ${data.id})`)
    console.log(`   Slug gerado: ${data.slug}`)
    console.log(`   Remuneração: Junior R$ ${data.remuneration.junior.fixed}, Pleno R$ ${data.remuneration.pleno.fixed}, Senior R$ ${data.remuneration.senior.fixed}`)
  } catch (err) {
    log('Criar cargo', '❌', err.message)
  }
}

async function test6_UpdateJobTitle() {
  console.log('\n✏️ TESTE 6: Editar cargo')
  if (!testJobTitleId) {
    log('Editar cargo', '⚠️', 'Pulado - cargo não criado no teste anterior')
    return
  }

  try {
    const { data, error } = await supabase
      .from('job_titles')
      .update({
        mission: 'Missão atualizada pelo teste automatizado',
        hierarchy_level: 2
      })
      .eq('id', testJobTitleId)
      .select()
      .single()

    if (error) throw error

    log('Editar cargo', '✅', `Missão atualizada, nível mudou para ${data.hierarchy_level}`)
  } catch (err) {
    log('Editar cargo', '❌', err.message)
  }
}

async function test7_GetJobTitleHierarchy() {
  console.log('\n📊 TESTE 7: Visualizar hierarquia')
  try {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .order('hierarchy_level, name')

    if (error) throw error

    const grouped = {
      0: [],
      1: [],
      2: [],
      3: []
    }

    data.forEach(job => {
      grouped[job.hierarchy_level].push(job.name)
    })

    const labels = {
      0: 'Estratégico (C-Level)',
      1: 'Tático (Coordenação)',
      2: 'Operacional (Supervisão)',
      3: 'Execução (Vendas)'
    }

    log('Agrupar por nível', '✅', 'Hierarchical view')
    Object.entries(grouped).forEach(([level, jobs]) => {
      console.log(`   Nível ${level} (${labels[level]}): ${jobs.length} cargos`)
      jobs.forEach(job => console.log(`     - ${job}`))
    })
  } catch (err) {
    log('Agrupar por nível', '❌', err.message)
  }
}

async function test8_DeleteJobTitle() {
  console.log('\n🗑️ TESTE 8: Deletar cargo')
  if (!testJobTitleId) {
    log('Deletar cargo', '⚠️', 'Pulado - cargo não criado no teste anterior')
    return
  }

  try {
    // Primeiro verificar se está em uso (frameworks)
    const { data: frameworks } = await supabase
      .from('competency_frameworks')
      .select('id')
      .eq('job_title_id', testJobTitleId)

    if (frameworks && frameworks.length > 0) {
      // Deletar framework primeiro
      await supabase
        .from('competency_frameworks')
        .delete()
        .eq('job_title_id', testJobTitleId)
    }

    const { error } = await supabase
      .from('job_titles')
      .delete()
      .eq('id', testJobTitleId)

    if (error) throw error

    log('Deletar cargo', '✅', 'Cargo removido com sucesso')
  } catch (err) {
    log('Deletar cargo', '❌', err.message)
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('     FASE 2 - TESTES AUTOMATIZADOS: JOB TITLES CRUD')
  console.log('═══════════════════════════════════════════════════════')

  await test1_ListAllJobTitles()
  await test2_FilterByHierarchy()
  await test3_FilterBySector()
  await test4_SearchText()
  await test5_CreateJobTitle()
  await test6_UpdateJobTitle()
  await test7_GetJobTitleHierarchy()
  await test8_DeleteJobTitle()

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
