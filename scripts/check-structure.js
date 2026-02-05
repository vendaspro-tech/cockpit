#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStructures() {
  console.log('🔍 Checking test structures...\n')

  const { data: structures } = await supabase
    .from('test_structures')
    .select('test_type, structure')
    .order('test_type')

  for (const struct of structures || []) {
    console.log(`\n📋 ${struct.test_type.toUpperCase()}`)
    console.log('=' .repeat(50))

    const s = struct.structure
    console.log(`Metadata: ${JSON.stringify(s.metadata, null, 2)}`)
    console.log(`\nCategories: ${s.categories?.length || 0}`)

    if (s.categories && s.categories.length > 0) {
      const cat = s.categories[0]
      console.log(`\nFirst category:`)
      console.log(`  ID: ${cat.id}`)
      console.log(`  Name: ${cat.name}`)
      console.log(`  Questions: ${cat.questions?.length || 0}`)

      if (cat.questions && cat.questions.length > 0) {
        console.log(`\nFirst question:`)
        console.log(JSON.stringify(cat.questions[0], null, 2))
      }
    }

    console.log(`\nScoring method: ${s.scoring?.method}`)
  }
}

checkStructures()
