// Script para popular faixas salariais de exemplo
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const salaryData = {
  'SDR': {
    junior: { fixed: 2500, variable_description: 'Comissão por agendamento' },
    pleno: { fixed: 3500, variable_description: 'Comissão por agendamento' },
    senior: { fixed: 4500, variable_description: 'Comissão por agendamento' }
  },
  'Closer': {
    junior: { fixed: 4000, variable_description: 'Comissão de 3-6%' },
    pleno: { fixed: 6500, variable_description: 'Comissão de 4-8%' },
    senior: { fixed: 9000, variable_description: 'Comissão de 5-10%' }
  },
  'Inside Sales': {
    junior: { fixed: 3000, variable_description: 'Comissão de 2-4%' },
    pleno: { fixed: 4500, variable_description: 'Comissão de 3-5%' },
    senior: { fixed: 6500, variable_description: 'Comissão de 4-7%' }
  },
  'Social Seller': {
    junior: { fixed: 2800, variable_description: 'Comissão por conversão' },
    pleno: { fixed: 4000, variable_description: 'Comissão por conversão' },
    senior: { fixed: 5500, variable_description: 'Comissão por conversão' }
  },
  'Gerente Comercial': {
    junior: { fixed: 8000, variable_description: 'Bônus trimestral' },
    pleno: { fixed: 12000, variable_description: 'Bônus trimestral + PLR' },
    senior: { fixed: 18000, variable_description: 'Bônus trimestral + PLR' }
  },
  'Coordenador Comercial': {
    junior: { fixed: 6000, variable_description: 'Bônus mensal' },
    pleno: { fixed: 9000, variable_description: 'Bônus mensal + PLR' },
    senior: { fixed: 13000, variable_description: 'Bônus mensal + PLR' }
  },
  'Supervisor Comercial': {
    junior: { fixed: 4500, variable_description: 'Bônus por meta' },
    pleno: { fixed: 6500, variable_description: 'Bônus por meta' },
    senior: { fixed: 9000, variable_description: 'Bônus por meta' }
  },
  'Customer Success': {
    junior: { fixed: 3500, variable_description: 'Bônus por retenção' },
    pleno: { fixed: 5000, variable_description: 'Bônus por retenção + expansão' },
    senior: { fixed: 7500, variable_description: 'Bônus por retenção + expansão' }
  },
  'Sales Enablement': {
    junior: { fixed: 5000, variable_description: 'Bônus por projeto' },
    pleno: { fixed: 7000, variable_description: 'Bônus por projeto' },
    senior: { fixed: 10000, variable_description: 'Bônus por projeto + impacto' }
  },
  'Sales Operations': {
    junior: { fixed: 4500, variable_description: 'Bônus por KPIs' },
    pleno: { fixed: 6500, variable_description: 'Bônus por KPIs' },
    senior: { fixed: 9000, variable_description: 'Bônus por KPIs + otimizações' }
  },
  'Empresário': {
    junior: { fixed: 15000, variable_description: 'Lucros + dividendos' },
    pleno: { fixed: 25000, variable_description: 'Lucros + dividendos' },
    senior: { fixed: 40000, variable_description: 'Lucros + dividendos + participação' }
  }
}

async function populateSalaries() {
  console.log('🚀 Populando faixas salariais...\n')

  for (const [jobName, salaries] of Object.entries(salaryData)) {
    const { data: job, error: findError } = await supabase
      .from('job_titles')
      .select('id, name, remuneration')
      .eq('name', jobName)
      .single()

    if (findError || !job) {
      console.log(`❌ Cargo não encontrado: ${jobName}`)
      continue
    }

    const { error: updateError } = await supabase
      .from('job_titles')
      .update({ remuneration: salaries })
      .eq('id', job.id)

    if (updateError) {
      console.log(`❌ Erro ao atualizar ${jobName}:`, updateError.message)
    } else {
      console.log(`✅ ${jobName} atualizado:`)
      console.log(`   Junior: R$ ${salaries.junior.fixed}`)
      console.log(`   Pleno: R$ ${salaries.pleno.fixed}`)
      console.log(`   Senior: R$ ${salaries.senior.fixed}`)
      console.log()
    }
  }

  console.log('\n✨ Concluído!')
}

populateSalaries()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Erro:', err)
      process.exit(1)
    })
