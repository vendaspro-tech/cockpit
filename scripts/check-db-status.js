const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabase() {
  console.log('\n=== Checking Database Status ===\n')

  // 1. Check job_titles
  console.log('1. JOB TITLES:')
  const { data: jobTitles, error: jobTitlesError } = await supabase
    .from('job_titles')
    .select('id, name, hierarchy_level, workspace_id')
    .order('hierarchy_level')

  if (jobTitlesError) {
    console.error('❌ Error fetching job titles:', jobTitlesError)
  } else {
    console.log(`✅ Found ${jobTitles.length} job titles:`)
    jobTitles.forEach(jt => {
      console.log(`   - ${jt.name} (level ${jt.hierarchy_level}, workspace: ${jt.workspace_id || 'GLOBAL'})`)
    })
  }

  // 2. Check roles
  console.log('\n2. ROLES:')
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('slug, name, description, is_system_role')
    .order('slug')

  if (rolesError) {
    console.error('❌ Error fetching roles:', rolesError)
  } else {
    console.log(`✅ Found ${roles.length} roles:`)
    roles.forEach(role => {
      console.log(`   - ${role.slug}: ${role.name} (system: ${role.is_system_role})`)
    })
  }

  // 3. Check RLS policies on job_titles
  console.log('\n3. RLS POLICIES ON JOB_TITLES:')
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_table_policies', { table_name: 'job_titles' })
    .catch(async () => {
      // If RPC doesn't exist, query pg_policies directly
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'job_titles')
      return { data, error }
    })

  if (policiesError) {
    console.log('⚠️  Could not fetch policies (may need admin access)')
  } else if (policies) {
    console.log(`Found ${policies.length} policies:`)
    policies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.cmd}`)
    })
  }

  // 4. Check workspace_members with invalid roles
  console.log('\n4. WORKSPACE MEMBERS WITH INVALID ROLES:')
  const { data: invalidMembers, error: invalidError } = await supabase
    .from('workspace_members')
    .select('id, user_id, role')
    .in('role', ['closer', 'sdr', 'leader'])

  if (invalidError) {
    console.error('❌ Error checking members:', invalidError)
  } else {
    if (invalidMembers.length > 0) {
      console.log(`⚠️  Found ${invalidMembers.length} members with invalid roles:`)
      invalidMembers.forEach(m => {
        console.log(`   - Member ${m.id}: role="${m.role}"`)
      })
    } else {
      console.log('✅ No members with invalid roles (closer, sdr, leader)')
    }
  }

  console.log('\n=== Check Complete ===\n')
}

checkDatabase().catch(console.error)
