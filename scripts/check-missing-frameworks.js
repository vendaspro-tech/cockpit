require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: jobTitles } = await supabase
    .from('job_titles')
    .select('id, name, slug, allows_seniority, hierarchy_level')
    .is('workspace_id', null)
    .eq('allows_seniority', true)
    .order('hierarchy_level, name')

  const { data: frameworks } = await supabase
    .from('competency_frameworks')
    .select('job_title_id, job_titles(name)')
    .eq('is_template', true)
    .eq('is_active', true)

  const frameworkJobIds = new Set(frameworks?.map(f => f.job_title_id) || [])

  console.log('📊 Resumo de Frameworks de Competência\n')
  console.log('Cargos com senioridade:')
  jobTitles?.forEach(jt => {
    const hasFramework = frameworkJobIds.has(jt.id)
    const status = hasFramework ? '✅' : '❌'
    console.log(`  ${status} ${jt.name} (Nível ${jt.hierarchy_level})`)
  })

  console.log('\n📋 Cargos SEM framework (permitem senioridade):\n')
  const missing = jobTitles?.filter(jt => !frameworkJobIds.has(jt.id)) || []
  if (missing.length > 0) {
    missing.forEach(jt => {
      console.log(`  - ${jt.name} (slug: ${jt.slug}, Nível ${jt.hierarchy_level})`)
    })
    console.log(`\n⚠️  Total de ${missing.length} cargo(s) sem framework`)
  } else {
    console.log('  ✅ Todos os cargos com senioridade têm framework!')
  }
}

main()
