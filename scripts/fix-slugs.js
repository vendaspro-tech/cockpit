require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔧 Corrigindo slugs de job_titles...\n')

  // Buscar todos os job titles
  const { data: jobTitles, error } = await supabase
    .from('job_titles')
    .select('id, name, slug')
    .order('name')

  if (error) {
    console.error('Erro ao buscar job titles:', error)
    return
  }

  // Função para criar slug a partir do nome
  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
  }

  let count = 0

  for (const job of jobTitles || []) {
    // Se slug for null ou vazio, criar um novo
    if (!job.slug) {
      const newSlug = createSlug(job.name)

      console.log(`Atualizando ${job.name}:`)
      console.log(`  Slug antigo: ${job.slug || 'null'}`)
      console.log(`  Slug novo: ${newSlug}`)

      const { error: updateError } = await supabase
        .from('job_titles')
        .update({ slug: newSlug })
        .eq('id', job.id)

      if (updateError) {
        console.log(`  ❌ Erro: ${updateError.message}`)
      } else {
        console.log(`  ✅ Atualizado!`)
        count++
      }
      console.log()
    }
  }

  console.log(`\n✅ Total de ${count} job titles atualizados!`)
}

main()
