import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const envConfig: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    envConfig[key] = value
  }
})

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAlerts() {
  console.log('Checking system_alerts table...')
  
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')

  if (error) {
    console.error('Error fetching alerts:', error)
  } else {
    console.log('Found alerts:', JSON.stringify(data, null, 2))
    
    const now = new Date().toISOString()
    console.log('Current Time (ISO):', now)
    
    data?.forEach(alert => {
      console.log('--- Alert Check ---')
      console.log('Title:', alert.title)
      console.log('Is Active:', alert.is_active)
      console.log('Start Date:', alert.start_date)
      console.log('End Date:', alert.end_date)
      console.log('Start <= Now:', alert.start_date <= now)
      console.log('End >= Now:', alert.end_date >= now)
      console.log('Should be visible:', alert.is_active && alert.start_date <= now && alert.end_date >= now)
    })
  }
}

checkAlerts()
