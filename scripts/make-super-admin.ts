import { createClient } from '@supabase/supabase-js'

import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const envConfig: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    envConfig[key] = value
  }
})

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeSuperAdmin(email: string) {
  console.log(`Making user ${email} a super admin...`)

  // 1. Find user by email
  const { data: users, error: findError } = await supabase
    .from('users')
    .select('id, email, is_super_admin')
    .eq('email', email)

  if (findError) {
    console.error('Error finding user:', findError)
    return
  }

  if (!users || users.length === 0) {
    console.error('User not found')
    return
  }

  const user = users[0]
  console.log('Found user:', user)

  if (user.is_super_admin) {
    console.log('User is already a super admin')
    return
  }

  // 2. Update user
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_super_admin: true })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating user:', updateError)
    return
  }

  console.log('Successfully made user a super admin!')
}

const email = process.argv[2]
if (!email) {
  console.error('Please provide an email address as an argument')
  process.exit(1)
}

makeSuperAdmin(email)
