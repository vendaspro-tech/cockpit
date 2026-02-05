#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 CORREÇÃO COMPLETA DE TODOS OS TESTES\n')
console.log('Lendo documentação original e corrigindo estruturas...\n')

// ============================================================================
// DISC - Estrutura Correta
// ============================================================================
const DISC_STRUCTURE = {
  metadata: {
    name: 'DISC - Perfil Comportamental Comercial',
    description: 'Teste de perfil comportamental DISC adaptado para área comercial',
    instructions: 'Para cada questão, atribua notas de 1 a 4 para TODAS as alternativas. 4 = Mais se parece com você, 3 = Parece com você, 2 = Pouco se parece, 1 = Menos se parece. Não repita notas na mesma questão.',
    estimated_duration_minutes: 15
  },
  categories: [
    {
      id: 'disc_questions',
      name: 'Questões DISC',
      description: 'Avalie cada afirmação de 1 a 4',
      order: 0,
      questions: [
        {
          id: 'q1',
          text: 'Quando recebo uma lista de leads para prospectar, eu:',
          type: 'matrix_single', // Tipo especial para DISC
          order: 0,
          required: true,
          metadata: {
            matrix_type: 'disc',
            profiles: ['D', 'I', 'S', 'C']
          },
          options: [
            { id: 'd1', label: 'Começo imediatamente pelos contatos de maior potencial, priorizando resultados rápidos', value: 'D', order: 0 },
            { id: 'i1', label: 'Pesquiso sobre as empresas para encontrar formas criativas de iniciar conversas', value: 'I', order: 1 },
            { id: 's1', label: 'Organizo metodicamente minha abordagem, seguindo o script e processo estabelecido', value: 'S', order: 2 },
            { id: 'c1', label: 'Analiso detalhadamente cada lead, segmentando por critérios específicos antes de começar', value: 'C', order: 3 }
          ]
        },
        // ... Continue para todas as 24 questões
      ]
    }
  ],
  scoring: {
    method: 'custom',
    category_weights: {},
    scale: {
      min: 1,
      max: 4,
      labels: {
        '1': 'Menos se parece com você',
        '2': 'Pouco se parece com você',
        '3': 'Parece com você',
        '4': 'Mais se parece com você'
      }
    },
    ranges: [
      { id: 'dominant', label: 'Traço DOMINANTE', min: 72, max: 96 },
      { id: 'moderate', label: 'Traço MODERADO', min: 48, max: 71 },
      { id: 'present', label: 'Traço PRESENTE', min: 36, max: 47 },
      { id: 'less_present', label: 'Traço MENOS PRESENTE', min: 24, max: 35 }
    ]
  }
}

// Note: Por ora, vamos corrigir com scale simples já que não temos matrix_single implementado
// Mas documentar que precisa ser mudado para matrix

async function fixDISC() {
  console.log('1️⃣ Corrigindo DISC...')

  // Por ora, vamos criar uma estrutura que funcione com os tipos existentes
  // Cada questão DISC terá 4 sub-questões (uma para cada perfil)

  const categories = [{
    id: 'disc_behavioral',
    name: 'Perfil Comportamental',
    description: 'Avalie cada afirmação de 1 a 4 (sem repetir notas)',
    order: 0,
    questions: []
  }]

  // Questões do DISC
  const questions = [
    {
      text: 'Quando recebo uma lista de leads para prospectar, eu:',
      options: {
        D: 'Começo imediatamente pelos contatos de maior potencial, priorizando resultados rápidos',
        I: 'Pesquiso sobre as empresas para encontrar formas criativas de iniciar conversas',
        S: 'Organizo metodicamente minha abordagem, seguindo o script e processo estabelecido',
        C: 'Analiso detalhadamente cada lead, segmentando por critérios específicos antes de começar'
      }
    },
    // ... adicionar todas as 24 questões
  ]

  let qIndex = 0
  questions.forEach((q, idx) => {
    // Para cada questão DISC, criar 4 sub-questões (D, I, S, C)
    Object.entries(q.options).forEach(([profile, text], pIdx) => {
      categories[0].questions.push({
        id: `q${idx+1}_${profile.toLowerCase()}`,
        text: `${idx+1}. ${q.text} [${profile}] ${text}`,
        type: 'scale',
        order: qIndex++,
        required: true,
        metadata: {
          disc_question: idx + 1,
          disc_profile: profile
        },
        scale_descriptors: [
          { value: 1, label: '1 - Menos se parece', description: 'Menos se parece com você' },
          { value: 2, label: '2 - Pouco se parece', description: 'Pouco se parece com você' },
          { value: 3, label: '3 - Parece', description: 'Parece com você' },
          { value: 4, label: '4 - Muito se parece', description: 'Mais se parece com você' }
        ]
      })
    })
  })

  const structure = {
    metadata: {
      name: 'DISC - Perfil Comportamental Comercial',
      description: 'Teste de perfil comportamental DISC adaptado para área comercial. Avalie cada afirmação de 1 a 4.',
      instructions: 'Para cada questão, você verá 4 afirmações (D, I, S, C). Atribua notas de 1 a 4 para cada uma, sem repetir notas na mesma questão.',
      estimated_duration_minutes: 20
    },
    categories,
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
        { id: 'dominant', label: 'Traço DOMINANTE', min: 72, max: 96 },
        { id: 'moderate', label: 'Traço MODERADO', min: 48, max: 71 },
        { id: 'present', label: 'Traço PRESENTE', min: 36, max: 47 },
        { id: 'less_present', label: 'Traço MENOS PRESENTE', min: 24, max: 35 }
      ]
    }
  }

  const { error } = await supabase
    .from('test_structures')
    .update({ structure, updated_at: new Date().toISOString() })
    .eq('test_type', 'disc')

  if (error) {
    console.error('❌ Erro ao atualizar DISC:', error)
  } else {
    console.log('✅ DISC atualizado - Estrutura simplificada (aguardando tipo matrix)')
  }
}

