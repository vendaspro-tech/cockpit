#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔄 MIGRANDO DISC PARA MATRIX_RATING\n')

// All 24 DISC questions from documentation
const DISC_QUESTIONS = [
  {
    situation: 'Quando recebo uma lista de leads para prospectar, eu:',
    D: 'Começo imediatamente pelos contatos de maior potencial, priorizando resultados rápidos',
    I: 'Pesquiso sobre as empresas para encontrar formas criativas de iniciar conversas',
    S: 'Organizo metodicamente minha abordagem, seguindo o script e processo estabelecido',
    C: 'Analiso detalhadamente cada lead, segmentando por critérios específicos antes de começar'
  },
  {
    situation: 'Em uma negociação difícil com objeções fortes, eu:',
    D: 'Confronto as objeções diretamente, mostrando dados que provam o valor da solução',
    I: 'Uso storytelling e casos de sucesso para reconquistar o interesse do prospect',
    S: 'Escuto pacientemente todas as preocupações e busco construir confiança gradualmente',
    C: 'Preparo respostas técnicas detalhadas para cada objeção específica'
  },
  {
    situation: 'Quando trabalho em equipe comercial, eu:',
    D: 'Assumo a liderança e direciono o time para bater as metas estabelecidas',
    I: 'Motivo o grupo e crio um ambiente colaborativo e energizante',
    S: 'Apoio os colegas e mantenho a harmonia, garantindo que todos contribuam',
    C: 'Organizo processos e garanto que seguimos as melhores práticas'
  },
  {
    situation: 'Diante de uma meta agressiva no trimestre, minha reação é:',
    D: '"Vamos acelerar! Quero ser o top performer e vou fazer o que for necessário"',
    I: '"Que desafio empolgante! Vou usar minha criatividade para encontrar novas oportunidades"',
    S: '"Vou manter meu ritmo consistente e contar com o apoio do time"',
    C: '"Preciso analisar os números e criar uma estratégia realista e mensurável"'
  },
  {
    situation: 'Ao fazer follow-up com prospects, eu:',
    D: 'Sou direto e objetivo, perguntando claramente sobre a decisão de compra',
    I: 'Uso mensagens personalizadas e amigáveis para manter o relacionamento aquecido',
    S: 'Respeito o tempo do prospect e aguardo o momento certo para retomar contato',
    C: 'Sigo um cronograma estruturado de follow-ups com informações relevantes'
  },
  {
    situation: 'Quando recebo feedback negativo do gestor, eu:',
    D: 'Questiono os critérios e defendo meus resultados se acho que estou certo',
    I: 'Fico chateado inicialmente, mas busco transformar isso em motivação',
    S: 'Aceito o feedback e peço orientação sobre como melhorar',
    C: 'Analiso os dados objetivamente para entender onde preciso ajustar'
  },
  {
    situation: 'Em uma reunião de discovery com cliente, eu:',
    D: 'Vou direto ao ponto, identificando rapidamente o problema e propondo soluções',
    I: 'Crio conexão pessoal, contando histórias e fazendo o cliente se sentir à vontade',
    S: 'Escuto atentamente todas as necessidades antes de sugerir qualquer coisa',
    C: 'Faço perguntas específicas e técnicas para mapear completamente o cenário'
  },
  {
    situation: 'Quando perco uma venda importante, eu:',
    D: 'Parto imediatamente para o próximo prospect, sem perder tempo lamentando',
    I: 'Compartilho com o time, busco apoio emocional e rapidamente recupero o entusiasmo',
    S: 'Reflito sobre o que aconteceu e peço conselhos antes de seguir em frente',
    C: 'Analiso detalhadamente o que deu errado para evitar erros futuros'
  },
  {
    situation: 'Ao apresentar uma proposta comercial, eu:',
    D: 'Foco nos resultados, ROI e impacto direto no negócio do cliente',
    I: 'Crio apresentações visualmente atraentes e apresento com entusiasmo',
    S: 'Garanto que o cliente se sinta confortável e respondo todas as dúvidas pacientemente',
    C: 'Preparo dados detalhados, comparativos e demonstrações técnicas'
  },
  {
    situation: 'Em situações de pressão para fechar o mês, eu:',
    D: 'Acelero o ritmo, faço mais ligações e empurro negociações para o fechamento',
    I: 'Uso minha rede de contatos e networking para gerar oportunidades rápidas',
    S: 'Mantenho a calma e continuo seguindo meu processo, sem desespero',
    C: 'Analiso meu pipeline e priorizo os deals com maior probabilidade de conversão'
  },
  {
    situation: 'Quando vejo um colega com dificuldades, eu:',
    D: 'Dou dicas diretas e objetivas sobre o que ele precisa mudar',
    I: 'Ofereço ajuda de forma entusiasmada e tento motivá-lo',
    S: 'Me coloco à disposição e ofereço suporte sem julgamentos',
    C: 'Compartilho técnicas e processos que funcionaram para mim'
  },
  {
    situation: 'Ao lidar com um cliente insatisfeito, eu:',
    D: 'Busco resolver o problema rapidamente, oferecendo soluções práticas e compensações',
    I: 'Uso empatia e carisma para acalmar a situação e reconquistar a confiança',
    S: 'Escuto todas as reclamações com paciência e demonstro genuína preocupação',
    C: 'Investigo os detalhes do problema e apresento um plano de ação estruturado'
  },
  {
    situation: 'Meu ambiente de trabalho ideal é:',
    D: 'Competitivo, com metas desafiadoras e reconhecimento por performance',
    I: 'Dinâmico, com interação social constante e liberdade criativa',
    S: 'Estável, com relações de confiança e processos bem definidos',
    C: 'Organizado, com sistemas claros e critérios objetivos de avaliação'
  },
  {
    situation: 'Quando preciso aprender um novo CRM ou ferramenta, eu:',
    D: 'Pulo direto para usar, aprendo fazendo e com tentativa e erro',
    I: 'Peço dicas aos colegas e aprendo de forma colaborativa',
    S: 'Sigo o treinamento oficial passo a passo com paciência',
    C: 'Estudo a documentação completa antes de começar a usar'
  },
  {
    situation: 'Em uma reunião comercial que está travada, eu:',
    D: 'Assumo o controle e redireciono a conversa para objetivos concretos',
    I: 'Uso humor ou uma história para aliviar a tensão e reengajar',
    S: 'Permito que os outros falem e busco pontos de consenso',
    C: 'Trago dados e informações técnicas para esclarecer dúvidas'
  },
  {
    situation: 'Ao receber uma promoção ou reconhecimento, eu:',
    D: 'Vejo como validação da minha competência e busco o próximo desafio',
    I: 'Comemoro com o time e compartilho minha alegria abertamente',
    S: 'Agradeço humildemente e penso em como posso ajudar mais pessoas',
    C: 'Avalio se o reconhecimento foi justo e baseado em critérios claros'
  },
  {
    situation: 'Quando um prospect me pede "mais um desconto", eu:',
    D: 'Nego firmemente e defendo o valor do produto sem hesitar',
    I: 'Negocio de forma flexível, buscando um meio termo que agrade ambos',
    S: 'Consulto meu gestor antes de tomar qualquer decisão',
    C: 'Apresento dados que justificam o preço e os limites de desconto disponíveis'
  },
  {
    situation: 'Minha maior motivação na área comercial é:',
    D: 'Atingir metas agressivas e ser reconhecido como top performer',
    I: 'Construir relacionamentos genuínos e ter impacto positivo nos clientes',
    S: 'Fazer parte de um time forte e contribuir para resultados coletivos',
    C: 'Dominar técnicas de vendas e ter um processo impecável'
  },
  {
    situation: 'Ao organizar minha rotina comercial, eu:',
    D: 'Priorizo atividades de alto impacto, mesmo que isso signifique pular etapas',
    I: 'Vario minhas atividades para manter o dia interessante e energizante',
    S: 'Sigo uma rotina consistente que me deixa confortável e produtivo',
    C: 'Crio checklists detalhados e sigo um planejamento rigoroso'
  },
  {
    situation: 'Quando recebo um lead de entrada (inbound), eu:',
    D: 'Ligo imediatamente para qualificar e avançar rapidamente',
    I: 'Pesquiso nas redes sociais para personalizar minha abordagem',
    S: 'Aguardo um momento apropriado e preparo uma abordagem consultiva',
    C: 'Analiso o histórico de interações e estudo o fit antes do contato'
  },
  {
    situation: 'Em uma negociação B2B complexa com múltiplos stakeholders, eu:',
    D: 'Identifico o decisor principal e foco minha estratégia nele',
    I: 'Construo relacionamento com todas as partes envolvidas',
    S: 'Garanto que todos os envolvidos estejam alinhados e confortáveis',
    C: 'Mapeio a estrutura de decisão e preparo argumentos para cada perfil'
  },
  {
    situation: 'Ao definir minhas metas pessoais de vendas, eu:',
    D: 'Estabeleço números acima da meta oficial para me desafiar',
    I: 'Foco em metas que me permitam reconhecimento e crescimento',
    S: 'Prefiro metas realistas que posso atingir consistentemente',
    C: 'Baseio minhas metas em análise histórica e capacidade real'
  },
  {
    situation: 'Quando o mercado está difícil e as vendas caem, eu:',
    D: 'Intensifico meus esforços e busco novos mercados agressivamente',
    I: 'Uso criatividade para encontrar abordagens diferentes e inovadoras',
    S: 'Mantenho a persistência e confio que as coisas vão melhorar',
    C: 'Analiso tendências e ajusto minha estratégia com base em dados'
  },
  {
    situation: 'Meu estilo de comunicação com prospects é:',
    D: 'Direto, confiante e focado em resultados',
    I: 'Entusiasmado, amigável e voltado para conexão pessoal',
    S: 'Calmo, paciente e focado em construir confiança',
    C: 'Preciso, técnico e baseado em fatos e evidências'
  }
]

