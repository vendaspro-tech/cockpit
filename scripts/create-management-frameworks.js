/**
 * Script para criar frameworks de competência para cargos de gestão
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Competências comportamentais específicas para gestão
const behavioralCompetenciesByRole = {
  'Gerente Comercial': [
    {
      id: 1,
      name: 'Visão Estratégica',
      description: 'Capacidade de pensar estrategicamente e antecipar tendências de mercado',
      levels: {
        '1': 'Focado no operacional, dificuldade em visão de longo prazo',
        '2': 'Consegue planejar estratégias trimestrais, alinha com objetivos do negócio',
        '3': 'Visionário, antecipa tendências, cria estratégias de longo prazo e inova'
      }
    },
    {
      id: 2,
      name: 'Liderança de Pessoas',
      description: 'Capacidade de inspirar, desenvolver e reter talentos',
      levels: {
        '1': 'Dificuldade em gerir equipes, foca apenas em resultados',
        '2': 'Lidera equipes de forma eficaz, desenvolve some talentos',
        '3': 'Líder transformacional, desenvolve sucessores, cria cultura de alta performance'
      }
    },
    {
      id: 3,
      name: 'Tomada de Decisão',
      description: 'Capacidade de tomar decisões complexas sob pressão',
      levels: {
        '1': 'Decisões inconsistentes, hesita em situações críticas',
        '2': 'Toma decisões sólidas baseadas em dados, equilibra riscos',
        '3': 'Decisões excepcionais sob pressão, aprende com erros, inova'
      }
    }
  ],
  'Coordenador Comercial': [
    {
      id: 1,
      name: 'Gestão de Equipes',
      description: 'Capacidade de coordenar e motivar equipes de vendas',
      levels: {
        '1': 'Dificuldade em gerir conflitos e coordenar equipe',
        '2': 'Coordena equipe eficazmente, resolve conflitos, mantém motivação',
        '3': 'Excelente gestor de pessoas, desenvolve talentos, cria ambiente colaborativo'
      }
    },
    {
      id: 2,
      name: 'Execução Tática',
      description: 'Capacidade de traduzir estratégia em planos de ação executáveis',
      levels: {
        '1': 'Dificuldade em operacionalizar estratégias',
        '2': 'Consegue transformar estratégias em planos táticos claros',
        '3': 'Excelente execução tática, otimiza processos constantemente'
      }
    },
    {
      id: 3,
      name: 'Análise de Performance',
      description: 'Capacidade de analisar métricas e implementar melhorias',
      levels: {
        '1': 'Análise superficial de métricas',
        '2': 'Analisa métricas detalhadamente, implementa melhorias',
        '3': 'Analítica avançada, previsiva, insights acionáveis'
      }
    }
  ],
  'Supervisor Comercial': [
    {
      id: 1,
      name: 'Supervisão de Campo',
      description: 'Capacidade de acompanhar e orientar vendedores em campo',
      levels: {
        '1': 'Dificuldade em dar feedback e acompanhar equipe',
        '2': 'Acompanha equipe regularmente, dá feedback construtivo',
        '3': 'Mentor excepcional, desenvolve habilidades da equipe constantemente'
      }
    },
    {
      id: 2,
      name: 'Gestão de Metas',
      description: 'Capacidade de definir, acompanhar e atingir metas de equipe',
      levels: {
        '1': 'Dificuldade em definir e acompanhar metas',
        '2': 'Define metas claras, acompanha progressiono',
        '3': 'Excelente gestão de metas, antecipa desvios, ações corretivas eficazes'
      }
    },
    {
      id: 3,
      name: 'Treinamento e Desenvolvimento',
      description: 'Capacidade de treinar e desenvolver a equipe',
      levels: {
        '1': 'Treinamentos básicos e pouco frequentes',
        '2': 'Treina equipe regularmente, desenvolve competências',
        '3': 'Programa de desenvolvimento robusto, cria trilhas de aprendizado'
      }
    }
  ]
}

// Competências DEF comuns para gestão
const technicalDefCompetencies = [
  {
    id: 1,
    name: 'Gestão de Funil de Vendas',
    description: 'Capacidade de gerenciar e otimizar o funil de vendas da equipe',
    levels: {
      '1': 'Dificuldade em visualizar e gerenciar o funil',
      '2': 'Gerencia funil eficazmente, identifica gargalos',
      '3': 'Otimiza funil continuamente, melhora taxas de conversão'
    }
  },
  {
    id: 2,
    name: 'Estratégia de Negociação',
    description: 'Capacidade de definir e ensinar estratégias de negociação',
    levels: {
      '1': 'Pouca experiência em negociação complexa',
      '2': 'Domina técnicas de negociação, treina equipe',
      '3': 'Estrategista de negociação avançado, inova em técnicas'
    }
  },
  {
    id: 3,
    name: 'Análise de Mercado',
    description: 'Capacidade de analisar mercado e concorrência',
    levels: {
      '1': 'Pouco conhecimento de mercado',
      '2': 'Analisa mercado regularmente, identifica oportunidades',
      '3': 'Visionário de mercado, antecipa movimentos competitivos'
    }
  },
  {
    id: 4,
    name: 'Previsão de Vendas',
    description: 'Capacidade de prever resultados com precisão',
    levels: {
      '1': 'Previsões imprecisas, alta variabilidade',
      '2': 'Previsões reasonably precisas (80-85%)',
      '3': 'Previsões altamente precisas (90%+), modelos avançados'
    }
  }
]

// Competências de processo para gestão
const processCompetenciesByRole = {
  'Gerente Comercial': [
    {
      id: 1,
      name: 'Planejamento Estratégico',
      description: 'Capacidade de criar e executar planos estratégicos',
      levels: {
        '1': 'Planos pouco estruturados e sem follow-up',
        '2': 'Planos estratégicos bem estruturados e executados',
        '3': 'Planejamento excepcional, execution consistente e ajustes ágeis'
      }
    },
    {
      id: 2,
      name: 'Gestão de Performance',
      description: 'Capacidade de medir e melhorar performance da equipe',
      levels: {
        '1': 'Avaliações pouco frequentes e sem critérios claros',
        '2': 'Avaliações regulares com critérios objetivos',
        '3': 'Sistema robusto de performance, desenvolvimento contínuo'
      }
    }
  ],
  'Coordenador Comercial': [
    {
      id: 1,
      name: 'Gestão de CRM',
      description: 'Capacidade de garantir uso eficaz de CRM pela equipe',
      levels: {
        '1': 'Baixa adoção de CRM pela equipe',
        '2': 'Equipe usa CRM regularmente, dados confiáveis',
        '3': 'CRM como ferramenta estratégica, insights acionáveis'
      }
    },
    {
      id: 2,
      name: 'Reuniões e Syncs',
      description: 'Capacidade de conduzir reuniões produtivas',
      levels: {
        '1': 'Reuniões improdutivas e sem foco',
        '2': 'Reuniões estruturadas e com resultados',
        '3': 'Reuniões excepcionalmente produtivas, cultura de feedback'
      }
    }
  ],
  'Supervisor Comercial': [
    {
      id: 1,
      name: 'Acompanhamento Diário',
      description: 'Capacidade de acompanhar atividades diárias da equipe',
      levels: {
        '1': 'Pouco acompanhamento do dia a dia',
        '2': 'Acompanhamento regular e proativo',
        '3': 'Acompanhamento excepcional, coaching constante'
      }
    },
    {
      id: 2,
      name: 'Gestão de Crises',
      description: 'Capacidade de lidar com problemas urgentes',
      levels: {
        '1': 'Dificuldade em resolver crises',
        '2': 'Resolve crises de forma eficaz',
        '3': 'Excelente em crises, aprende e previne problemas'
      }
    }
  ]
}

async function main() {
  console.log('🔧 Criando frameworks para cargos de gestão...\n')

  const roles = ['Gerente Comercial', 'Coordenador Comercial', 'Supervisor Comercial']

  for (const roleName of roles) {
    // Buscar job title
    const { data: jobTitle } = await supabase
      .from('job_titles')
      .select('id, name, slug')
      .eq('name', roleName)
      .single()

    if (!jobTitle) {
      console.log(`⚠️  Cargo não encontrado: ${roleName}`)
      continue
    }

    // Verificar se já existe framework
    const { data: existingFramework } = await supabase
      .from('competency_frameworks')
      .select('id, name')
      .eq('job_title_id', jobTitle.id)
      .eq('is_template', true)
      .eq('is_active', true)
      .single()

    if (existingFramework) {
      console.log(`ℹ️  ${roleName} já tem framework: ${existingFramework.name}`)
      continue
    }

    // Criar framework
    console.log(`\n📝 Criando framework para ${roleName}...`)

    const frameworkData = {
      job_title_id: jobTitle.id,
      name: `Matriz de Competências - ${roleName}`,
      weights: {
        behavioral: 0.50,
        technical_def: 0.30,
        process: 0.20
      },
      behavioral_competencies: behavioralCompetenciesByRole[roleName],
      technical_def_competencies: technicalDefCompetencies,
      process_competencies: processCompetenciesByRole[roleName],
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
      console.log(`❌ Erro ao criar framework para ${roleName}:`, error.message)
    } else {
      console.log(`✅ Criado: ${newFramework.name} (ID: ${newFramework.id.slice(0, 8)}...)`)
    }
  }

  console.log('\n🎉 Processo concluído!')
}

main()
