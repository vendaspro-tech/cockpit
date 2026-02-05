#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function touchStructures() {
  console.log('🔄 Forcing cache invalidation by updating updated_at...\n')

  // Get all structures first
  const { data: structures } = await supabase
    .from('test_structures')
    .select('id, test_type')

  if (!structures) {
    console.error('❌ No structures found')
    return
  }

  // Update each one individually
  for (const struct of structures) {
    const { error } = await supabase
      .from('test_structures')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', struct.id)

    if (error) {
      console.error(`❌ Error updating ${struct.test_type}:`, error)
    } else {
      console.log(`✅ Updated ${struct.test_type}`)
    }
  }

  console.log('\n✅ Cache invalidation complete!')
  console.log('🔄 Now hard reload the page in browser (Ctrl/Cmd + Shift + R)')
}

touchStructures()
