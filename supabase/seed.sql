-- Limpar dados existentes (opcional, cuidado em produção)
TRUNCATE TABLE test_structures CASCADE;

-- 1. Senioridade Vendedor
INSERT INTO test_structures (test_type, structure, version)
VALUES (
  'seniority_seller',
  '{
  "id": "seniority_seller",
  "title": "Análise de Senioridade de Vendedor",
  "description": "Avaliação completa de habilidades comportamentais, técnicas e aderência ao processo comercial.",
  "version": "2.0",
  "categories": [
    {
      "id": "comportamental",
      "name": "Habilidades Comportamentais",
      "questions": [
        {
          "id": "c1",
          "text": "Tem controle emocional para evitar que situações pessoais ou pontuais afetem o atendimento?",
          "options": [
            { "label": "Se abala e precisa se ausentar da operação", "value": 1 },
            { "label": "Se abala às vezes, mas reage rápido", "value": 2 },
            { "label": "Não se abala e mantém a consistência", "value": 3 }
          ]
        },
        {
          "id": "c2",
          "text": "É proativo diante de sazonalidade, problemas de ferramentas e imprevistos?",
          "options": [
            { "label": "Fica inerte e pensa em desistir", "value": 1 },
            { "label": "Já passou por isso e não se abala mais", "value": 2 },
            { "label": "Propõe soluções e alternativas", "value": 3 }
          ]
        },
        {
          "id": "c3",
          "text": "É propositivo em ideias e ações que agregam ao time ou empresa?",
          "options": [
            { "label": "Não consegue propor ideias", "value": 1 },
            { "label": "Tem insights, mas não sabe executar", "value": 2 },
            { "label": "Propõe ideias e entende impacto", "value": 3 }
          ]
        },
        {
          "id": "c4",
          "text": "Executa o playbook sem depender da cobrança do líder?",
          "options": [
            { "label": "Depende da cobrança do líder", "value": 1 },
            { "label": "Executa e aponta quando há compromissos externos", "value": 2 },
            { "label": "Executa plenamente e propõe ajustes", "value": 3 }
          ]
        },
        {
          "id": "c5",
          "text": "Demonstra conhecimento profundo sobre produto e mercado?",
          "options": [
            { "label": "Ainda consulta o básico frequentemente", "value": 1 },
            { "label": "Tem domínio parcial, porém consistente", "value": 2 },
            { "label": "Domínio total, atualizado e com repertório amplo", "value": 3 }
          ]
        },
        {
          "id": "c6",
          "text": "Assume responsabilidade pelos próprios resultados?",
          "options": [
            { "label": "Reclama e terceiriza responsabilidades", "value": 1 },
            { "label": "Sabe o que precisa fazer, mas falha na execução solo", "value": 2 },
            { "label": "Reconhece o que poderia fazer diferente e cria plano de ação", "value": 3 }
          ]
        },
        {
          "id": "c7",
          "text": "Recebe feedback com escuta ativa?",
          "options": [
            { "label": "Tem atitude defensiva e se abala", "value": 1 },
            { "label": "Aceita e reage positivamente", "value": 2 },
            { "label": "Já chega com ações iniciadas antes do feedback", "value": 3 }
          ]
        },
        {
          "id": "c8",
          "text": "Cumpre compromissos acordados com líder e grupo?",
          "options": [
            { "label": "Evita compromissos e se sente pressionado", "value": 1 },
            { "label": "Cumpre compromissos", "value": 2 },
            { "label": "Cria os próprios compromissos e desafios", "value": 3 }
          ]
        },
        {
          "id": "c9",
          "text": "Constrói diálogos com o líder com clareza e transparência?",
          "options": [
            { "label": "É pouco propositivo no 1:1", "value": 1 },
            { "label": "Se expressa, mas com pouca fundamentação", "value": 2 },
            { "label": "Apresenta fatos, contexto e visão racional", "value": 3 }
          ]
        },
        {
          "id": "c10",
          "text": "Busca capacitação e desenvolvimento constante?",
          "options": [
            { "label": "Só estuda quando cobrado", "value": 1 },
            { "label": "Busca temas ligados à área comercial", "value": 2 },
            { "label": "Busca capacação contínua e multidisciplinar", "value": 3 }
          ]
        },
        {
          "id": "c11",
          "text": "Dá feedback técnico para colegas quando necessário?",
          "options": [
            { "label": "Dá feedbacks rasos ou evita dar", "value": 1 },
            { "label": "Dá feedbacks técnicos básicos", "value": 2 },
            { "label": "Feedbacks técnicos profundos com analogias e exemplos", "value": 3 }
          ]
        },
        {
          "id": "c12",
          "text": "Ajuda e permite ser ajudado sobre técnicas, comportamento e processo?",
          "options": [
            { "label": "Não tem clareza das próprias dificuldades", "value": 1 },
            { "label": "Aceita ajuda e sabe pedir com clareza", "value": 2 },
            { "label": "Pede ajuda proativamente e ajuda os colegas", "value": 3 }
          ]
        },
        {
          "id": "c13",
          "text": "Se prontifica a ajudar iniciantes e colegas?",
          "options": [
            { "label": "Ainda não se sente capaz", "value": 1 },
            { "label": "Ajuda em temas específicos", "value": 2 },
            { "label": "Ajuda amplamente sobre empresa, processo e cultura", "value": 3 }
          ]
        },
        {
          "id": "c14",
          "text": "Participa proativamente dos ritos do time?",
          "options": [
            { "label": "Só participa quando estimulado", "value": 1 },
            { "label": "Participa na maioria das vezes", "value": 2 },
            { "label": "Participa ativamente e estimula outros", "value": 3 }
          ]
        },
        {
          "id": "c15",
          "text": "Usa comunicação não violenta e evita juízo de valor?",
          "options": [
            { "label": "Tem dificuldade, mas está se policiando", "value": 1 },
            { "label": "Separa opiniões pessoais de sugestões profissionais", "value": 2 },
            { "label": "Constrói ótimos relacionamentos com CNV consistente", "value": 3 }
          ]
        },
        {
          "id": "c16",
          "text": "É íntegro na transmissão de informações ao potencial aluno?",
          "options": [
            { "label": "Às vezes comete deslizes", "value": 1 },
            { "label": "Age com clareza e transparência", "value": 2 },
            { "label": "É referência e ajuda colegas a manter valores", "value": 3 }
          ]
        }
      ]
    },
    {
      "id": "tecnica",
      "name": "Habilidades Técnicas – Método DEF",
      "questions": [
        {
          "id": "t1",
          "text": "Etapa 0 – WhatsApp",
          "options": [
            { "label": "Predominância de Insatisfatório/Satisfatório", "value": 1 },
            { "label": "Satisfatório/Plenamente Satisfatório", "value": 2 },
            { "label": "Predominância de Plenamente Satisfatório", "value": 3 }
          ]
        },
        {
          "id": "t2",
          "text": "Etapa 1 – Descoberta",
          "options": [
            { "label": "Execução mecânica, sem perguntas chave", "value": 1 },
            { "label": "Gera conexão, antecipa objeções parcialmente", "value": 2 },
            { "label": "Conexão + exploração profunda de dores e objeções", "value": 3 }
          ]
        },
        {
          "id": "t3",
          "text": "Etapa 2 – Encantamento",
          "options": [
            { "label": "Apresentações genéricas, sem estrutura de diálogo", "value": 1 },
            { "label": "Apresentações técnicas, seguindo estrutura e cadência", "value": 2 },
            { "label": "Adapta comunicação ao perfil, usa elementos emocionais e racionais", "value": 3 }
          ]
        },
        {
          "id": "t4",
          "text": "Etapa 3 – Fechamento",
          "options": [
            { "label": "Usa ancoragem parcialmente e perde controle da conversa", "value": 1 },
            { "label": "Usa ancoragem e frameworks de objeção", "value": 2 },
            { "label": "Domínio total da situação, sem ansiedade", "value": 3 }
          ]
        },
        {
          "id": "t5",
          "text": "Contorno de objeção",
          "options": [
            { "label": "Predominância Insatisfatório/Satisfatório", "value": 1 },
            { "label": "Satisfatório/Plenamente Satisfatório", "value": 2 },
            { "label": "Predominância Plenamente Satisfatório", "value": 3 }
          ]
        }
      ]
    },
    {
      "id": "processo",
      "name": "Adesão ao Processo Comercial",
      "questions": [
        {
          "id": "p1",
          "text": "Execução de cadência",
          "options": [
            { "label": "Abaixo de 90% de contatado", "value": 1 },
            { "label": "Abaixo de 95%", "value": 2 },
            { "label": "Acima de 95%", "value": 3 }
          ]
        },
        {
          "id": "p2",
          "text": "Execução de follow",
          "options": [
            { "label": "Esquece sessões ou usa lembretes em excesso", "value": 1 },
            { "label": "Erros ocasionais", "value": 2 },
            { "label": "Organizado, sem pendências e sem postergações", "value": 3 }
          ]
        },
        {
          "id": "p3",
          "text": "SLA",
          "options": [
            { "label": "Até 5 min", "value": 1 },
            { "label": "Até 5 min", "value": 2 },
            { "label": "Até 5 min", "value": 3 }
          ]
        },
        {
          "id": "p4",
          "text": "Atualização do CRM",
          "options": [
            { "label": "Dificuldade com etiquetas e motivos de fechamento", "value": 1 },
            { "label": "Pequenos erros constantes", "value": 2 },
            { "label": "Zero pendências, alta organização", "value": 3 }
          ]
        },
        {
          "id": "p5",
          "text": "Ligações",
          "options": [
            { "label": "Predominância Insatisfatório", "value": 1 },
            { "label": "Predominância Satisfatório", "value": 2 },
            { "label": "Predominância Plenamente Satisfatório", "value": 3 }
          ]
        },
        {
          "id": "p6",
          "text": "Agendamentos atendidos",
          "options": [
            { "label": "Média de 4/dia", "value": 1 },
            { "label": "Média de 4/dia", "value": 2 },
            { "label": "Média de 4/dia", "value": 3 }
          ]
        },
        {
          "id": "p7",
          "text": "Constância de entrega de resultado",
          "options": [
            { "label": "Bronze ou 7-8% de conversão", "value": 1 },
            { "label": "Prata ou 8.01-10%", "value": 2 },
            { "label": "Ouro ou acima de 10%", "value": 3 }
          ]
        }
      ]
    }
  ],
  "seniority_levels": [
    { "label": "Júnior", "min_score": 0, "max_score": 50, "description": "Em fase de aprendizado." },
    { "label": "Pleno", "min_score": 51, "max_score": 80, "description": "Autônomo e consistente." },
    { "label": "Sênior", "min_score": 81, "max_score": 100, "description": "Referência técnica." }
  ]
}'::jsonb,
  '2.0'
);