// Scale descriptors for 1-4 rating
const SCALE_DESCRIPTORS = [
  { value: 1, label: 'Menos se parece', description: 'Menos se parece com você' },
  { value: 2, label: 'Pouco se parece', description: 'Pouco se parece com você' },
  { value: 3, label: 'Parece', description: 'Parece com você' },
  { value: 4, label: 'Muito se parece', description: 'Mais se parece com você' }
]

async function migrateDISC() {
  console.log('🔄 MIGRANDO DISC: scale → matrix_rating\n')
  console.log('📋 Criando NOVA versão (preservando versão atual)\n')

  // 1. Buscar estrutura atual
  const { data: currentData, error: fetchError } = await supabase
    .from('test_structures')
    .select('*')
    .eq('test_type', 'disc')
    .eq('is_active', true)
    .single()

  if (fetchError) {
    console.error('❌ Erro ao buscar estrutura DISC:', fetchError)
    process.exit(1)
  }

  if (!currentData) {
    console.error('❌ Estrutura DISC ativa não encontrada')
    process.exit(1)
  }

  console.log(`✅ Versão atual encontrada: v${currentData.version}`)

  // 2. Criar novas questões matrix_rating
  const questions = []

  DISC_QUESTIONS.forEach((item, idx) => {
    const qNumber = idx + 1

    questions.push({
      id: `q${qNumber}`,
      text: item.situation,
      type: 'matrix_rating',
      order: idx,
      required: true,
      matrix_config: {
        statements: [
          {
            id: `q${qNumber}_d`,
            label: 'D',  // Label INTERNO para cálculo
            text: item.D,
            order: 0
          },
          {
            id: `q${qNumber}_i`,
            label: 'I',  // Label INTERNO para cálculo
            text: item.I,
            order: 1
          },
          {
            id: `q${qNumber}_s`,
            label: 'S',  // Label INTERNO para cálculo
            text: item.S,
            order: 2
          },
          {
            id: `q${qNumber}_c`,
            label: 'C',  // Label INTERNO para cálculo
            text: item.C,
            order: 3
          }
        ],
        scale: {
          min: 1,
          max: 4,
          descriptors: SCALE_DESCRIPTORS
        },
        validation: {
          unique_values: true  // Não pode repetir notas
        }
      }
    })
  })

  const newStructure = {
    metadata: {
      name: 'DISC - Perfil Comportamental Comercial',
      description: 'Teste de perfil comportamental DISC adaptado para área comercial. Para cada situação, avalie as 4 afirmações de 1 a 4.',
      instructions: 'Este teste possui 24 situações de trabalho. Para cada situação, você verá 4 afirmações. Atribua notas de 1 a 4 para CADA afirmação: 1 = Menos se parece com você, 2 = Pouco se parece, 3 = Parece com você, 4 = Mais se parece com você. IMPORTANTE: Use cada nota apenas uma vez por situação (não repita 1, 2, 3 ou 4 na mesma situação).',
      estimated_duration_minutes: 20
    },
    categories: [
      {
        id: 'disc_behavioral',
        name: 'Perfil Comportamental',
        description: 'Avalie cada afirmação de 1 a 4',
        order: 0,
        questions
      }
    ],
    scoring: {
      method: 'custom',
      category_weights: {},
      scale: {
        min: 1,
        max: 4,
        labels: {
          min: 'Menos se parece',
          max: 'Mais se parece'
        }
      },
      ranges: [
        { id: 'dominant', label: 'Traço DOMINANTE', min: 72, max: 96, description: 'Característica muito forte' },
        { id: 'moderate', label: 'Traço MODERADO', min: 48, max: 71, description: 'Característica presente' },
        { id: 'present', label: 'Traço PRESENTE', min: 36, max: 47, description: 'Característica moderada' },
        { id: 'less_present', label: 'Traço MENOS PRESENTE', min: 24, max: 35, description: 'Característica menos evidente' }
      ]
    }
  }

  console.log(`✅ Nova estrutura criada: ${questions.length} questões matrix_rating`)
  console.log(`✅ Cada questão tem 4 afirmações (D, I, S, C)`)
  console.log(`✅ Escala 1-4 com validação de valores únicos`)
  console.log(`✅ Labels (D, I, S, C) são INTERNOS - usuário vê apenas textos\n`)

  // 3. Criar nova versão (não sobrescrever)
  const newVersion = currentData.version + 1

  const { data: newData, error: insertError } = await supabase
    .from('test_structures')
    .insert({
      test_type: 'disc',
      structure: newStructure,
      version: newVersion,
      is_active: false,  // Começa como INATIVO para review
      parent_structure_id: currentData.id,
      changelog: 'Migration: 96 scale questions → 24 matrix_rating questions. Labels (D,I,S,C) are now internal-only for calculation. Users see only statement texts.',
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Erro ao criar nova versão:', insertError)
    process.exit(1)
  }

  console.log(`✅ Nova versão v${newVersion} criada (ID: ${newData.id})`)
  console.log(`⚠️  Status: INATIVO - review necessário antes de ativar\n`)

  // 4. Resumo
  console.log('📋 RESUMO DA MIGRAÇÃO:')
  console.log(`   Versão anterior: v${currentData.version} (ID: ${currentData.id})`)
  console.log(`   Nova versão: v${newVersion} (ID: ${newData.id})`)
  console.log(`   Questões antigas: 96 (tipo: scale)`)
  console.log(`   Questões novas: 24 (tipo: matrix_rating)\n`)

  console.log('📝 PRÓXIMOS PASSOS:')
  console.log('   1. Acesse /admin/test-structures')
  console.log('   2. Encontre o DISC com versão mais recente')
  console.log('   3. Clique em "Estrutura" para ver as 24 questões')
  console.log('   4. Clique em "Preview" para ver como ficará pro usuário')
  console.log('   5. Se tudo estiver correto, ATIVE a nova versão')
  console.log('   6. Desative a versão antiga (v'+currentData.version+') após validação\n')
}

migrateDISC()
