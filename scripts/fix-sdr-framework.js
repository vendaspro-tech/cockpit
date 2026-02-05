/**
 * Script para corrigir frameworks de competência
 * Remove frameworks duplicados e cria os frameworks corretos
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Competências comportamentais específicas por cargo
const behavioralCompetenciesByRole = {
  'SDR': [
    {
      id: 1,
      name: 'Proatividade e Iniciativa',
      description: 'Capacidade de tomar iniciativa e buscar novas oportunidades de forma autônoma',
      levels: {
        '1': 'Aguarda instruções, raramente toma iniciativa',
        '2': 'Busca ativamente leads quando necessário',
        '3': 'Altamente proativo, identifica e cria oportunidades constantemente'
      }
    },
    {
      id: 2,
      name: 'Persistência e Resiliência',
      description: 'Habilidade de lidar com rejeições e manter o foco em objetivos de longo prazo',
      levels: {
        '1': 'Desanima facilmente com rejeições',
        '2': 'Mantém foco apesar dos desafios',
        '3': 'Extremamente resiliente, transforma objeções em oportunidades'
      }
    },
    {
      id: 3,
      name: 'Organização e Disciplina',
      description: 'Capacidade de manter rotinas organizadas e registrar atividades adequadamente',
      levels: {
        '1': 'Desorganizado, dificuldade em seguir processos',
        '2': 'Bem organizado, segue rotinas e processos',
        '3': 'Excelente organização, otimiza processos constantemente'
      }
    }
  ],
  'Closer': [
    {
      id: 1,
      name: 'Negociação e Persuasão',
      description: 'Capacidade de influenciar decisões e conduzir negociações complexas',
      levels: {
        '1': 'Dificuldade em lidar com objeções e fechamentos',
        '2': 'Negocia bem a maioria dos deals, supera objeções comuns',
        '3': 'Excelente negociador, fecha deals complexos e transforma objeções em oportunidades'
      }
    },
    {
      id: 2,
      name: 'Visão de Longo Prazo',
      description: 'Capacidade de construir relacionamentos duradouros e maximizar LTV',
      levels: {
        '1': 'Focado apenas no fechamento imediato',
        '2': 'Constrói relacionamentos, busca upsell e cross-sell',
        '3': 'Visionário, constrói parcerias estratégicas de longo prazo'
      }
    },
    {
      id: 3,
      name: 'Autonomia e Tomada de Decisão',
      description: 'Capacidade de atuar de forma independente e tomar decisões estratégicas',
      levels: {
        '1': 'Depende de aprovação para decisões',
        '2': 'Autônomo na maioria das situações',
        '3': 'Totalmente autônomo, orienta outros e toma decisões estratégicas'
      }
    }
  ]
}

// Competências de processo específicas por cargo
const processCompetenciesByRole = {
  'SDR': [
    {
      id: 1,
      name: 'Qualificação de Leads',
      description: 'Capacidade de identificar e qualificar leads com potencial de conversão',
      levels: {
        '1': 'Dificuldade em filtrar leads qualificados',
        '2': 'Qualifica leads adequadamente seguindo critérios',
        '3': 'Excelente critério, identifica oportunidades de alto valor'
      }
    },
    {
      id: 2,
      name: 'Gestão de CRM',
      description: 'Capacidade de manter CRM atualizado e organizado',
      levels: {
        '1': 'Registro irregular de atividades',
        '2': 'CRM bem mantido e atualizado',
        '3': 'CRM impecável, dados enriquecidos com insights'
      }
    }
  ],
  'Closer': [
    {
      id: 1,
      name: 'Fechamento de Negócios',
      description: 'Capacidade de conduzir o processo de closing até a assinatura',
      levels: {
        '1': 'Perde oportunidades por falta de follow-up',
        '2': 'Conduz closing process adequadamente',
        '3': 'Expert em closing, acelera decisões e supera objeções complexas'
      }
    },
    {
      id: 2,
      name: 'Expansão de Conta (Upsell/Cross-sell)',
      description: 'Capacidade de identificar oportunidades de expansão com clientes atuais',
      levels: {
        '1': 'Focado apenas em novos negócios',
        '2': 'Identifica oportunidades de expansão',
        '3': 'Expert em account growth, maximiza revenue por cliente'
      }
    }
  ]
}

async function main() {
  console.log('🔍 Diagnosticando e corrigindo frameworks...\n')

  try {
    // 1. Verificar frameworks existentes
    const { data: existingFrameworks } = await supabase
      .from('competency_frameworks')
      .select('id, name, job_title_id, job_titles(name)')
      .eq('is_template', true)
      .eq('is_active', true)

    console.log('Frameworks existentes:')
    existingFrameworks?.forEach(fw => {
      console.log(`  - ${fw.name} (${fw.job_titles?.name})`)
    })

    // 2. Ver quais job_titles existem
    const { data: jobTitles } = await supabase
      .from('job_titles')
      .select('id, name, slug, allows_seniority')
      .is('workspace_id', null)
      .order('name')

    console.log('\n📋 Cargos encontrados:')
    jobTitles?.forEach(jt => {
      const hasFw = existingFrameworks?.find(fw => fw.job_title_id === jt.id)
      console.log(`  ${hasFw ? '✅' : '❌'} ${jt.name}${jt.allows_seniority ? ' (permite senioridade)' : ''}`)
    })

    // 3. Deletar framework duplicado do SDR
    const sdrJobTitle = jobTitles?.find(jt => jt.slug === 'sdr')
    if (sdrJobTitle) {
      const { data: sdrFrameworks } = await supabase
        .from('competency_frameworks')
        .select('*')
        .eq('job_title_id', sdrJobTitle.id)
        .eq('is_template', true)

      if (sdrFrameworks && sdrFrameworks.length > 0) {
        console.log(`\n🗑️  Deletando ${sdrFrameworks.length} framework(s) do SDR (duplicado)...`)
        for (const fw of sdrFrameworks) {
          await supabase.from('competency_frameworks').delete().eq('id', fw.id)
          console.log(`  - Deletado: ${fw.name}`)
        }
      }
    }

    // 4. Criar framework correto para SDR
    if (sdrJobTitle && sdrJobTitle.allows_seniority) {
      console.log('\n✅ Criando framework correto para SDR...')

      const frameworkData = {
        workspace_id: null,
        job_title_id: sdrJobTitle.id,
        name: 'Matriz de Competências - SDR',
        weights: {
          behavioral: 0.50,
          technical_def: 0.30,
          process: 0.20
        },
        behavioral_competencies: behavioralCompetenciesByRole.SDR,
        technical_def_competencies: [
          {
            id: 1,
            name: 'Prospecção e Pesquisa',
            description: 'Capacidade de buscar informações sobre prospects e empresas',
            levels: {
              '1': 'Pesquisa básica sobre empresas',
              '2': 'Boa pesquisa, identifica tomadores de decisão',
              '3': 'Pesquisa avançada, mapeia estrutura organizacional completa'
            }
          },
          {
            id: 2,
            name: 'Abordagem e Cold Calling',
            description: 'Habilidade em fazer primeiro contato e despertar interesse',
            levels: {
              '1': 'Abordagem genérica, baixa taxa de resposta',
              '2': 'Abordagem personalizada, boa taxa de resposta',
              '3': 'Abordagem estratégica, altíssima taxa de engajamento'
            }
          },
          {
            id: 3,
            name: 'Qualificação e Descoberta',
            description: 'Capacidade de entender necessidades e dores do prospect',
            levels: {
              '1': 'Perguntas superficiais sobre necessidades',
              '2': 'Boa descoberta de necessidades e dores',
              '3': 'Descoberta profunda, identifica necessidades não explícitas'
            }
          },
          {
            id: 4,
            name: 'Follow-up e Nutrição',
            description: 'Persistência e habilidade de nutrir lead ao longo do ciclo',
            levels: {
              '1': 'Follow-up irregular, desiste facilmente',
              '2': 'Follow-up consistente e bem planejado',
              '3': 'Nutrição excepcional, constrói relacionamento desde o primeiro contato'
            }
          }
        ],
        process_competencies: processCompetenciesByRole.SDR,
        scoring_ranges: {
          behavioral: { junior: [0, 60], pleno: [61, 80], senior: [81, 100] },
          technical_def: { junior: [0, 60], pleno: [61, 80], senior: [81, 100] },
          process: { junior: [0, 60], pleno: [61, 80], senior: [81, 100] },
          global: { junior: [0, 60], pleno: [61, 80], senior: [81, 100] }
        },
        is_template: true,
        is_active: true,
        version: 1,
        published_at: new Date().toISOString()
      }

      const { data: newFramework, error } = await supabase
        .from('competency_frameworks')
        .insert(frameworkData)
        .select('id, name')
        .single()

      if (error) {
        console.log('❌ Erro ao criar framework SDR:', error.message)
      } else {
        console.log(`✅ Criado: ${newFramework.name} (ID: ${newFramework.id})`)
      }
    }

    // 5. Verificar frameworks faltantes para outros cargos
    const jobsWithoutFrameworks = jobTitles?.filter(jt =>
      jt.allows_seniority && !existingFrameworks?.find(fw => fw.job_title_id === jt.id)
    )

    if (jobsWithoutFrameworks && jobsWithoutFrameworks.length > 0) {
      console.log('\n⚠️  Cargos SEM framework (permitem senioridade):')
      jobsWithoutFrameworks.forEach(jt => {
        console.log(`  - ${jt.name}`)
      })
      console.log('\n📝 Estes cargos precisam de frameworks específicos criados manualmente')
    }

    console.log('\n🎉 Processo concluído!')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

main()