-- 2. Senioridade Líder
INSERT INTO test_structures (test_type, structure, version)
VALUES (
  'seniority_leader',
  '{
  "id": "seniority_leader",
  "title": "Análise de Senioridade – Líder Comercial",
  "description": "Avaliação de habilidades comportamentais, domínio do método DEF e gestão comercial.",
  "version": "2.0",
  "categories": [
    {
      "id": "comportamental",
      "name": "Habilidades Comportamentais",
      "questions": [
        {
          "id": "c1",
          "text": "Tem controle emocional para que situações pessoais ou pontuais não afetem a qualidade do atendimento e da mensagem transmitida?",
          "options": [
            { "label": "Se abala a ponto de precisar se ausentar da operação", "value": 1 },
            { "label": "Às vezes se abala, mas reage rápido e com pouco impacto no resultado", "value": 2 },
            { "label": "Não se abala e não permite que o time se abale, entende que faz parte do jogo", "value": 3 }
          ]
        },
        {
          "id": "c2",
          "text": "Tem proatividade para lidar com sazonalidade de leads, problemas de ferramentas e imprevistos?",
          "options": [
            { "label": "Fica inerte, às vezes se desmotiva e pensa em desistir", "value": 1 },
            { "label": "Já passou por isso, confia na reação e não se abala", "value": 2 },
            { "label": "Pensa e propõe formas e soluções para a situação", "value": 3 }
          ]
        },
        {
          "id": "c3",
          "text": "É propositivo em ideias e ações que agregam na área e/ou empresa como um todo?",
          "options": [
            { "label": "Não consegue ter ideias, apenas reage às mudanças", "value": 1 },
            { "label": "Sabe que é importante colaborar, tem alguns insights mas não sabe como executar", "value": 2 },
            { "label": "Propõe ideias, entende impacto e formas de viabilização", "value": 3 }
          ]
        },
        {
          "id": "c4",
          "text": "Tem capacidade de executar o playbook proposto sem depender da cobrança do líder direto?",
          "options": [
            { "label": "Depende da cobrança do líder para execução plena", "value": 1 },
            { "label": "Executa sem cobrança e aponta situações que comprometem a execução", "value": 2 },
            { "label": "Executa plenamente e ainda propõe ajustes no playbook", "value": 3 }
          ]
        },
        {
          "id": "c5",
          "text": "Demonstra conhecimento profundo sobre produto e mercado?",
          "options": [
            { "label": "Ainda faz muitas consultas sobre informações básicas do produto", "value": 1 },
            { "label": "Tem domínio do produto, mas com limitações de repertório", "value": 2 },
            { "label": "Tem domínio do produto, está antenado no mercado e tem bom repertório de argumentação", "value": 3 }
          ]
        },
        {
          "id": "c6",
          "text": "Não terceiriza a responsabilidade de seus resultados para outras pessoas ou times?",
          "options": [
            { "label": "Reclama com frequência dizendo ter sido prejudicado", "value": 1 },
            { "label": "Sabe o que precisa fazer, mas não consegue fazer sozinho", "value": 2 },
            { "label": "Sabe o que poderia ter feito diferente e constrói plano de ação", "value": 3 }
          ]
        },
        {
          "id": "c7",
          "text": "Quando recebe feedback, pratica escuta ativa ou reage defensivamente?",
          "options": [
            { "label": "Responde sem escuta ativa, entende como crítica e se abate", "value": 1 },
            { "label": "Aceita o feedback e reage de forma positiva", "value": 2 },
            { "label": "Entende a necessidade do feedback e já toma ações para mitigar o impacto", "value": 3 }
          ]
        },
        {
          "id": "c8",
          "text": "Cumpre os compromissos acordados com seu líder e/ou grupo?",
          "options": [
            { "label": "Se sente pressionado por compromissos e busca evitá-los", "value": 1 },
            { "label": "Cumpre compromissos e se sente estimulado por eles", "value": 2 },
            { "label": "É movido por desafios e cria seus próprios compromissos", "value": 3 }
          ]
        },
        {
          "id": "c9",
          "text": "Constrói diálogos com seu líder quando se sente incomodado, sem omitir fatos?",
          "options": [
            { "label": "Não tem clareza, é pouco propositivo no 1:1", "value": 1 },
            { "label": "Consegue se expressar, mas com pouca fundamentação racional", "value": 2 },
            { "label": "Aborda a situação de forma racional, apresentando fatos", "value": 3 }
          ]
        },
        {
          "id": "c10",
          "text": "Busca capacitação e desenvolvimento constante, pessoal e profissional?",
          "options": [
            { "label": "Não tem iniciativa, só busca se for provocado", "value": 1 },
            { "label": "Busca temas ligados diretamente à área comercial", "value": 2 },
            { "label": "Mantém-se atualizado e amplia repertório além da área comercial", "value": 3 }
          ]
        },
        {
          "id": "c11",
          "text": "É claro e direto no feedback a colegas, baseado em método e técnica, sem argumentos pessoais?",
          "options": [
            { "label": "Dá feedbacks rasos, pouco fundamentados, ou se omite", "value": 1 },
            { "label": "Pontua feedbacks técnicos e propõe alterações", "value": 2 },
            { "label": "Feedbacks técnicos, precisos, com analogias e exemplos", "value": 3 }
          ]
        },
        {
          "id": "c12",
          "text": "Ajuda e permite ser ajudado em temas técnicos, comportamentais e de processo?",
          "options": [
            { "label": "Sim, mas sem clareza estruturada das próprias dificuldades", "value": 1 },
            { "label": "Sabe onde precisa de ajuda e pede com assertividade, mas ainda ajuda pouco", "value": 2 },
            { "label": "Procura ajuda proativamente e ajuda colegas com frequência", "value": 3 }
          ]
        },
        {
          "id": "c13",
          "text": "Se prontifica a ajudar colegas, especialmente iniciantes?",
          "options": [
            { "label": "Ainda não se sente capaz", "value": 1 },
            { "label": "Ajuda em assuntos pontuais, restritos ao ofício como vendedor", "value": 2 },
            { "label": "Ajuda em temas de empresa, processos, ferramentas e cultura", "value": 3 }
          ]
        },
        {
          "id": "c14",
          "text": "Participa proativamente dos ritos do time?",
          "options": [
            { "label": "Só participa quando estimulado", "value": 1 },
            { "label": "Participa na maioria das vezes", "value": 2 },
            { "label": "Participa ativamente e estimula os demais", "value": 3 }
          ]
        },
        {
          "id": "c15",
          "text": "Usa comunicação não violenta e evita juízo de valor?",
          "options": [
            { "label": "Ainda tem dificuldade de separar pessoal do profissional, mas se policia", "value": 1 },
            { "label": "Separa opiniões pessoais de sugestões profissionais", "value": 2 },
            { "label": "Cria bons relacionamentos com colegas, pares e liderança", "value": 3 }
          ]
        },
        {
          "id": "c16",
          "text": "Não mente nem omite informações importantes para tomada de decisão do potencial aluno?",
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
      "questions": [
        {
          "id": "t1",
          "text": "Etapa 0 – WhatsApp (líder analisando Jab-Direto)",
          "options": [
            { "label": "Analisa Jab-Direto com pouco repertório para criar opções", "value": 1 },
            { "label": "Dá feedbacks assertivos e propõe caminhos alternativos", "value": 2 },
            { "label": "Sugere perguntas com precisão e detalha bem o feedback do áudio", "value": 3 }
          ]
        },
        {
          "id": "t2",
          "text": "Etapa 1 – Descoberta (líder avaliando a etapa)",
          "options": [
            { "label": "Identifica recuo e perguntas, mas não aponta várias técnicas ausentes", "value": 1 },
            { "label": "Dá feedbacks para gerar conexão e antecipar objeções, mas explora pouco limiar de dor/ação", "value": 2 },
            { "label": "Ajuda a gerar conexão, mapear red flags e usar aumento de limiar de dor de forma íntegra", "value": 3 }
          ]
        },
        {
          "id": "t3",
          "text": "Etapa 2 – Encantamento (líder avaliando apresentação)",
          "options": [
            { "label": "Identifica uso ou não da Estrutura de Diálogo, mas tem dificuldade em feedbacks técnicos", "value": 1 },
            { "label": "Identifica apresentações técnicas e usa a Estrutura de Diálogo no feedback", "value": 2 },
            { "label": "Adapta sua comunicação ao perfil do liderado, usando elementos racionais, emocionais e analogias no feedback", "value": 3 }
          ]
        },
        {
          "id": "t4",
          "text": "Etapa 3 – Fechamento (líder avaliando fechamento)",
          "options": [
            { "label": "Identifica uso de ancoragem, mas só propõe ancoragem de preço", "value": 1 },
            { "label": "Ensina mais de um tipo de ancoragem e domina voz de comando", "value": 2 },
            { "label": "Tem domínio da técnica, ajuda o liderado a encontrar a melhor forma de fechar sem abrir mão de técnica", "value": 3 }
          ]
        },
        {
          "id": "t5",
          "text": "Contorno de objeção (líder avaliando objeções)",
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
      "questions": [
        {
          "id": "g1",
          "text": "Capacidade de liderança direta",
          "options": [
            { "label": "Lidera até 3 vendedores sem perder performance individual", "value": 1 },
            { "label": "Lidera até 6 vendedores sem perder performance individual", "value": 2 },
            { "label": "Lidera até 8 vendedores", "value": 3 }
          ]
        },
        {
          "id": "g2",
          "text": "Criação e organização de ritos próprios",
          "options": [
            { "label": "Segue apenas ritos do time geral", "value": 1 },
            { "label": "Cria alguns ritos próprios", "value": 2 },
            { "label": "Cria ritos próprios e colabora nos ritos gerais do time", "value": 3 }
          ]
        },
        {
          "id": "g3",
          "text": "Definição de metas individuais e de time",
          "options": [
            { "label": "Trabalha apenas com metas dadas pela liderança", "value": 1 },
            { "label": "Transforma meta global em meta de time e individual", "value": 2 },
            { "label": "Propõe metas globais e identifica ajustes nas metas da diretoria", "value": 3 }
          ]
        },
        {
          "id": "g4",
          "text": "Desenvolvimento de liderados",
          "options": [
            { "label": "Só estabelece rotinas básicas de treinamento e métricas, com dificuldade para PDI", "value": 1 },
            { "label": "Faz avaliação criteriosa de desempenho e propõe ações de desenvolvimento em PDI", "value": 2 },
            { "label": "Conduz desenvolvimento vertical/horizontal, posicionando o liderado na maior zona de produtividade", "value": 3 }
          ]
        },
        {
          "id": "g5",
          "text": "Ambiente e cultura",
          "options": [
            { "label": "Tem dificuldade em gerir ambiente, especialmente em momentos de pressão", "value": 1 },
            { "label": "Conduz bem a gestão do time em diferentes momentos", "value": 2 },
            { "label": "É exemplo de ambiente e cultura, guardião dos valores da empresa", "value": 3 }
          ]
        },
        {
          "id": "g6",
          "text": "Engajamento do time",
          "options": [
            { "label": "Tem alta adesão em agendas e participação em avaliações", "value": 1 },
            { "label": "Time altamente engajado com notas acima da média da empresa", "value": 2 },
            { "label": "Figura entre os 3 times mais engajados e com melhores notas de clima", "value": 3 }
          ]
        },
        {
          "id": "g7",
          "text": "Agenda de treinamentos",
          "options": [
            { "label": "Conduz treinamentos restritos a método de vendas e persuasão", "value": 1 },
            { "label": "Além de técnica, treina produto e mercado", "value": 2 },
            { "label": "Domina e propõe treinamentos sobre técnica, produto e temas avançados de atendimento", "value": 3 }
          ]
        },
        {
          "id": "g8",
          "text": "Contratação e processo seletivo",
          "options": [
            { "label": "Depende de RH e líder em todo o processo, sem autonomia", "value": 1 },
            { "label": "Conduz dinâmicas e avalia candidatos de forma autônoma, dependendo de RH e líder só para formalidades", "value": 2 },
            { "label": "Propõe novos processos seletivos, conduz todo o fluxo e participa de decisões de budget", "value": 3 }
          ]
        },
        {
          "id": "g9",
          "text": "Métricas e KPIs",
          "options": [
            { "label": "Acompanha dados macro, mas tem dificuldade de interpretação", "value": 1 },
            { "label": "Lê dados de forma operacional e estratégica, mas propõe poucas novas visões", "value": 2 },
            { "label": "Tem visão estratégica e operacional, identifica gargalos e provoca novas visualizações de dados", "value": 3 }
          ]
        },
        {
          "id": "g10",
          "text": "Documentação",
          "options": [
            { "label": "Tem perfil de executor, pouca rotina de organização e entrega apenas relatórios básicos", "value": 1 },
            { "label": "Contribui com o playbook, registra informações de forma estruturada e organizada", "value": 2 },
            { "label": "Documentação tão bem organizada que pode ser usada por outras áreas (marketing, produto, growth, etc.)", "value": 3 }
          ]
        }
      ]
    }
  ],
  "seniority_levels": [
    { "label": "Júnior", "min_score": 0, "max_score": 51, "description": "Líder em formação." },
    { "label": "Pleno", "min_score": 52, "max_score": 72, "description": "Líder consistente." },
    { "label": "Sênior", "min_score": 73, "max_score": 100, "description": "Líder referência." }
  ]
}'::jsonb,
  '2.0'
);

-- 3. Método DEF
INSERT INTO test_structures (test_type, structure, version)
VALUES (
  'def_method',
  '{
  "id": "def_method",
  "title": "Matriz de Análise - Método DEF",
  "description": "Avaliação detalhada de calls de vendas baseada no Método DEF.",
  "version": "1.0",
  "scale": {
    "min": 1,
    "max": 3,
    "labels": {
      "1": "Insatisfatório",
      "2": "Satisfatório",
      "3": "Plenamente Satisfatório"
    }
  },
  "categories": [
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
        { "id": "e12", "text": "Lead conhece o Expert?", "weight": 1 }
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
      ]
    }
  ]
}'::jsonb,
  '1.0'
);

