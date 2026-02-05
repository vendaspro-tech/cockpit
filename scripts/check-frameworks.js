require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Verificando frameworks por cargo...\n')

  const { data: jobTitles } = await supabase
    .from('job_titles')
    .select('id, name, slug, allows_seniority')
    .is('workspace_id', null)
    .order('name')

  for (const jt of jobTitles || []) {
    const { data: frameworks } = await supabase
      .from('competency_frameworks')
      .select('id, name, is_active, created_at')
      .eq('job_title_id', jt.id)
      .eq('is_template', true)
      .order('created_at', { ascending: false })

    if (frameworks && frameworks.length > 0) {
      console.log(`\n${jt.name}:`)
      for (let idx = 0; idx < frameworks.length; idx++) {
        const fw = frameworks[idx]
        const status = fw.is_active ? '✅' : '❌'
        console.log(`  ${status} ${fw.name} (v${fw.id.slice(0, 8)}) - ${fw.is_active ? 'ATIVO' : 'INATIVO'}`)

        // Se houver mais de 1 framework, desativar os antigos
        if (idx > 0 && fw.is_active) {
          console.log(`    ⚠️  Desativando framework duplicado...`)
          await supabase
            .from('competency_frameworks')
            .update({ is_active: false })
            .eq('id', fw.id)
        }
      }
    }
  }

  console.log('\n✅ Verificação concluída!')
}

main()
