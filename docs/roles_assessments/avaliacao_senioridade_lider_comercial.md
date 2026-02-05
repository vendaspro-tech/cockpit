# Avaliação de Senioridade Líder Comercial



```json
{
  "quiz_id": "analise_senioridade_lider_comercial",
  "title": "Análise de Senioridade – Líder Comercial",
  "description": "Avaliação de habilidades comportamentais, domínio do método DEF e gestão comercial, com comparação entre autoavaliação e avaliação do gestor.",
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
        {
          "id": "c1",
          "question": "Tem controle emocional para que situações pessoais ou pontuais não afetem a qualidade do atendimento e da mensagem transmitida?",
          "options": [
            { "label": "Se abala a ponto de precisar se ausentar da operação", "value": 1 },
            { "label": "Às vezes se abala, mas reage rápido e com pouco impacto no resultado", "value": 2 },
            { "label": "Não se abala e não permite que o time se abale, entende que faz parte do jogo", "value": 3 }
          ]
        },
        {
          "id": "c2",
          "question": "Tem proatividade para lidar com sazonalidade de leads, problemas de ferramentas e imprevistos?",
          "options": [
            { "label": "Fica inerte, às vezes se desmotiva e pensa em desistir", "value": 1 },
            { "label": "Já passou por isso, confia na reação e não se abala", "value": 2 },
            { "label": "Pensa e propõe formas e soluções para a situação", "value": 3 }
          ]
        },
        {
          "id": "c3",
          "question": "É propositivo em ideias e ações que agregam na área e/ou empresa como um todo?",
          "options": [
            { "label": "Não consegue ter ideias, apenas reage às mudanças", "value": 1 },
            { "label": "Sabe que é importante colaborar, tem alguns insights mas não sabe como executar", "value": 2 },
            { "label": "Propõe ideias, entende impacto e formas de viabilização", "value": 3 }
          ]
        },
        {
          "id": "c4",
          "question": "Tem capacidade de executar o playbook proposto sem depender da cobrança do líder direto?",
          "options": [
            { "label": "Depende da cobrança do líder para execução plena", "value": 1 },
            { "label": "Executa sem cobrança e aponta situações que comprometem a execução", "value": 2 },
            { "label": "Executa plenamente e ainda propõe ajustes no playbook", "value": 3 }
          ]
        },
        {
          "id": "c5",
          "question": "Demonstra conhecimento profundo sobre produto e mercado?",
          "options": [
            { "label": "Ainda faz muitas consultas sobre informações básicas do produto", "value": 1 },
            { "label": "Tem domínio do produto, mas com limitações de repertório", "value": 2 },
            { "label": "Tem domínio do produto, está antenado no mercado e tem bom repertório de argumentação", "value": 3 }
          ]
        },
        {
          "id": "c6",
          "question": "Não terceiriza a responsabilidade de seus resultados para outras pessoas ou times?",
          "options": [
            { "label": "Reclama com frequência dizendo ter sido prejudicado", "value": 1 },
            { "label": "Sabe o que precisa fazer, mas não consegue fazer sozinho", "value": 2 },
            { "label": "Sabe o que poderia ter feito diferente e constrói plano de ação", "value": 3 }
          ]
        },
        {
          "id": "c7",
          "question": "Quando recebe feedback, pratica escuta ativa ou reage defensivamente?",
          "options": [
            { "label": "Responde sem escuta ativa, entende como crítica e se abate", "value": 1 },
            { "label": "Aceita o feedback e reage de forma positiva", "value": 2 },
            { "label": "Entende a necessidade do feedback e já toma ações para mitigar o impacto", "value": 3 }
          ]
        },
        {
          "id": "c8",
          "question": "Cumpre os compromissos acordados com seu líder e/ou grupo?",
          "options": [
            { "label": "Se sente pressionado por compromissos e busca evitá-los", "value": 1 },
            { "label": "Cumpre compromissos e se sente estimulado por eles", "value": 2 },
            { "label": "É movido por desafios e cria seus próprios compromissos", "value": 3 }
          ]
        },
        {
          "id": "c9",
          "question": "Constrói diálogos com seu líder quando se sente incomodado, sem omitir fatos?",
          "options": [
            { "label": "Não tem clareza, é pouco propositivo no 1:1", "value": 1 },
            { "label": "Consegue se expressar, mas com pouca fundamentação racional", "value": 2 },
            { "label": "Aborda a situação de forma racional, apresentando fatos", "value": 3 }
          ]
        },
        {
          "id": "c10",
          "question": "Busca capacitação e desenvolvimento constante, pessoal e profissional?",
          "options": [
            { "label": "Não tem iniciativa, só busca se for provocado", "value": 1 },
            { "label": "Busca temas ligados diretamente à área comercial", "value": 2 },
            { "label": "Mantém-se atualizado e amplia repertório além da área comercial", "value": 3 }
          ]
        },
        {
          "id": "c11",
          "question": "É claro e direto no feedback a colegas, baseado em método e técnica, sem argumentos pessoais?",
          "options": [
            { "label": "Dá feedbacks rasos, pouco fundamentados, ou se omite", "value": 1 },
            { "label": "Pontua feedbacks técnicos e propõe alterações", "value": 2 },
            { "label": "Feedbacks técnicos, precisos, com analogias e exemplos", "value": 3 }
          ]
        },
        {
          "id": "c12",
          "question": "Ajuda e permite ser ajudado em temas técnicos, comportamentais e de processo?",
          "options": [
            { "label": "Sim, mas sem clareza estruturada das próprias dificuldades", "value": 1 },
            { "label": "Sabe onde precisa de ajuda e pede com assertividade, mas ainda ajuda pouco", "value": 2 },
            { "label": "Procura ajuda proativamente e ajuda colegas com frequência", "value": 3 }
          ]
        },
        {
          "id": "c13",
          "question": "Se prontifica a ajudar colegas, especialmente iniciantes?",
          "options": [
            { "label": "Ainda não se sente capaz", "value": 1 },
            { "label": "Ajuda em assuntos pontuais, restritos ao ofício como vendedor", "value": 2 },
            { "label": "Ajuda em temas de empresa, processos, ferramentas e cultura", "value": 3 }
          ]
        },
        {
          "id": "c14",
          "question": "Participa proativamente dos ritos do time?",
          "options": [
            { "label": "Só participa quando estimulado", "value": 1 },
            { "label": "Participa na maioria das vezes", "value": 2 },
            { "label": "Participa ativamente e estimula os demais", "value": 3 }
          ]
        },
        {
          "id": "c15",
          "question": "Usa comunicação não violenta e evita juízo de valor?",
          "options": [
            { "label": "Ainda tem dificuldade de separar pessoal do profissional, mas se policia", "value": 1 },
            { "label": "Separa opiniões pessoais de sugestões profissionais", "value": 2 },
            { "label": "Cria bons relacionamentos com colegas, pares e liderança", "value": 3 }
          ]
        },
        {
          "id": "c16",
          "question": "Não mente nem omite informações importantes para tomada de decisão do potencial aluno?",
          "options": [
            { "label": "Pode ainda ter dificuldade de discernimento e cometer deslizes", "value": 1 },
            { "label": "Tem clareza da importância das informações passadas", "value": 2 },
            { "label": "Atua dentro do esperado e ajuda a formar essa cultura no time", "value": 3 }
          ]
        }
      ]
    },
    {
      "id": "tecnica",
      "name": "Habilidades Técnicas – Domínio do Método DEF",
      "scoring": {
        "method": "sum",
        "ranges": [
          { "min": 5, "max": 6.5, "label": "Júnior" },
          { "min": 7.5, "max": 11, "label": "Pleno" },
          { "min": 12, "max": 15, "label": "Sênior" }
        ]
      },
      "questions": [
        {
          "id": "t1",
          "question": "Etapa 0 – WhatsApp (líder analisando Jab-Direto)",
          "options": [
            { "label": "Analisa Jab-Direto com pouco repertório para criar opções", "value": 1 },
            { "label": "Dá feedbacks assertivos e propõe caminhos alternativos", "value": 2 },
            { "label": "Sugere perguntas com precisão e detalha bem o feedback do áudio", "value": 3 }
          ]
        },
        {
          "id": "t2",
          "question": "Etapa 1 – Descoberta (líder avaliando a etapa)",
          "options": [
            { "label": "Identifica recuo e perguntas, mas não aponta várias técnicas ausentes", "value": 1 },
            { "label": "Dá feedbacks para gerar conexão e antecipar objeções, mas explora pouco limiar de dor/ação", "value": 2 },
            { "label": "Ajuda a gerar conexão, mapear red flags e usar aumento de limiar de dor de forma íntegra", "value": 3 }
          ]
        },
        {
          "id": "t3",
          "question": "Etapa 2 – Encantamento (líder avaliando apresentação)",
          "options": [
            { "label": "Identifica uso ou não da Estrutura de Diálogo, mas tem dificuldade em feedbacks técnicos", "value": 1 },
            { "label": "Identifica apresentações técnicas e usa a Estrutura de Diálogo no feedback", "value": 2 },
            { "label": "Adapta sua comunicação ao perfil do liderado, usando elementos racionais, emocionais e analogias no feedback", "value": 3 }
          ]
        },
        {
          "id": "t4",
          "question": "Etapa 3 – Fechamento (líder avaliando fechamento)",
          "options": [
            { "label": "Identifica uso de ancoragem, mas só propõe ancoragem de preço", "value": 1 },
            { "label": "Ensina mais de um tipo de ancoragem e domina voz de comando", "value": 2 },
            { "label": "Tem domínio da técnica, ajuda o liderado a encontrar a melhor forma de fechar sem abrir mão de técnica", "value": 3 }
          ]
        },
        {
          "id": "t5",
          "question": "Contorno de objeção (líder avaliando objeções)",
          "options": [
            { "label": "Tem dificuldade em diferenciar objeções reais e não identifica bem o contorno", "value": 1 },
            { "label": "Identifica se é objeção real, mas tem pouco repertório para contorná-la", "value": 2 },
            { "label": "Tem repertório sólido para ajudar o liderado a contornar objeções", "value": 3 }
          ]
        }
      ]
    },
    {
      "id": "gestao",
      "name": "Gestão Comercial",
      "scoring": {
        "method": "sum",
        "ranges": [
          { "min": 7, "max": 10, "label": "Júnior" },
          { "min": 11, "max": 16, "label": "Pleno" },
          { "min": 17, "max": 21, "label": "Sênior" }
        ]
      },
      "questions": [
        {
          "id": "g1",
          "question": "Capacidade de liderança direta",
          "options": [
            { "label": "Lidera até 3 vendedores sem perder performance individual", "value": 1 },
            { "label": "Lidera até 6 vendedores sem perder performance individual", "value": 2 },
            { "label": "Lidera até 8 vendedores", "value": 3 }
          ]
        },
        {
          "id": "g2",
          "question": "Criação e organização de ritos próprios",
          "options": [
            { "label": "Segue apenas ritos do time geral", "value": 1 },
            { "label": "Cria alguns ritos próprios", "value": 2 },
            { "label": "Cria ritos próprios e colabora nos ritos gerais do time", "value": 3 }
          ]
        },
        {
          "id": "g3",
          "question": "Definição de metas individuais e de time",
          "options": [
            { "label": "Trabalha apenas com metas dadas pela liderança", "value": 1 },
            { "label": "Transforma meta global em meta de time e individual", "value": 2 },
            { "label": "Propõe metas globais e identifica ajustes nas metas da diretoria", "value": 3 }
          ]
        },
        {
          "id": "g4",
          "question": "Desenvolvimento de liderados",
          "options": [
            { "label": "Só estabelece rotinas básicas de treinamento e métricas, com dificuldade para PDI", "value": 1 },
            { "label": "Faz avaliação criteriosa de desempenho e propõe ações de desenvolvimento em PDI", "value": 2 },
            { "label": "Conduz desenvolvimento vertical/horizontal, posicionando o liderado na maior zona de produtividade", "value": 3 }
          ]
        },
        {
          "id": "g5",
          "question": "Ambiente e cultura",
          "options": [
            { "label": "Tem dificuldade em gerir ambiente, especialmente em momentos de pressão", "value": 1 },
            { "label": "Conduz bem a gestão do time em diferentes momentos", "value": 2 },
            { "label": "É exemplo de ambiente e cultura, guardião dos valores da empresa", "value": 3 }
          ]
        },
        {
          "id": "g6",
          "question": "Engajamento do time",
          "options": [
            { "label": "Tem alta adesão em agendas e participação em avaliações", "value": 1 },
            { "label": "Time altamente engajado com notas acima da média da empresa", "value": 2 },
            { "label": "Figura entre os 3 times mais engajados e com melhores notas de clima", "value": 3 }
          ]
        },
        {
          "id": "g7",
          "question": "Agenda de treinamentos",
          "options": [
            { "label": "Conduz treinamentos restritos a método de vendas e persuasão", "value": 1 },
            { "label": "Além de técnica, treina produto e mercado", "value": 2 },
            { "label": "Domina e propõe treinamentos sobre técnica, produto e temas avançados de atendimento", "value": 3 }
          ]
        },
        {
          "id": "g8",
          "question": "Contratação e processo seletivo",
          "options": [
            { "label": "Depende de RH e líder em todo o processo, sem autonomia", "value": 1 },
            { "label": "Conduz dinâmicas e avalia candidatos de forma autônoma, dependendo de RH e líder só para formalidades", "value": 2 },
            { "label": "Propõe novos processos seletivos, conduz todo o fluxo e participa de decisões de budget", "value": 3 }
          ]
        },
        {
          "id": "g9",
          "question": "Métricas e KPIs",
          "options": [
            { "label": "Acompanha dados macro, mas tem dificuldade de interpretação", "value": 1 },
            { "label": "Lê dados de forma operacional e estratégica, mas propõe poucas novas visões", "value": 2 },
            { "label": "Tem visão estratégica e operacional, identifica gargalos e provoca novas visualizações de dados", "value": 3 }
          ]
        },
        {
          "id": "g10",
          "question": "Documentação",
          "options": [
            { "label": "Tem perfil de executor, pouca rotina de organização e entrega apenas relatórios básicos", "value": 1 },
            { "label": "Contribui com o playbook, registra informações de forma estruturada e organizada", "value": 2 },
            { "label": "Documentação tão bem organizada que pode ser usada por outras áreas (marketing, produto, growth, etc.)", "value": 3 }
          ]
        }
      ]
    }
  ],
  "global_scoring": {
    "method": "weighted_sum",
    "weights": {
      "comportamental": 0.52,
      "tecnica": 0.16,
      "gestao": 0.32
    },
    "ranges": [
      { "min": 31, "max": 51, "label": "Júnior" },
      { "min": 52, "max": 72, "label": "Pleno" },
      { "min": 73, "max": 93, "label": "Sênior" }
    ]
  },
  "comparisons": {
    "compare_self_vs_manager": true,
    "highlight_differences": true
  }
}

```