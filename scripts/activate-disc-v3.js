#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔄 ATIVANDO DISC v3\n')

async function activateDISCv3() {
  // 1. List all DISC versions
  const { data: allVersions, error: listError } = await supabase
    .from('test_structures')
    .select('id, version, is_active, updated_at')
    .eq('test_type', 'disc')
    .order('version', { ascending: true })

  if (listError) {
    console.error('❌ Erro ao listar versões:', listError)
    process.exit(1)
  }

  console.log('📋 Versões DISC encontradas:')
  allVersions.forEach(v => {
    const status = v.is_active ? '✅ ATIVO' : '⚪ INATIVO'
    const date = v.updated_at ? new Date(v.updated_at).toLocaleDateString('pt-BR') : 'N/A'
    console.log(`   v${v.version} (${v.id}) - ${status} - ${date}`)
  })
  console.log('')

  // 2. Find v3
  const v3 = allVersions.find(v => v.version === 3)
  if (!v3) {
    console.error('❌ DISC v3 não encontrado!')
    process.exit(1)
  }

  if (v3.is_active) {
    console.log('✅ DISC v3 já está ATIVO\n')
    return
  }

  // 3. Deactivate all other versions
  console.log('🔧 Desativando todas as versões DISC...')
  const { error: deactivateError } = await supabase
    .from('test_structures')
    .update({ is_active: false })
    .eq('test_type', 'disc')

  if (deactivateError) {
    console.error('❌ Erro ao desativar versões:', deactivateError)
    process.exit(1)
  }

  console.log('✅ Todas as versões desativadas\n')

  // 4. Activate v3
  console.log(`✨ Ativando DISC v3 (ID: ${v3.id})...`)
  const { error: activateError } = await supabase
    .from('test_structures')
    .update({ is_active: true })
    .eq('id', v3.id)

  if (activateError) {
    console.error('❌ Erro ao ativar v3:', activateError)
    process.exit(1)
  }

  console.log('✅ DISC v3 ativado com sucesso!\n')

  // 5. Verify activation
  const { data: activeVersion } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', 'disc')
    .eq('is_active', true)
    .single()

  if (activeVersion) {
    console.log('📋 VERSÃO ATIVA ATUAL:')
    console.log(`   Versão: v${activeVersion.version}`)
    console.log(`   ID: ${activeVersion.id}`)
    console.log(`   Changelog: ${activeVersion.changelog || 'N/A'}`)
    console.log('')

    // Check structure
    const firstQuestion = activeVersion.structure.categories[0]?.questions[0]
    if (firstQuestion?.matrix_config?.statements) {
      console.log('✅ Estrutura verificada:')
      console.log(`   Tipo: matrix_rating`)
      console.log(`   Questões: ${activeVersion.structure.categories[0].questions.length}`)
      console.log(`   Statements por questão: ${firstQuestion.matrix_config.statements.length}`)
      console.log('')

      console.log('   Exemplo da primeira questão:')
      firstQuestion.matrix_config.statements.forEach(stmt => {
        const metadata = stmt.metadata ? JSON.stringify(stmt.metadata) : 'N/A'
        console.log(`   ${stmt.id}:`)
        console.log(`     Label: ${stmt.label || '(omitido)'} ✓`)
        console.log(`     Metadata: ${metadata}`)
        console.log('')
      })
    }

    console.log('🎉 DISC v3 está pronto para uso!')
    console.log('\n📝 PRÓXIMOS PASSOS:')
    console.log('   1. Inicie o dev server: npm run dev')
    console.log('   2. Acesse /admin/test-structures')
    console.log('   3. Verifique se DISC v3 aparece como ATIVO')
    console.log('   4. Crie uma nova avaliação DISC para testar')
    console.log('   5. Verifique se as 24 questões aparecem com 4 afirmações cada')
    console.log('   6. Responda e verifique se o cálculo usa metadata.profile\n')
  }
}

activateDISCv3()
