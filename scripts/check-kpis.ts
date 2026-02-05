
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

async function checkKPIs() {
  console.log('Checking KPIs count...')
  
  const { data, error, count } = await supabase
    .from('kpis')
    .select('*', { count: 'exact' })

  if (error) {
    console.error('Error fetching KPIs:', error)
  } else {
    console.log(`Found ${count} KPIs in the database.`)
    if (data) {
        console.log('KPI Names:', data.map(k => k.name).join(', '))
    }
  }
}

checkKPIs()
