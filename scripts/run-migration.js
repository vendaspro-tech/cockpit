#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateTestStructures() {
  console.log('🔄 Starting test structures migration...\n')

  try {
    // DISC Test
    console.log('1️⃣ Migrating DISC test...')
    const discUpdate = await supabase.rpc('update_disc_structure')
    if (discUpdate.error) console.log('Note:', discUpdate.error.message)
    else console.log('✅ DISC migrated')

    // Since RPC won't work, let's update directly via JavaScript
    console.log('\n2️⃣ Fetching existing test structures...')
    const { data: structures, error: fetchError } = await supabase
      .from('test_structures')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching structures:', fetchError)
      return
    }

    console.log(`📦 Found ${structures.length} test structures\n`)

    for (const struct of structures) {
      console.log(`\n🔧 Processing ${struct.test_type}...`)

      const oldStructure = struct.structure
      const newStructure = {
        metadata: {
          name: oldStructure.title || `Test ${struct.test_type}`,
          description: oldStructure.description || '',
          instructions: 'Complete todas as questões.',
          estimated_duration_minutes: 15
        },
        categories: [],
        scoring: {
          method: 'sum',
          category_weights: {},
          scale: {
            min: oldStructure.scale?.min || 1,
            max: oldStructure.scale?.max || 5,
            labels: {
              min: oldStructure.scale?.labels?.['1'] || 'Mínimo',
              max: oldStructure.scale?.labels?.['5'] || 'Máximo'
            }
          },
          ranges: []
        }
      }

      // Process categories
      if (oldStructure.categories) {
        newStructure.categories = oldStructure.categories.map((cat, catIdx) => {
          const category = {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            order: catIdx,
            questions: []
          }

          // Process questions
          if (cat.questions) {
            category.questions = cat.questions.map((q, qIdx) => {
              const question = {
                id: q.id,
                text: q.text,
                type: struct.test_type === 'disc' ? 'single_choice' : 'scale',
                order: qIdx,
                required: true
              }

              // Add options for choice questions
              if (struct.test_type === 'disc') {
                question.options = [
                  { id: 'opt_d', label: 'Opção D', value: 1, order: 0 },
                  { id: 'opt_i', label: 'Opção I', value: 2, order: 1 },
                  { id: 'opt_s', label: 'Opção S', value: 3, order: 2 },
                  { id: 'opt_c', label: 'Opção C', value: 4, order: 3 }
                ]
              }

              return question
            })
          }

          return category
        })
      }

      // Update the structure
      const { error: updateError } = await supabase
        .from('test_structures')
        .update({ structure: newStructure })
        .eq('id', struct.id)

      if (updateError) {
        console.error(`❌ Error updating ${struct.test_type}:`, updateError)
      } else {
        console.log(`✅ ${struct.test_type} migrated successfully`)
      }
    }

    console.log('\n✅ Migration complete!')

    // Verify
    console.log('\n🔍 Verifying migration...')
    const { data: verified } = await supabase
      .from('test_structures')
      .select('test_type, structure')

    for (const v of verified || []) {
      const hasMetadata = !!v.structure.metadata
      const hasScoring = !!v.structure.scoring
      const firstQType = v.structure.categories?.[0]?.questions?.[0]?.type
      console.log(`${hasMetadata && hasScoring && firstQType ? '✅' : '❌'} ${v.test_type}: metadata=${hasMetadata}, scoring=${hasScoring}, question_type=${firstQType}`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

migrateTestStructures()
