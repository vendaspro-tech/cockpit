-- Create DISC test structure for admin editing
-- Note: The actual DISC questionnaire uses hardcoded questions in disc-questionnaire.tsx
-- This structure is for administrative purposes (viewing in scoring-rules editor)

INSERT INTO public.test_structures (test_type, structure, version)
VALUES (
  'disc',
  '{
    "id": "disc",
    "title": "Perfil Comportamental DISC",
    "description": "Avaliação de perfil comportamental baseada na metodologia DISC. Identifica tendências de comportamento: Dominância, Influência, Estabilidade e Conformidade.",
    "version": "1.0",
    "scale": {
      "min": 1,
      "max": 4,
      "labels": {
        "1": "Menos você",
        "2": "Pouco você",
        "3": "Você",
        "4": "Muito você"
      }
    },
    "profiles": [
      { "profile": "D", "label": "Dominância", "description": "Orientado a resultados, direto, competitivo" },
      { "profile": "I", "label": "Influência", "description": "Comunicativo, entusiasta, colaborativo" },
      { "profile": "S", "label": "Estabilidade", "description": "Paciente, confiável, orientado a equipe" },
      { "profile": "C", "label": "Conformidade", "description": "Analítico, preciso, focado em qualidade" }
    ],
    "categories": [
      {
        "id": "perfil_comportamental",
        "name": "Perfil Comportamental",
        "questions": [
          { "id": "q1", "text": "Quando recebo uma lista de leads para prospectar, eu:" },
          { "id": "q2", "text": "Em uma negociação difícil com objeções fortes, eu:" },
          { "id": "q3", "text": "Quando trabalho em equipe comercial, eu:" },
          { "id": "q4", "text": "Diante de uma meta agressiva no trimestre, minha reação é:" },
          { "id": "q5", "text": "Ao fazer follow-up com prospects, eu:" },
          { "id": "q6", "text": "Quando recebo feedback negativo do gestor, eu:" },
          { "id": "q7", "text": "Em uma reunião de discovery com cliente, eu:" },
          { "id": "q8", "text": "Quando perco uma venda importante, eu:" },
          { "id": "q9", "text": "Ao apresentar uma proposta comercial, eu:" },
          { "id": "q10", "text": "Em situações de pressão para fechar o mês, eu:" },
          { "id": "q11", "text": "Quando vejo um colega com dificuldades, eu:" },
          { "id": "q12", "text": "Ao lidar com um cliente insatisfeito, eu:" },
          { "id": "q13", "text": "Meu ambiente de trabalho ideal é:" },
          { "id": "q14", "text": "Quando preciso aprender um novo CRM ou ferramenta, eu:" },
          { "id": "q15", "text": "Em uma reunião comercial que está travada, eu:" },
          { "id": "q16", "text": "Ao receber uma promoção ou reconhecimento, eu:" },
          { "id": "q17", "text": "Quando um prospect me pede mais um desconto, eu:" },
          { "id": "q18", "text": "Minha maior motivação na área comercial é:" },
          { "id": "q19", "text": "Ao organizar minha rotina comercial, eu:" },
          { "id": "q20", "text": "Quando recebo um lead de entrada (inbound), eu:" },
          { "id": "q21", "text": "Em uma negociação B2B complexa com múltiplos stakeholders, eu:" },
          { "id": "q22", "text": "Ao definir minhas metas pessoais de vendas, eu:" },
          { "id": "q23", "text": "Quando o mercado está difícil e as vendas caem, eu:" },
          { "id": "q24", "text": "Meu estilo de comunicação com prospects é:" }
        ]
      }
    ]
  }'::jsonb,
  '1.0'
)
ON CONFLICT (test_type) DO UPDATE SET
  structure = EXCLUDED.structure,
  version = EXCLUDED.version,
  updated_at = NOW();
