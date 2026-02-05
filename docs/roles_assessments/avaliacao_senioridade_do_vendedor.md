# Avaliação de Senioridade do Vendedor



Quero ajustar outro teste. Análise de senioridade de vendedor, sendo em 3 categorias:

- Habilidades Comportamentais (Total de 16)

- Habilidades Técnicas \[Domínio do método DEF\] (Total de 5)

- Adesão ao Processo Comercial (Total de 7)

\
Essa avaliação é feita pelo próprio vendedor/closer (autoavaliação) e pelo gestor. Ao final devemos comparar e sinalizar divergências.\
\
O resultado final é sempre feito com base nas notas do gestor, mas é interessante comparar e sinalizar gaps de percepção.\
\
Temos 3 níveis por camadas com as seguintes pontuações \
\- nível 1 - 1 ponto \
\- nível 2 - 2 pontos\
\- nível 3 - 3 pontos\
\
Peso Nível 1 >> Nível 2 - 75%

Peso Nível 2 >> Nível 3 - 80%\
\
Resultado do teste para categoria conforme valor de cada questão\
16< Resultado <=27 - Junior\
28≤ Resultado <=37 - Pleno\
38 ≤ Resultado <=48 - Sênior

\
Se puder criar algo para a pontuação global seria excelente.



```json
{
  "quiz_id": "analise_senioridade_vendedor",
  "title": "Análise de Senioridade de Vendedor",
  "description": "Avaliação completa de habilidades comportamentais, técnicas e aderência ao processo comercial, com comparação entre autoavaliação e avaliação do gestor.",
  "categories": [
    {
      "id": "comportamental",
      "name": "Habilidades Comportamentais",
      "scoring": {
        "method": "sum",
        "ranges": [
          { "min": 16, "max": 27, "label": "Júnior" },
          { "min": 28, "max": 37, "label": "Pleno" },
          { "min": 38, "max": 48, "label": "Sênior" }
        ]
      },
      "questions": [
        {"id": "c1", "question": "Tem controle emocional para evitar que situações pessoais ou pontuais afetem o atendimento?", "options": [
          { "label": "Se abala e precisa se ausentar da operação", "value": 1 },
          { "label": "Se abala às vezes, mas reage rápido", "value": 2 },
          { "label": "Não se abala e mantém a consistência", "value": 3 }
        ]},
        {"id": "c2", "question": "É proativo diante de sazonalidade, problemas de ferramentas e imprevistos?", "options": [
          { "label": "Fica inerte e pensa em desistir", "value": 1 },
          { "label": "Já passou por isso e não se abala mais", "value": 2 },
          { "label": "Propõe soluções e alternativas", "value": 3 }
        ]},
        {"id": "c3", "question": "É propositivo em ideias e ações que agregam ao time ou empresa?", "options": [
          { "label": "Não consegue propor ideias", "value": 1 },
          { "label": "Tem insights, mas não sabe executar", "value": 2 },
          { "label": "Propõe ideias e entende impacto", "value": 3 }
        ]},
        {"id": "c4", "question": "Executa o playbook sem depender da cobrança do líder?", "options": [
          { "label": "Depende da cobrança do líder", "value": 1 },
          { "label": "Executa e aponta quando há compromissos externos", "value": 2 },
          { "label": "Executa plenamente e propõe ajustes", "value": 3 }
        ]},
        {"id": "c5", "question": "Demonstra conhecimento profundo sobre produto e mercado?", "options": [
          { "label": "Ainda consulta o básico frequentemente", "value": 1 },
          { "label": "Tem domínio parcial, porém consistente", "value": 2 },
          { "label": "Domínio total, atualizado e com repertório amplo", "value": 3 }
        ]},
        {"id": "c6", "question": "Assume responsabilidade pelos próprios resultados?", "options": [
          { "label": "Reclama e terceiriza responsabilidades", "value": 1 },
          { "label": "Sabe o que precisa fazer, mas falha na execução solo", "value": 2 },
          { "label": "Reconhece o que poderia fazer diferente e cria plano de ação", "value": 3 }
        ]},
        {"id": "c7", "question": "Recebe feedback com escuta ativa?", "options": [
          { "label": "Tem atitude defensiva e se abala", "value": 1 },
          { "label": "Aceita e reage positivamente", "value": 2 },
          { "label": "Já chega com ações iniciadas antes do feedback", "value": 3 }
        ]},
        {"id": "c8", "question": "Cumpre compromissos acordados com líder e grupo?", "options": [
          { "label": "Evita compromissos e se sente pressionado", "value": 1 },
          { "label": "Cumpre compromissos", "value": 2 },
          { "label": "Cria os próprios compromissos e desafios", "value": 3 }
        ]},
        {"id": "c9", "question": "Constrói diálogos com o líder com clareza e transparência?", "options": [
          { "label": "É pouco propositivo no 1:1", "value": 1 },
          { "label": "Se expressa, mas com pouca fundamentação", "value": 2 },
          { "label": "Apresenta fatos, contexto e visão racional", "value": 3 }
        ]},
        {"id": "c10", "question": "Busca capacitação e desenvolvimento constante?", "options": [
          { "label": "Só estuda quando cobrado", "value": 1 },
          { "label": "Busca temas ligados à área comercial", "value": 2 },
          { "label": "Busca capacação contínua e multidisciplinar", "value": 3 }
        ]},
        {"id": "c11", "question": "Dá feedback técnico para colegas quando necessário?", "options": [
          { "label": "Dá feedbacks rasos ou evita dar", "value": 1 },
          { "label": "Dá feedbacks técnicos básicos", "value": 2 },
          { "label": "Feedbacks técnicos profundos com analogias e exemplos", "value": 3 }
        ]},
        {"id": "c12", "question": "Ajuda e permite ser ajudado sobre técnicas, comportamento e processo?", "options": [
          { "label": "Não tem clareza das próprias dificuldades", "value": 1 },
          { "label": "Aceita ajuda e sabe pedir com clareza", "value": 2 },
          { "label": "Pede ajuda proativamente e ajuda os colegas", "value": 3 }
        ]},
        {"id": "c13", "question": "Se prontifica a ajudar iniciantes e colegas?", "options": [
          { "label": "Ainda não se sente capaz", "value": 1 },
          { "label": "Ajuda em temas específicos", "value": 2 },
          { "label": "Ajuda amplamente sobre empresa, processo e cultura", "value": 3 }
        ]},
        {"id": "c14", "question": "Participa proativamente dos ritos do time?", "options": [
          { "label": "Só participa quando estimulado", "value": 1 },
          { "label": "Participa na maioria das vezes", "value": 2 },
          { "label": "Participa ativamente e estimula outros", "value": 3 }
        ]},
        {"id": "c15", "question": "Usa comunicação não violenta e evita juízo de valor?", "options": [
          { "label": "Tem dificuldade, mas está se policiando", "value": 1 },
          { "label": "Separa opiniões pessoais de sugestões profissionais", "value": 2 },
          { "label": "Constrói ótimos relacionamentos com CNV consistente", "value": 3 }
        ]},
        {"id": "c16", "question": "É íntegro na transmissão de informações ao potencial aluno?", "options": [
          { "label": "Às vezes comete deslizes", "value": 1 },
          { "label": "Age com clareza e transparência", "value": 2 },
          { "label": "É referência e ajuda colegas a manter valores", "value": 3 }
        ]}
      ]
    },
    {
      "id": "tecnica",
      "name": "Habilidades Técnicas – Método DEF",
      "scoring": {
        "method": "sum",
        "ranges": [
          { "min": 5, "max": 6.5, "label": "Júnior" },
          { "min": 6.6, "max": 11, "label": "Pleno" },
          { "min": 12, "max": 15, "label": "Sênior" }
        ]
      },
      "questions": [
        {"id": "t1", "question": "Etapa 0 – WhatsApp", "options": [
          { "label": "Predominância de Insatisfatório/Satisfatório", "value": 1 },
          { "label": "Satisfatório/Plenamente Satisfatório", "value": 2 },
          { "label": "Predominância de Plenamente Satisfatório", "value": 3 }
        ]},
        {"id": "t2", "question": "Etapa 1 – Descoberta", "options": [
          { "label": "Execução mecânica, sem perguntas chave", "value": 1 },
          { "label": "Gera conexão, antecipa objeções parcialmente", "value": 2 },
          { "label": "Conexão + exploração profunda de dores e objeções", "value": 3 }
        ]},
        {"id": "t3", "question": "Etapa 2 – Encantamento", "options": [
          { "label": "Apresentações genéricas, sem estrutura de diálogo", "value": 1 },
          { "label": "Apresentações técnicas, seguindo estrutura e cadência", "value": 2 },
          { "label": "Adapta comunicação ao perfil, usa elementos emocionais e racionais", "value": 3 }
        ]},
        {"id": "t4", "question": "Etapa 3 – Fechamento", "options": [
          { "label": "Usa ancoragem parcialmente e perde controle da conversa", "value": 1 },
          { "label": "Usa ancoragem e frameworks de objeção", "value": 2 },
          { "label": "Domínio total da situação, sem ansiedade", "value": 3 }
        ]},
        {"id": "t5", "question": "Contorno de objeção", "options": [
          { "label": "Predominância Insatisfatório/Satisfatório", "value": 1 },
          { "label": "Satisfatório/Plenamente Satisfatório", "value": 2 },
          { "label": "Predominância Plenamente Satisfatório", "value": 3 }
        ]}
      ]
    },
    {
      "id": "processo",
      "name": "Adesão ao Processo Comercial",
      "scoring": {
        "method": "sum",
        "ranges": [
          { "min": 7, "max": 10, "label": "Júnior" },
          { "min": 11, "max": 16, "label": "Pleno" },
          { "min": 17, "max": 21, "label": "Sênior" }
        ]
      },
      "questions": [
        {"id": "p1", "question": "Execução de cadência", "options": [
          { "label": "Abaixo de 90% de contatado", "value": 1 },
          { "label": "Abaixo de 95%", "value": 2 },
          { "label": "Acima de 95%", "value": 3 }
        ]},
        {"id": "p2", "question": "Execução de follow", "options": [
          { "label": "Esquece sessões ou usa lembretes em excesso", "value": 1 },
          { "label": "Erros ocasionais", "value": 2 },
          { "label": "Organizado, sem pendências e sem postergações", "value": 3 }
        ]},
        {"id": "p3", "question": "SLA", "options": [
          { "label": "Até 5 min", "value": 1 },
          { "label": "Até 5 min", "value": 2 },
          { "label": "Até 5 min", "value": 3 }
        ]},
        {"id": "p4", "question": "Atualização do CRM", "options": [
          { "label": "Dificuldade com etiquetas e motivos de fechamento", "value": 1 },
          { "label": "Pequenos erros constantes", "value": 2 },
          { "label": "Zero pendências, alta organização", "value": 3 }
        ]},
        {"id": "p5", "question": "Ligações", "options": [
          { "label": "Predominância Insatisfatório", "value": 1 },
          { "label": "Predominância Satisfatório", "value": 2 },
          { "label": "Predominância Plenamente Satisfatório", "value": 3 }
        ]},
        {"id": "p6", "question": "Agendamentos atendidos", "options": [
          { "label": "Média de 4/dia", "value": 1 },
          { "label": "Média de 4/dia", "value": 2 },
          { "label": "Média de 4/dia", "value": 3 }
        ]},
        {"id": "p7", "question": "Constância de entrega de resultado", "options": [
          { "label": "Bronze ou 7-8% de conversão", "value": 1 },
          { "label": "Prata ou 8.01-10%", "value": 2 },
          { "label": "Ouro ou acima de 10%", "value": 3 }
        ]}
      ]
    }
  ],
  "global_scoring": {
    "method": "weighted_sum",
    "weights": {
      "comportamental": 0.5,
      "tecnica": 0.3,
      "processo": 0.2
    },
    "ranges": [
      { "min": 28, "max": 47, "label": "Júnior" },
      { "min": 48, "max": 66, "label": "Pleno" },
      { "min": 67, "max": 84, "label": "Sênior" }
    ]
  },
  "comparisons": {
    "compare_self_vs_manager": true,
    "highlight_differences": true
  }
}

```