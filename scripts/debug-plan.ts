
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
  console.log('Checking workspaces and plans...')

  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select(`
      id, 
      name, 
      plan_id, 
      plan:plans(*)
    `)

  if (wsError) {
    console.error('Error fetching workspaces:', wsError)
    return
  }

  console.log(`Found ${workspaces.length} workspaces:`)
  
  for (const ws of workspaces) {
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)

    console.log(`Workspace: ${ws.name} (${ws.id})`)
    console.log(`- Plan ID: ${ws.plan_id}`)
    console.log(`- Plan Details:`, ws.plan)
    console.log(`- Member Count: ${count}`)
    
    if (ws.plan) {
      const plan = ws.plan as any
      const isAtLimit = plan.max_users !== null && (count || 0) >= plan.max_users
      console.log(`- Is At Limit? ${isAtLimit} (Max: ${plan.max_users})`)
    } else {
      console.log(`- NO PLAN ASSIGNED!`)
    }
    console.log('---')
  }
}

main()
