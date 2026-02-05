#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORRIGINDO DUPLICAÇÃO NO TESTE DISC\n')

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
const SCALE_1_TO_4 = [
  { value: 1, label: '1 - Menos se parece', description: 'Menos se parece com você' },
  { value: 2, label: '2 - Pouco se parece', description: 'Pouco se parece com você' },
  { value: 3, label: '3 - Parece', description: 'Parece com você' },
  { value: 4, label: '4 - Muito se parece', description: 'Mais se parece com você' }
]

async function fixDISC() {
  console.log('Criando estrutura LIMPA do DISC...\n')

  const questions = []
  let qIndex = 0

  // Create 4 scale questions for each DISC situation (one per profile)
  // But now with CLEAN text (no repetition of the situation)
  DISC_QUESTIONS.forEach((item, idx) => {
    const qNumber = idx + 1

    // D statement
    questions.push({
      id: `q${qNumber}_d`,
      text: `[D] ${item.D}`,
      type: 'scale',
      order: qIndex++,
      required: true,
      scale_descriptors: SCALE_1_TO_4,
      metadata: {
        disc_question_number: qNumber,
        disc_situation: item.situation,
        disc_profile: 'D'
      }
    })

    // I statement
    questions.push({
      id: `q${qNumber}_i`,
      text: `[I] ${item.I}`,
      type: 'scale',
      order: qIndex++,
      required: true,
      scale_descriptors: SCALE_1_TO_4,
      metadata: {
        disc_question_number: qNumber,
        disc_situation: item.situation,
        disc_profile: 'I'
      }
    })

    // S statement
    questions.push({
      id: `q${qNumber}_s`,
      text: `[S] ${item.S}`,
      type: 'scale',
      order: qIndex++,
      required: true,
      scale_descriptors: SCALE_1_TO_4,
      metadata: {
        disc_question_number: qNumber,
        disc_situation: item.situation,
        disc_profile: 'S'
      }
    })

    // C statement
    questions.push({
      id: `q${qNumber}_c`,
      text: `[C] ${item.C}`,
      type: 'scale',
      order: qIndex++,
      required: true,
      scale_descriptors: SCALE_1_TO_4,
      metadata: {
        disc_question_number: qNumber,
        disc_situation: item.situation,
        disc_profile: 'C'
      }
    })
  })

  const structure = {
    metadata: {
      name: 'DISC - Perfil Comportamental Comercial',
      description: 'Teste de perfil comportamental DISC adaptado para área comercial. Para cada situação, avalie as 4 afirmações de 1 a 4.',
      instructions: 'Este teste possui 24 situações de trabalho. Para cada situação, você verá 4 afirmações (D, I, S, C). Atribua notas de 1 a 4 para CADA afirmação: 1 = Menos se parece com você, 2 = Pouco se parece, 3 = Parece, 4 = Mais se parece. IMPORTANTE: Use cada nota apenas uma vez por situação (não repita 1, 2, 3 ou 4 na mesma situação).',
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

  console.log(`✅ Estrutura criada: ${questions.length} afirmações (24 situações × 4 perfis)`)
  console.log(`✅ Situação aparece no metadata (não duplicada no texto)`)

  const { error } = await supabase
    .from('test_structures')
    .update({
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('test_type', 'disc')

  if (error) {
    console.error('❌ Erro ao atualizar DISC:', error)
    process.exit(1)
  }

  console.log('\n✅ DISC atualizado - Duplicação removida!')
  console.log('\n📝 Como a UI deve renderizar:')
  console.log('   - Agrupar por metadata.disc_question_number')
  console.log('   - Mostrar metadata.disc_situation uma vez')
  console.log('   - Mostrar as 4 afirmações (text) abaixo')
  console.log('   - Cada afirmação com escala 1-4')
}

fixDISC()