-- 4. Estilo de Liderança
INSERT INTO test_structures (test_type, structure, version)
VALUES (
  'leadership_style',
  '{
  "id": "leadership_style",
  "title": "Teste de Estilo de Liderança",
  "description": "Descubra seu estilo predominante: Builder, Farmer ou Scale.",
  "version": "1.0",
  "categories": [
    {
      "id": "geral",
      "name": "Estilo de Liderança",
      "questions": [
        {
          "id": "q1",
          "text": "Você acabou de assumir uma equipe sem playbook nem processos. Qual o primeiro sentimento?",
          "options": [
            { "label": "Oba!! Vou ter muito trabalho por aqui", "value": 1 },
            { "label": "Eita... por que não me informei mais sobre a operação?", "value": 2 },
            { "label": "Hum... vai demorar um pouco mais do que eu havia previsto pra bater as metas", "value": 3 }
          ]
        },
        {
          "id": "q2",
          "text": "Como você lida com mudanças?",
          "options": [
            { "label": "Adoro testar novas abordagens e experimentar", "value": 1 },
            { "label": "Prefiro mudanças controladas, minimizando riscos", "value": 2 },
            { "label": "Mudo rápido e acelero ao máximo", "value": 3 }
          ]
        },
        {
          "id": "q3",
          "text": "O quanto você gosta de ser desafiado?",
          "options": [
            { "label": "Gosto do friozinho na barriga", "value": 1 },
            { "label": "Prefiro desafios que já tenham histórico de sucesso", "value": 2 },
            { "label": "Gosto de fazer algo que ninguém fez e que me tire o sono", "value": 3 }
          ]
        },
        {
          "id": "q4",
          "text": "O que mais te motiva como líder?",
          "options": [
            { "label": "Construir algo do zero e ver crescer", "value": 1 },
            { "label": "Ver um processo rodando de forma estável e previsível", "value": 2 },
            { "label": "Resultados rápidos e crescimento acelerado", "value": 3 }
          ]
        },
        {
          "id": "q5",
          "text": "Como você prefere liderar sua equipe?",
          "options": [
            { "label": "Treinando e formando um time do zero", "value": 1 },
            { "label": "Herdando talentos já rampados", "value": 2 },
            { "label": "Contratando muitos talentos, independente da senioridade", "value": 3 }
          ]
        },
        {
          "id": "q6",
          "text": "Ao receber um projeto novo, qual sua maior preocupação?",
          "options": [
            { "label": "Se terei autonomia para decisões", "value": 1 },
            { "label": "Se existe um processo já validado", "value": 2 },
            { "label": "Se querem crescer aceleradamente", "value": 3 }
          ]
        },
        {
          "id": "q7",
          "text": "Como você mede o sucesso da sua liderança?",
          "options": [
            { "label": "Construção de algo inovador e sólido", "value": 1 },
            { "label": "Manutenção da qualidade e desempenho estável", "value": 2 },
            { "label": "Crescimento acelerado e superação de metas", "value": 3 }
          ]
        },
        {
          "id": "q8",
          "text": "Seu time está com baixo desempenho, o que você faz?",
          "options": [
            { "label": "Mudo a estratégia completamente e começo de novo", "value": 1 },
            { "label": "Identifico erros e corrijo sem grandes mudanças", "value": 2 },
            { "label": "Aumento metas e aplico estratégias mais agressivas", "value": 3 }
          ]
        },
        {
          "id": "q9",
          "text": "Se tivesse que escolher um desafio, qual preferiria?",
          "options": [
            { "label": "Criar um setor comercial do zero", "value": 1 },
            { "label": "Gerenciar uma operação existente e mantê-la eficiente", "value": 2 },
            { "label": "Escalar um time com bons resultados para crescer mais rápido", "value": 3 }
          ]
        },
        {
          "id": "q10",
          "text": "Qual sua relação com metas e crescimento?",
          "options": [
            { "label": "Criar base antes de definir metas agressivas", "value": 1 },
            { "label": "Metas progressivas e alcançáveis", "value": 2 },
            { "label": "Crescimento acelerado e metas desafiadoras", "value": 3 }
          ]
        }
      ]
    }
  ],
  "results": [
    {
      "range": { "min": 10, "max": 16 },
      "label": "Builder",
      "description": "Você é o arquiteto de oportunidades. Líder Builder é movido pela criação."
    },
    {
      "range": { "min": 17, "max": 23 },
      "label": "Farmer",
      "description": "Você é o guardião da previsibilidade. Líder Farmer cultiva eficiência."
    },
    {
      "range": { "min": 24, "max": 30 },
      "label": "Scale",
      "description": "Você é o acelerador. Líder Scale pensa grande, rápido e em ciclos curtos."
    }
  ]
}'::jsonb,
  '1.0'
);

