
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixConnectRate() {
  console.log('Fixing Connect rate KPI...')
  
  const { data, error } = await supabase
    .from('kpis')
    .update({
      name: 'Connect Rate',
      description: 'Quantidade de pessoas que visualizaram uma página. Ele é impactado pelo tempo de carregamento.',
      formula: 'Visualizações de página / Clique no anúncio'
    })
    .eq('name', 'Conect Rate')
    .select()

  if (error) {
    console.error('Error updating KPI:', error)
  } else {
    console.log('Update successful!')
    console.log('Updated data:', data)
  }
}

fixConnectRate()
