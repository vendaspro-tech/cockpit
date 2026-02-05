/**
 * Script para popular frameworks de competência
 * Cria frameworks para todos os cargos que permitem senioridade
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env.local')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrado no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Competências DEF padrão (Método de Avaliação de Forças Comerciais)
const defaultDEFCompetencies = [
  {
    id: 1,
    name: 'Descoberta de Necessidades',
    description: 'Capacidade de identificar e entender as reais necessidades do cliente através de perguntas estratégicas e escuta ativa'
  },
  {
    id: 2,
    name: 'Educação e Consultoria',
    description: 'Habilidade em educar o cliente sobre o mercado e propor soluções que agreguem valor além do produto'
  },
  {
    id: 3,
    name: 'Valoração de Diferenciais',
    description: 'Competência para comunicar o valor único da solução e diferenciar-se da concorrência de forma relevante'
  },
  {
    id: 4,
    name: 'Negociação e Fechamento',
    description: 'Capacidade de conduzir o processo de negociação, superar objeções e fechar negócios de forma ética e eficiente'
  }
]

// Competências comportamentais padrão (para todos)
const defaultBehavioralCompetencies = [
  {
    id: 1,
    name: 'Comunicação Assertiva',
    description: 'Capacidade de se expressar de forma clara e respeitosa, defendendo seus pontos de vista',
    levels: {
      '1': 'Comunica-se basicamente, pode ter dificuldade em expressar opiniões',
      '2': 'Comunica-se de forma clara e assertiva na maioria das situações',
      '3': 'Comunicacao-exemplar, influencia positivamente através da comunicação'
    }
  },
  {
    id: 2,
    name: 'Resiliência e Adaptabilidade',
    description: 'Habilidade de lidar com rejeições, pressão e mudanças no ambiente de vendas',
    levels: {
      '1': 'Recuperação lenta após rejeições, dificuldade com mudanças',
      '2': 'Recupera-se bem, mantém foco mesmo sob pressão moderada',
      '3': 'Altamente resiliente, transforma obstáculos em oportunidades'
    }
  },
  {
    id: 3,
    name: 'Foco no Cliente',
    description: 'Orientação para entender e atender as necessidades do cliente',
    levels: {
      '1': 'Foco mais no produto/venda do que nas necessidades do cliente',
      '2': 'Busca entender o cliente e adaptar a abordagem quando necessário',
      '3': 'Totalmente cliente-centrico, antecipa necessidades não expressas'
    }
  }
]

// Competências de processo padrão (para todos)
const defaultProcessCompetencies = [
  {
    id: 1,
    name: 'Gestão de Pipeline',
    description: 'Capacidade de manter o funil de vendas alimentado e mover oportunidades',
    levels: {
      '1': 'Dificuldade em manter pipeline consistente',
      '2': 'Geria pipeline adequadamente, acompanha etapas do funil',
      '3': 'Pipeline sempre alimentado, excelente gestão de oportunidades'
    }
  },
  {
    id: 2,
    name: 'Organização e Planejamento',
    description: 'Capacidade de organizar rotinas, planejar atividades e metas',
    levels: {
      '1': 'Organização irregular, dificuldade em planejar',
      '2': 'Bem organizado, planeja semana e metas adequadamente',
      '3': 'Excelente organização, planejamento estratégico de curto e longo prazo'
    }
  }
]

// Scoring ranges padrão (Junior: 0-60, Pleno: 61-80, Senior: 81-100)
const defaultScoringRanges = {
  behavioral: {
    junior: [0, 60],
    pleno: [61, 80],
    senior: [81, 100]
  },
  technical_def: {
    junior: [0, 60],
    pleno: [61, 80],
    senior: [81, 100]
  },
  process: {
    junior: [0, 60],
    pleno: [61, 80],
    senior: [81, 100]
  },
  global: {
    junior: [0, 60],
    pleno: [61, 80],
    senior: [81, 100]
  }
}

async function main() {
  console.log('🚀 Iniciando criação de frameworks de competência...\n')

  try {
    // 1. Buscar todos os cargos globais que permitem senioridade
    const { data: jobTitles, error: jtError } = await supabase
      .from('job_titles')
      .select('*')
      .is('workspace_id', null)
      .eq('allows_seniority', true)

    if (jtError) throw jtError
    if (!jobTitles || jobTitles.length === 0) {
      console.log('❌ Nenhum cargo encontrado com allows_seniority = true')
      return
    }

    console.log(`✅ Encontrados ${jobTitles.length} cargos que permitem senioridade:\n`)

    // 2. Para cada cargo, verificar se já tem framework
    let created = 0
    let skipped = 0
    let errors = 0

    for (const jobTitle of jobTitles) {
      const { data: existingFramework } = await supabase
        .from('competency_frameworks')
        .select('id')
        .eq('job_title_id', jobTitle.id)
        .eq('is_template', true)
        .single()

      if (existingFramework) {
        console.log(`⏭️  SKIP: ${jobTitle.name} - Já possui framework`)
        skipped++
        continue
      }

      // Criar framework para o cargo
      const frameworkData = {
        workspace_id: null, // Global template
        job_title_id: jobTitle.id,
        name: `Matriz de Competências - ${jobTitle.name}`,
        weights: {
          behavioral: 0.50,
          technical_def: 0.30,
          process: 0.20
        },
        behavioral_competencies: defaultBehavioralCompetencies,
        technical_def_competencies: defaultDEFCompetencies,
        process_competencies: defaultProcessCompetencies,
        scoring_ranges: defaultScoringRanges,
        is_template: true,
        is_active: true,
        version: 1,
        published_at: new Date().toISOString()
      }

      const { data: newFramework, error: createError } = await supabase
        .from('competency_frameworks')
        .insert(frameworkData)
        .select('id, name')
        .single()

      if (createError) {
        console.log(`❌ ERROR: ${jobTitle.name} - ${createError.message}`)
        errors++
      } else {
        console.log(`✅ CREATED: ${jobTitle.name} - Framework ID: ${newFramework.id}`)
        created++
      }
    }

    console.log(`\n📊 RESUMO:`)
    console.log(`✅ Criados: ${created}`)
    console.log(`⏭️  Já existiam: ${skipped}`)
    console.log(`❌ Erros: ${errors}`)
    console.log(`\n🎉 Processo concluído!`)

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

main()
