require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('📊 Todos os cargos cadastrados:\n')

  const { data: jobTitles, error } = await supabase
    .from('job_titles')
    .select('id, name, slug, allows_seniority, hierarchy_level')
    .order('hierarchy_level, name')

  if (error) {
    console.error('Erro:', error)
    return
  }

  if (!jobTitles || jobTitles.length === 0) {
    console.log('  ⚠️  Nenhum cargo encontrado')
    return
  }

  jobTitles.forEach(jt => {
    const status = jt.allows_seniority ? '✅' : '❌'
    console.log(`  ${status} ${jt.name} (Nível ${jt.hierarchy_level}, slug: ${jt.slug})`)
  })

  console.log(`\nTotal: ${jobTitles.length} cargos`)
}

main()
