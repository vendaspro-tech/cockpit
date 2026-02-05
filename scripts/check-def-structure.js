#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDEF() {
  console.log('🔍 Checking DEF test structure...\n')

  const { data } = await supabase
    .from('test_structures')
    .select('structure')
    .eq('test_type', 'def_method')
    .single()

  if (!data) {
    console.log('❌ DEF not found')
    return
  }

  const s = data.structure
  console.log('Metadata:', JSON.stringify(s.metadata, null, 2))
  console.log('\nScoring:', JSON.stringify(s.scoring, null, 2))

  if (s.categories && s.categories.length > 0) {
    const cat = s.categories[0]
    console.log(`\nFirst category: ${cat.name}`)
    console.log(`Questions: ${cat.questions?.length || 0}`)

    if (cat.questions && cat.questions.length > 0) {
      console.log('\nFirst 3 questions:')
      cat.questions.slice(0, 3).forEach((q, idx) => {
        console.log(`\n${idx + 1}. ${q.text}`)
        console.log(`   Type: ${q.type}`)
        console.log(`   Metadata:`, JSON.stringify(q.metadata || {}, null, 2))
        console.log(`   Options:`, q.options?.length || 0)
        if (q.options) {
          console.log(JSON.stringify(q.options, null, 2))
        }
      })
    }
  }
}

checkDEF()
