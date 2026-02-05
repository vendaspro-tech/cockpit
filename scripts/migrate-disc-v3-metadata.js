#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔄 MIGRANDO DISC v2 → v3: Adicionando metadata.profile\n')

// Profile mapping for statements based on their IDs
// Pattern: q{number}_{profile} where profile is d, i, s, or c
function getProfileFromStatementId(statementId) {
  const parts = statementId.split('_')
  const profileLetter = parts[parts.length - 1] // Get last part

  const profileMap = {
    'd': 'D',
    'i': 'I',
    's': 'S',
    'c': 'C'
  }

  return profileMap[profileLetter] || null
}

async function migrateDISCv3() {
  console.log('📋 Buscando estrutura DISC v2 (matrix_rating)\n')

  // 1. Buscar estrutura atual (v2 com matrix_rating)
  const { data: currentData, error: fetchError } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', 'disc')
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (fetchError) {
    console.error('❌ Erro ao buscar estrutura DISC:', fetchError)
    process.exit(1)
  }

  if (!currentData) {
    console.error('❌ Estrutura DISC não encontrada')
    process.exit(1)
  }

  console.log(`✅ Versão atual encontrada: v${currentData.version}`)
  console.log(`✅ ID: ${currentData.id}`)

  // 2. Adicionar metadata.profile a cada statement
  const currentStructure = currentData.structure
  let statementsWithMetadata = 0
  let totalStatements = 0

  console.log('\n🔧 Processando categorias e questões...\n')

  const newStructure = {
    ...currentStructure,
    categories: currentStructure.categories.map(category => ({
      ...category,
      questions: category.questions.map(question => {
        if (question.matrix_config && question.matrix_config.statements) {
          console.log(`  Processando questão ${question.id}: ${question.text.substring(0, 50)}...`)

          return {
            ...question,
            matrix_config: {
              ...question.matrix_config,
              statements: question.matrix_config.statements.map(statement => {
                totalStatements++

                const profile = getProfileFromStatementId(statement.id)

                if (profile) {
                  statementsWithMetadata++
                  console.log(`    ✓ ${statement.id} → profile: ${profile}`)

                  return {
                    ...statement,
                    // Remove label if it's D, I, S, C (biased)
                    label: statement.label && ['D', 'I', 'S', 'C'].includes(statement.label)
                      ? undefined
                      : statement.label,
                    metadata: {
                      profile: profile,
                      scoring_key: `disc_${profile.toLowerCase()}`
                    }
                  }
                } else {
                  console.log(`    ⚠️  ${statement.id} → profile não identificado`)
                  return statement
                }
              })
            }
          }
        }
        return question
      })
    }))
  }

  console.log(`\n✅ Processamento concluído:`)
  console.log(`   Total de statements: ${totalStatements}`)
  console.log(`   Statements com metadata.profile: ${statementsWithMetadata}`)
  console.log(`   Coverage: ${((statementsWithMetadata / totalStatements) * 100).toFixed(1)}%\n`)

  if (statementsWithMetadata === 0) {
    console.error('❌ Nenhum metadata.profile foi adicionado. Verificando estrutura...')
    console.log('   Primeira categoria:', currentStructure.categories[0]?.name)
    console.log('   Primeira questão:', currentStructure.categories[0]?.questions[0]?.id)
    console.log('   Tem matrix_config?', !!currentStructure.categories[0]?.questions[0]?.matrix_config)
    console.log('   Statements:', currentStructure.categories[0]?.questions[0]?.matrix_config?.statements?.length || 0)
    process.exit(1)
  }

  // 3. Criar nova versão v3
  const newVersion = currentData.version + 1

  console.log(`💾 Criando versão v${newVersion}...\n`)

  const { data: newData, error: insertError } = await supabase
    .from('test_structures')
    .insert({
      test_type: 'disc',
      structure: newStructure,
      version: newVersion,
      is_active: false,  // Começa como INATIVO para review
      parent_structure_id: currentData.id,
      changelog: 'Added metadata.profile to all matrix statements (96 total). Removed biased D/I/S/C labels. Profile now stored internally in metadata for scoring calculation.',
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Erro ao criar nova versão:', insertError)
    process.exit(1)
  }

  console.log(`✅ Nova versão v${newVersion} criada (ID: ${newData.id})`)
  console.log(`⚠️  Status: INATIVO - review necessário antes de ativar\n`)

  // 4. Verificar estrutura criada
  console.log('📋 VERIFICAÇÃO DA ESTRUTURA CRIADA:')
  const firstQuestion = newData.structure.categories[0]?.questions[0]
  if (firstQuestion?.matrix_config?.statements) {
    console.log('   Primeira questão como exemplo:\n')
    firstQuestion.matrix_config.statements.forEach(stmt => {
      console.log(`   ${stmt.id}:`)
      console.log(`     Label: ${stmt.label || '(omitido)'} ✓`)
      console.log(`     Metadata: ${JSON.stringify(stmt.metadata)}`)
      console.log(`     Text: ${stmt.text.substring(0, 60)}...`)
      console.log('')
    })
  }

  // 5. Resumo
  console.log('📋 RESUMO DA MIGRAÇÃO:')
  console.log(`   Versão anterior: v${currentData.version} (ID: ${currentData.id})`)
  console.log(`   Nova versão: v${newVersion} (ID: ${newData.id})`)
  console.log(`   Statements processados: ${totalStatements}`)
  console.log(`   Metadata adicionado: ${statementsWithMetadata}`)
  console.log(`   Labels D/I/S/C removidos: sim\n`)

  console.log('📝 PRÓXIMOS PASSOS:')
  console.log('   1. Acesse /admin/test-structures')
  console.log('   2. Encontre o DISC com versão mais recente (v' + newVersion + ')')
  console.log('   3. Clique em "Estrutura" para verificar metadata.profile')
  console.log('   4. Clique em "Preview" para ver como ficará pro usuário')
  console.log('   5. Se tudo estiver correto, ATIVE a nova versão')
  console.log('   6. Atualize app/actions/assessments.ts para usar metadata.profile\n')
}

migrateDISCv3()
