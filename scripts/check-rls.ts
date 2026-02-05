
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = envConfig['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('Checking RLS on plans table...')

  // Check if RLS is enabled
  const { data: rlsEnabled, error: rlsError } = await supabase.rpc('check_rls_enabled', { table_name: 'plans' })
  
  // Since we can't easily call internal postgres functions via JS client without a helper RPC,
  // we will try to fetch plans as an anonymous user (simulating public access) 
  // and as a simulated authenticated user if possible.
  
  // Actually, let's just inspect the policies via pg_policies if we had SQL access.
  // But we don't.
  
  // Let's try to fetch plans with the service role (should work)
  const { data: plansAdmin, error: errorAdmin } = await supabase.from('plans').select('*')
  console.log('Admin fetch plans:', plansAdmin?.length, errorAdmin)

  // Now let's try with a public client (anon key)
  const supabaseAnon = createClient(supabaseUrl, envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY']!)
  const { data: plansAnon, error: errorAnon } = await supabaseAnon.from('plans').select('*')
  console.log('Anon fetch plans:', plansAnon?.length, errorAnon)
  
  if ((plansAnon?.length ?? 0) === 0 && (plansAdmin?.length ?? 0) > 0) {
    console.log('POTENTIAL ISSUE: Anon user cannot see plans. RLS might be blocking.')
  }
}

main()
