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

async function applyMigration() {
  console.log('Applying roles migration...')
  
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20250101000019_roles_table.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('Error applying migration via RPC:', error)
    console.log('Please run the following SQL manually in your Supabase SQL Editor:')
    console.log(sql)
  } else {
    console.log('Migration applied successfully!')
  }
}

applyMigration()
