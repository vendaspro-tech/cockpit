-- Update DEF method structure to include justification options
UPDATE test_structures
SET structure = jsonb_set(
  structure,
  '{categories}',
  '[
    {
      "id": "whatsapp",
      "name": "Whatsapp",
      "questions": [
        { "id": "w1", "text": "Recuo Estratégico", "weight": 1 },
        { "id": "w2", "text": "Usou Framework de Perguntas?", "weight": 1 },
        { "id": "w3", "text": "Jab, Jab, Jab, Direto", "weight": 1 },
        { "id": "w4", "text": "Áudio", "weight": 1 },
        { "id": "w5", "text": "Agendamento", "weight": 1 },
        { "id": "w6", "text": "Cumprimento do Agendamento", "weight": 1 },
        { "id": "w7", "text": "Explicação do porquê da ligação", "weight": 1 },
        { "id": "w8", "text": "SLA", "weight": 1 }
      ],
      "justification_options": [
        "Não fez Recuo Estratégico",
        "Não usou Framework de Perguntas",
        "Não usou Jab Direto",
        "Não pediu pra mandar áudio",
        "Áudio fora de padrão",
        "Não fez Agendamento",
        "Não cumpriu Agendamento",
        "Não soube explicar o porquê da ligação",
        "Violou SLA",
        "Faltaram Jabs",
        "Jabs excedentes"
      ]
    },
    {
      "id": "descoberta",
      "name": "Descoberta",
      "questions": [
        { "id": "d1", "text": "Recuo Estratégico + Parafrasear", "weight": 1 },
        { "id": "d2", "text": "Perguntas de Situação", "weight": 1 },
        { "id": "d3", "text": "Perguntas de Motivação", "weight": 1 },
        { "id": "d4", "text": "Perguntas de Impeditivo", "weight": 1 },
        { "id": "d5", "text": "Usou Framework de Perguntas?", "weight": 1 },
        { "id": "d6", "text": "Investigação de Red Flag(s)", "weight": 1 },
        { "id": "d7", "text": "Aumento de Limiar de Dor", "weight": 1 },
        { "id": "d8", "text": "Extração de Dor/Desejo/Objetivo Principal", "weight": 1 },
        { "id": "d9", "text": "Condução natural (diálogo)", "weight": 1 },
        { "id": "d10", "text": "Capacidade de se conectar", "weight": 1 },
        { "id": "d11", "text": "Escuta Ativa", "weight": 1 },
        { "id": "d12", "text": "Acordo de Sinceridade", "weight": 1 },
        { "id": "d13", "text": "Não Vendeu na Descoberta", "weight": 1 }
      ],
      "justification_options": [
        "Não fez Recuo Estratégico",
        "Não Parafraseou",
        "Fez poucas Perguntas Situação",
        "Fez poucas Perguntas Impeditivo",
        "Fez poucas Perguntas Motivação",
        "Não usou Framework",
        "Induziu Lead em alguma Resposta",
        "Não aumentou limiar de dor",
        "Não mapeou Red Flag",
        "Não extraiu objetivo/dor/desejo",
        "Deixou passar alguma Red Flag",
        "Não mapeou Rotina",
        "Interrompeu o lead",
        "Falou mais do que ouviu",
        "Não mapeou decisor",
        "Não fez acordo",
        "Vendeu na descoberta",
        "Comunicação mecânica",
        "Não fez pergunta termômetro",
        "Não conseguiu gerar conexão"
      ]
    },
    {
      "id": "encantamento",
      "name": "Encantamento",
      "questions": [
        { "id": "e1", "text": "Pergunta de Abertura", "weight": 1 },
        { "id": "e2", "text": "Organização por Tópicos", "weight": 1 },
        { "id": "e3", "text": "CTA por tópico", "weight": 1 },
        { "id": "e4", "text": "Variação de CTA", "weight": 1 },
        { "id": "e5", "text": "Uso de Analogias", "weight": 1 },
        { "id": "e6", "text": "Uso de Argumentos Racionais", "weight": 1 },
        { "id": "e7", "text": "Uso de Argumentos Emocionais", "weight": 1 },
        { "id": "e8", "text": "Adaptação do discurso à dor", "weight": 1 },
        { "id": "e9", "text": "Pergunta de Verificação", "weight": 1 },
        { "id": "e10", "text": "Isolamento de Variáveis", "weight": 1 },
        { "id": "e11", "text": "Criação do Plano de Ação", "weight": 1 },
        { "id": "e12", "text": "Lead conhece o Expert?", "weight": 1, "type": "boolean", "options": [{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}] }
      ],
      "justification_options": [
        "Não fez Pergunta de Abertura",
        "Não usou Estrutura de Diálogo",
        "Apresentação genérica",
        "Não criou Plano de Ação",
        "Não varia CTAs",
        "Demora para fazer CTA",
        "Não varia forma que argumenta",
        "Usou apenas elementos racionais",
        "Usou apenas elementos emocionais",
        "Não usou analogia",
        "Virou um monólogo",
        "Não fez Pergunta de Verificação",
        "Não isolou variáveis",
        "Apresentou descrevendo, pouca persuasão"
      ]
    },
    {
      "id": "fechamento",
      "name": "Fechamento",
      "questions": [
        { "id": "f1", "text": "Uso de Ancoragem", "weight": 1 },
        { "id": "f2", "text": "CTA de Preço", "weight": 1 },
        { "id": "f3", "text": "Fechamento Presumido", "weight": 1 },
        { "id": "f4", "text": "Fechamento Acompanhado", "weight": 1 }
      ],
      "justification_options": [
        "Não usou Ancoragem",
        "Uso errado de Ancoragem",
        "Não fez CTA",
        "Não fez Fechamento Presumido",
        "Confirmação de pagamento antes da hora",
        "Não teve voz de comando"
      ]
    },
    {
      "id": "objecoes",
      "name": "Contorno de Objeções",
      "questions": [
        { "id": "o1", "text": "Mostrou Empatia", "weight": 1 },
        { "id": "o2", "text": "Alteração de Voz", "weight": 1 },
        { "id": "o3", "text": "Uso de Perguntas Abertas e Reflexivas", "weight": 1 },
        { "id": "o4", "text": "Argumentos de Contorno", "weight": 1 }
      ],
      "justification_options": [
        "Não demonstrou empatia",
        "Alterou tom de voz",
        "Não usou framework de objeções",
        "Não fez perguntas boas",
        "Não teve repertório",
        "Aceitou passivamente",
        "Não identificou objeção real vs não real",
        "Virou vendedor insistente",
        "Não teve domínio da situação"
      ]
    }
  ]'::jsonb
)
WHERE test_type = 'def_method';