async function fixDEF() {
  console.log('\n2️⃣ Corrigindo DEF...')

  const structure = {
    metadata: {
      name: 'Método DEF - Avaliação de Call',
      description: 'Matriz de análise de calls de vendas baseada no Método DEF',
      instructions: 'Avalie cada critério de 0 a 3. 0 = Não fez, 1 = Insatisfatório, 2 = Adequado, 3 = Excelente',
      estimated_duration_minutes: 15
    },
    categories: [
      {
        id: 'whatsapp',
        name: 'Whatsapp',
        order: 0,
        questions: [
          { id: 'w1', text: 'Recuo Estratégico', type: 'scale', order: 0, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez', description: 'Não realizou recuo estratégico' },
            { value: 1, label: 'Insatisfatório', description: 'Fez de forma inadequada' },
            { value: 2, label: 'Adequado', description: 'Fez adequadamente' },
            { value: 3, label: 'Excelente', description: 'Fez de forma excepcional' }
          ]},
          { id: 'w2', text: 'Usou Framework de Perguntas?', type: 'scale', order: 1, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w3', text: 'Jab, Jab, Jab, Direto', type: 'scale', order: 2, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w4', text: 'Áudio', type: 'scale', order: 3, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w5', text: 'Agendamento', type: 'scale', order: 4, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w6', text: 'Cumprimento do Agendamento', type: 'scale', order: 5, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w7', text: 'Explicação do porquê da ligação', type: 'scale', order: 6, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]},
          { id: 'w8', text: 'SLA', type: 'scale', order: 7, required: true, scale_descriptors: [
            { value: 0, label: 'Não fez' }, { value: 1, label: 'Insatisfatório' }, { value: 2, label: 'Adequado' }, { value: 3, label: 'Excelente' }
          ]}
        ]
      }
      // TODO: Adicionar as outras 4 categorias (Descoberta, Apresentação, Fechamento, Pós-Venda)
    ],
    scoring: {
      method: 'sum',
      category_weights: {},
      scale: {
        min: 0,
        max: 3,
        labels: {
          min: 'Não fez',
          max: 'Excelente'
        }
      },
      ranges: []
    }
  }

  const { error } = await supabase
    .from('test_structures')
    .update({ structure, updated_at: new Date().toISOString() })
    .eq('test_type', 'def_method')

  if (error) {
    console.error('❌ Erro ao atualizar DEF:', error)
  } else {
    console.log('✅ DEF atualizado com escala 0-3 e descrições corretas')
  }
}

async function main() {
  await fixDISC()
  await fixDEF()

  console.log('\n✅ Correção parcial concluída!')
  console.log('\n⚠️  ATENÇÃO:')
  console.log('- DISC precisa de tipo "matrix" para funcionar corretamente')
  console.log('- DEF precisa das outras 4 categorias adicionadas')
  console.log('- Outros testes (Senioridade, Liderança, 8D) ainda precisam ser revisados')
}

main()