-- 5. Valores 8 Dimensões
INSERT INTO test_structures (test_type, structure, version)
VALUES (
  'values_8d',
  '{
  "id": "values_8d",
  "title": "Mapa de Valores em 8 Dimensões",
  "description": "Avaliação de relevância de diferentes valores pessoais em 8 dimensões.",
  "version": "1.0",
  "scale": {
    "min": 0,
    "max": 5,
    "labels": {
      "0": "Nada relevante",
      "1": "Pouco relevante",
      "2": "Razoavelmente relevante",
      "3": "Relevante",
      "4": "Muito relevante",
      "5": "Extremamente relevante"
    }
  },
  "categories": [
    {
      "id": "valores_individuais",
      "name": "Valores Individuais",
      "questions": [
        { "id": "vi1", "text": "Dignidade" },
        { "id": "vi2", "text": "Respeito por si Próprio" },
        { "id": "vi3", "text": "Respeito pela natureza e meio ambiente" },
        { "id": "vi4", "text": "Respeito pelo próximo" },
        { "id": "vi5", "text": "Igualdade" },
        { "id": "vi6", "text": "Liberdade" },
        { "id": "vi7", "text": "Amor" },
        { "id": "vi8", "text": "Autonomia ou independência" },
        { "id": "vi9", "text": "Aceitação e tolerância" },
        { "id": "vi10", "text": "Compaixão" },
        { "id": "vi11", "text": "Conhecer a si mesmo" },
        { "id": "vi12", "text": "Confiar em si mesmo" },
        { "id": "vi13", "text": "Viver de acordo com seus valores" },
        { "id": "vi14", "text": "Defender, por palavras ou ações, o que lhe parece certo" },
        { "id": "vi15", "text": "Bom humor" },
        { "id": "vi16", "text": "Pacifismo" },
        { "id": "vi17", "text": "Serenidade" }
      ]
    },
    {
      "id": "valores_espirituais",
      "name": "Valores Espirituais",
      "questions": [
        { "id": "ve1", "text": "Pratico a meditação ou participo de alguma tradição religiosa ou espiritual." },
        { "id": "ve2", "text": "A fé é importante para mim." },
        { "id": "ve3", "text": "Gosto de me sentir conectado a um todo maior do que eu." },
        { "id": "ve4", "text": "A vida tem um propósito, um valor ou uma direção." },
        { "id": "ve5", "text": "A vida é curta... Viva o momento." },
        { "id": "ve6", "text": "Depende de mim, fazer da minha vida algo melhor." },
        { "id": "ve7", "text": "Não professo qualquer código espiritual." },
        { "id": "ve8", "text": "Não tenho interesse algum pela espiritualidade." }
      ]
    },
    {
      "id": "qualidades_pessoais",
      "name": "Qualidades Pessoais",
      "questions": [
        { "id": "qp1", "text": "Paciência." },
        { "id": "qp2", "text": "Tolerância." },
        { "id": "qp3", "text": "Ter senso de humor." },
        { "id": "qp4", "text": "Força." },
        { "id": "qp5", "text": "Ser prestativo." },
        { "id": "qp6", "text": "Confiança." },
        { "id": "qp7", "text": "Ser encorajador." },
        { "id": "qp8", "text": "Atitude positiva." },
        { "id": "qp9", "text": "Ser confiável." },
        { "id": "qp10", "text": "Ser inflexível quando necessário." },
        { "id": "qp11", "text": "Ser enérgico." },
        { "id": "qp12", "text": "Ser carinhoso." },
        { "id": "qp13", "text": "Ter a mente aberta." },
        { "id": "qp14", "text": "Ser bom amigo." },
        { "id": "qp15", "text": "Ter opiniões claras e definidas." },
        { "id": "qp16", "text": "Ser eficiente e realizador." },
        { "id": "qp17", "text": "Manter o foco." },
        { "id": "qp18", "text": "Ser instruído, perceptivo e bem-informado." },
        { "id": "qp19", "text": "Ser divergente, isto é, com o foco em várias coisas ao mesmo tempo" },
        { "id": "qp20", "text": "Ser capaz." },
        { "id": "qp21", "text": "Ser tranquilo e fácil de conviver." },
        { "id": "qp22", "text": "Ter nítido sentido de direção." },
        { "id": "qp23", "text": "Ser gentil e considerado." },
        { "id": "qp24", "text": "Ser dotado de visão." },
        { "id": "qp25", "text": "Ser um bom membro da família ou da equipe" },
        { "id": "qp26", "text": "Ser dinâmico." },
        { "id": "qp27", "text": "Ser dotado de magnetismo pessoal, carisma ou autoridade." },
        { "id": "qp28", "text": "Ser uma pessoa decidida." },
        { "id": "qp29", "text": "Ser atraente e ter charme." },
        { "id": "qp30", "text": "Ser flexível ou espontâneo e seguir o fluxo." },
        { "id": "qp31", "text": "Ser gentil." },
        { "id": "qp32", "text": "Saber sentir empatia ou compaixão." },
        { "id": "qp33", "text": "Ser sensível e realista." },
        { "id": "qp34", "text": "Ser pragmático." },
        { "id": "qp35", "text": "Ser estimulante e encorajador." },
        { "id": "qp36", "text": "Ser despreocupado e divertido." },
        { "id": "qp37", "text": "Ser organizado e disciplinado" },
        { "id": "qp38", "text": "Ser original e inovador" }
      ]
    },
    {
      "id": "valores_imagem",
      "name": "Valores referentes à Imagem",
      "questions": [
        { "id": "vim1", "text": "Popular entre as pessoas em geral" },
        { "id": "vim2", "text": "Amado por algumas poucas pessoas especiais" },
        { "id": "vim3", "text": "Muito amado e bem-tratado, cercado por pessoas que o amam" },
        { "id": "vim4", "text": "Ser conhecido" },
        { "id": "vim5", "text": "Dono de um estilo reconhecível à primeira vista" },
        { "id": "vim6", "text": "Uma pessoa valorizada ou reconhecida pelas coisas que faz" },
        { "id": "vim7", "text": "Uma boa pessoa, gentil, amorosa e útil na opinião dos que a conhecem" },
        { "id": "vim8", "text": "Uma pessoa forte" },
        { "id": "vim9", "text": "Divertido e bom companheiro" },
        { "id": "vim10", "text": "Bem-ajustado e adaptado às pessoas que o cercam" },
        { "id": "vim11", "text": "Alguém que se destaca" },
        { "id": "vim12", "text": "Talentoso" },
        { "id": "vim13", "text": "Aventuroso" },
        { "id": "vim14", "text": "Um grande realizador" },
        { "id": "vim15", "text": "Um ótimo pai de crianças encantadoras" },
        { "id": "vim16", "text": "Receber reconhecimento pelos tempos difíceis que enfrentou" },
        { "id": "vim17", "text": "Ser famoso ou ter um status elevado" },
        { "id": "vim18", "text": "Ser visto como socialmente refinado" },
        { "id": "vim19", "text": "Ser aquilo que mostra" },
        { "id": "vim20", "text": "Um especialista ou autoridade em seu campo de ação" },
        { "id": "vim21", "text": "Alguém que faz diferença" },
        { "id": "vim22", "text": "Alguém que atrai pela aparência" },
        { "id": "vim23", "text": "Ser admirado por suas realizações" },
        { "id": "vim24", "text": "Um ótimo anfitrião, cujo lar é admirado" },
        { "id": "vim25", "text": "Dono de um estilo de vida próprio" }
      ]
    },
    {
      "id": "valores_emergencia",
      "name": "Valores em Momentos de Emergência",
      "questions": [
        { "id": "vem1", "text": "Passar algum tempo em meio à natureza" },
        { "id": "vem2", "text": "Solidão ou passar algum tempo sozinho" },
        { "id": "vem3", "text": "Ouvir música" },
        { "id": "vem4", "text": "Ver filmes" },
        { "id": "vem5", "text": "Admirar obras de arte" },
        { "id": "vem6", "text": "Assistir a espetáculos artísticos" },
        { "id": "vem7", "text": "Ler" },
        { "id": "vem8", "text": "Passar o tempo com um par querido" },
        { "id": "vem9", "text": "Passar tempo com jovens ou crianças" },
        { "id": "vem10", "text": "Passar o tempo na companhia de parentes" },
        { "id": "vem11", "text": "Passar tempo com um mestre, amigo inspirador, terapeuta, professor ou grupo" },
        { "id": "vem12", "text": "Estudar e adquirir conhecimentos" },
        { "id": "vem13", "text": "Aprender novas habilidades" },
        { "id": "vem14", "text": "Expressar-se criativamente" },
        { "id": "vem15", "text": "Receber de outras pessoas avaliações agradáveis e apreciativas" },
        { "id": "vem16", "text": "Ocupar o tempo com atividades criativas, como decoração do lar ou jardinagem" },
        { "id": "vem17", "text": "Levar vida social entre amigos" },
        { "id": "vem18", "text": "Exercitar-se para aprimorar condicionamento físico e saúde" },
        { "id": "vem19", "text": "Passar o tempo com animais" },
        { "id": "vem20", "text": "Receber agrados" },
        { "id": "vem21", "text": "Sair de férias ou viajar para longe de casa" },
        { "id": "vem22", "text": "Estar ligado a uma grande rede de amigos, colegas e contatos" },
        { "id": "vem23", "text": "Alegrar-se com uma realização" }
      ]
    },
    {
      "id": "valores_estilo_vida",
      "name": "Valores Referentes ao Estilo de Vida",
      "questions": [
        { "id": "vev1", "text": "Levar uma vida pacata" },
        { "id": "vev2", "text": "Sentir prazer com a ação" },
        { "id": "vev3", "text": "Ter uma vida ocupada" },
        { "id": "vev4", "text": "Gostar de passar tempo à toa" },
        { "id": "vev5", "text": "Ter um estilo simples de vida" },
        { "id": "vev6", "text": "Ser espontâneo" },
        { "id": "vev7", "text": "Trabalhar para ter o que é bom" },
        { "id": "vev8", "text": "Aprimorar-se" },
        { "id": "vev9", "text": "Fazer tudo para ter uma vida confortável e proporcionar conforto à família" },
        { "id": "vev10", "text": "Cuidar dos outros" },
        { "id": "vev11", "text": "Possuir uma bela casa" },
        { "id": "vev12", "text": "Trabalhar para ser rico e ter segurança" },
        { "id": "vev13", "text": "Possuir coisas belas" },
        { "id": "vev14", "text": "Trabalhar para gozar de status e prestígio" },
        { "id": "vev15", "text": "Gastar dinheiro viajando" },
        { "id": "vev16", "text": "Educar seus filhos do modo que lhe pareça certo" },
        { "id": "vev17", "text": "Viver pensando nos filhos" },
        { "id": "vev18", "text": "Gastar dinheiro em programas" },
        { "id": "vev19", "text": "Ter muitos amigos" },
        { "id": "vev20", "text": "Colocar a família e o lar em primeiro lugar" },
        { "id": "vev21", "text": "Encontrar o equilíbrio entre lar e trabalho" },
        { "id": "vev22", "text": "Dar prioridade ao trabalho" },
        { "id": "vev23", "text": "Colocar as necessidades dos outros à frente das suas" },
        { "id": "vev24", "text": "Dar preferência às próprias necessidades" },
        { "id": "vev25", "text": "Fazer uma contribuição à sociedade" },
        { "id": "vev26", "text": "Trabalhar em prol das causas em que acredita" },
        { "id": "vev27", "text": "Primeiro, o trabalho, depois, a diversão" },
        { "id": "vev28", "text": "Primeiro, a diversão, depois, o trabalho" },
        { "id": "vev29", "text": "Fazer o que tem de ser feito" },
        { "id": "vev30", "text": "Ser organizado" },
        { "id": "vev31", "text": "Ter poucos amigos íntimos" },
        { "id": "vev32", "text": "Manter um relacionamento responsável com um parceiro" },
        { "id": "vev33", "text": "Ser solteiro ou manter vários relacionamentos passageiros" },
        { "id": "vev34", "text": "Poupar dinheiro" },
        { "id": "vev35", "text": "Gastar dinheiro" },
        { "id": "vev36", "text": "Investir em hobbies e coisas do seu interesse" },
        { "id": "vev37", "text": "Investir em educação e aprimoramento profissional" },
        { "id": "vev38", "text": "Mudar seu estilo de vida" }
      ]
    },
    {
      "id": "valores_poder",
      "name": "Valores que Conferem Poder",
      "questions": [
        { "id": "vp1", "text": "Autodisciplina" },
        { "id": "vp2", "text": "Realizações" },
        { "id": "vp3", "text": "Ser responsável por outras pessoas" },
        { "id": "vp4", "text": "Ter responsabilidades importantes" },
        { "id": "vp5", "text": "Não ter responsabilidades" },
        { "id": "vp6", "text": "Ser saudável e ter bom preparo físico" },
        { "id": "vp7", "text": "Ser eficiente e competente" },
        { "id": "vp8", "text": "Ser talentoso ou bem-qualificado" },
        { "id": "vp9", "text": "Ter boa aparência" },
        { "id": "vp10", "text": "Ter dinheiro" },
        { "id": "vp11", "text": "Ter uma extensa rede de apoio" },
        { "id": "vp12", "text": "Ser livre para tomar as próprias decisões" },
        { "id": "vp13", "text": "Ser intimamente ligado ao seu par" },
        { "id": "vp14", "text": "Vencer as próprias limitações e os obstáculos" },
        { "id": "vp15", "text": "Acreditar em si mesmo, apesar de tudo" }
      ]
    },
    {
      "id": "valores_atitudes",
      "name": "Valores Referentes a Atitudes",
      "questions": [
        { "id": "va1", "text": "Ser confiante" },
        { "id": "va2", "text": "Ser positivo e otimista" },
        { "id": "va3", "text": "Ser realista" },
        { "id": "va4", "text": "Ter senso de humor" },
        { "id": "va5", "text": "Ser tolerante" },
        { "id": "va6", "text": "Ter a mente aberta" },
        { "id": "va7", "text": "Saber exatamente qual é a sua opinião em assuntos importantes" },
        { "id": "va8", "text": "Precisar de muitas informações antes de tomar uma decisão ou aceitar participar de um projeto" },
        { "id": "va9", "text": "Ser receptivo" },
        { "id": "va10", "text": "Ser aventureiro e curioso" },
        { "id": "va11", "text": "Ser amistoso" },
        { "id": "va12", "text": "Ser cauteloso" },
        { "id": "va13", "text": "Apreciar os riscos" },
        { "id": "va14", "text": "Preferir múltiplos contatos e atividades estimulantes" },
        { "id": "va15", "text": "Preferir dedicar-se a uma coisa de cada vez" },
        { "id": "va16", "text": "Dizer sim a um excesso de experiências novas" },
        { "id": "va17", "text": "Recusar um excesso de experiências novas" },
        { "id": "va18", "text": "Preferir segurança" },
        { "id": "va19", "text": "Dar preferência a mudanças" },
        { "id": "va20", "text": "Enfrentar a vida de peito aberto" }
      ]
    }
  ]
}'::jsonb,
  '1.0'
);
