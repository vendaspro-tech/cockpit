/**
 * Script para ativar senioridade em cargos de gestão
 * e criar os frameworks de competência faltantes
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔧 Atualizando cargos de gestão...\n')

  // 1. Atualizar allows_seniority para cargos de gestão
  const managementRoles = [
    'Gerente Comercial',
    'Coordenador Comercial',
    'Supervisor Comercial'
  ]

  for (const roleName of managementRoles) {
    const { data: jobTitle } = await supabase
      .from('job_titles')
      .select('id, name, slug, allows_seniority')
      .eq('name', roleName)
      .single()

    if (jobTitle) {
      if (!jobTitle.allows_seniority) {
        console.log(`📝 Atualizando ${roleName}...`)
        await supabase
          .from('job_titles')
          .update({ allows_seniority: true })
          .eq('id', jobTitle.id)
        console.log(`  ✅ ${roleName} agora permite senioridade`)
      } else {
        console.log(`ℹ️  ${roleName} já permite senioridade`)
      }
    } else {
      console.log(`⚠️  Cargo não encontrado: ${roleName}`)
    }
  }

  console.log('\n✅ Cargos de gestão atualizados!\n')

  // 2. Verificar quais cargos ainda precisam de framework
  const { data: jobTitles } = await supabase
    .from('job_titles')
    .select('id, name, slug, allows_seniority, hierarchy_level')
    .eq('allows_seniority', true)
    .order('hierarchy_level, name')

  const { data: frameworks } = await supabase
    .from('competency_frameworks')
    .select('job_title_id')
    .eq('is_template', true)
    .eq('is_active', true)

  const frameworkJobIds = new Set(frameworks?.map(f => f.job_title_id) || [])

  console.log('📊 Cargos SEM framework (permitem senioridade):\n')
  const missing = jobTitles?.filter(jt => !frameworkJobIds.has(jt.id)) || []

  if (missing.length > 0) {
    missing.forEach(jt => {
      console.log(`  ❌ ${jt.name} (Nível ${jt.hierarchy_level})`)
    })
    console.log(`\n⚠️  Total de ${missing.length} cargo(s) sem framework`)
  } else {
    console.log('  ✅ Todos os cargos com senioridade têm framework!')
  }
}

main()
