const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listJobs() {
  const { data, error } = await supabase
    .from('job_titles')
    .select('name')
    .order('name')

  if (error) {
    console.error('Erro:', error)
    return
  }

  console.log('Cargos no banco:')
  data.forEach((job, idx) => {
    console.log(`${idx + 1}. ${job.name}`)
  })
}

listJobs()
