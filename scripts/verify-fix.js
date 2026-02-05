const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  console.log('\n=== Verificação Pós-Migration ===\n')

  // 1. Check roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('slug, name')
    .order('slug')

  if (rolesError) {
    console.error('❌ Erro ao buscar roles:', rolesError.message)
    return
  }

  console.log('1. ROLES (deve ter apenas owner, admin, member):')
  if (roles.length === 3 &&
      roles.some(r => r.slug === 'owner') &&
      roles.some(r => r.slug === 'admin') &&
      roles.some(r => r.slug === 'member')) {
    console.log('✅ Correto! Apenas permissões:')
    roles.forEach(r => console.log(`   - ${r.slug}: ${r.name}`))
  } else {
    console.log('❌ ERRO! Encontrados roles incorretos:')
    roles.forEach(r => console.log(`   - ${r.slug}: ${r.name}`))
  }

  // 2. Check job titles
  const { data: jobTitles, error: jtError } = await supabase
    .from('job_titles')
    .select('id, name, hierarchy_level')
    .order('hierarchy_level')

  if (jtError) {
    console.error('\n❌ Erro ao buscar job titles:', jtError.message)
    return
  }

  console.log(`\n2. JOB TITLES (cargos globais):`)
  if (jobTitles && jobTitles.length > 0) {
    console.log(`✅ Encontrados ${jobTitles.length} cargos:`)
    jobTitles.forEach(jt => console.log(`   - ${jt.name} (nível ${jt.hierarchy_level})`))
  } else {
    console.log('⚠️  Nenhum cargo cadastrado. Cadastre cargos na rota /admin')
  }

  // 3. Check workspace_members with invalid roles
  const { data: invalidMembers, error: invalidError } = await supabase
    .from('workspace_members')
    .select('id, role')
    .not('role', 'in', '(owner,admin,member)')
    .not('role', 'is', null)

  if (invalidError) {
    console.error('\n❌ Erro ao verificar workspace_members:', invalidError.message)
    return
  }

  console.log(`\n3. WORKSPACE MEMBERS COM ROLES INVÁLIDOS:`)
  if (invalidMembers.length === 0) {
    console.log('✅ Nenhum membro com role inválido')
  } else {
    console.log(`❌ Encontrados ${invalidMembers.length} membros com roles inválidos:`)
    invalidMembers.forEach(m => console.log(`   - Member ${m.id}: role="${m.role}"`))
  }

  console.log('\n=== Verificação Completa ===\n')
}

verify().catch(console.error)
