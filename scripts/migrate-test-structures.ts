import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateTestStructures() {
  console.log('🔄 Starting test structures migration...')

  const sqlFile = path.join(process.cwd(), 'EXECUTE_MIGRATION_TEST_STRUCTURES.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')

  // Split by semicolons to execute statements one by one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement.includes('SELECT')) {
      // Verification query
      console.log(`\n✅ Executing verification query...`)
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        console.error('❌ Error:', error)
      } else {
        console.log('📊 Results:', data)
      }
    } else {
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        console.error('❌ Error on statement', i + 1, ':', error)
        console.error('Statement:', statement.substring(0, 200) + '...')
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
  }

  console.log('\n✅ Migration complete!')
}

// Run migration
migrateTestStructures().catch(console.error)
