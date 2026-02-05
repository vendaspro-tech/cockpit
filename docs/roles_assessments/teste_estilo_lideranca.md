# Teste Estilo de Liderança

```json
{
  "quiz_id": "leadership_style_test",
  "title": "Teste de Estilo de Liderança",
  "description": "Descubra seu estilo predominante: Builder, Farmer ou Scale.",
  "questions": [
    {
      "id": "q1",
      "question": "Você acabou de assumir uma equipe sem playbook nem processos. Qual o primeiro sentimento?",
      "options": [
        { "label": "Oba!! Vou ter muito trabalho por aqui", "value": 1 },
        { "label": "Eita... por que não me informei mais sobre a operação?", "value": 2 },
        { "label": "Hum... vai demorar um pouco mais do que eu havia previsto pra bater as metas", "value": 3 }
      ]
    },
    {
      "id": "q2",
      "question": "Como você lida com mudanças?",
      "options": [
        { "label": "Adoro testar novas abordagens e experimentar", "value": 1 },
        { "label": "Prefiro mudanças controladas, minimizando riscos", "value": 2 },
        { "label": "Mudo rápido e acelero ao máximo", "value": 3 }
      ]
    },
    {
      "id": "q3",
      "question": "O quanto você gosta de ser desafiado?",
      "options": [
        { "label": "Gosto do friozinho na barriga", "value": 1 },
        { "label": "Prefiro desafios que já tenham histórico de sucesso", "value": 2 },
        { "label": "Gosto de fazer algo que ninguém fez e que me tire o sono", "value": 3 }
      ]
    },
    {
      "id": "q4",
      "question": "O que mais te motiva como líder?",
      "options": [
        { "label": "Construir algo do zero e ver crescer", "value": 1 },
        { "label": "Ver um processo rodando de forma estável e previsível", "value": 2 },
        { "label": "Resultados rápidos e crescimento acelerado", "value": 3 }
      ]
    },
    {
      "id": "q5",
      "question": "Como você prefere liderar sua equipe?",
      "options": [
        { "label": "Treinando e formando um time do zero", "value": 1 },
        { "label": "Herdando talentos já rampados", "value": 2 },
        { "label": "Contratando muitos talentos, independente da senioridade", "value": 3 }
      ]
    },
    {
      "id": "q6",
      "question": "Ao receber um projeto novo, qual sua maior preocupação?",
      "options": [
        { "label": "Se terei autonomia para decisões", "value": 1 },
        { "label": "Se existe um processo já validado", "value": 2 },
        { "label": "Se querem crescer aceleradamente", "value": 3 }
      ]
    },
    {
      "id": "q7",
      "question": "Como você mede o sucesso da sua liderança?",
      "options": [
        { "label": "Construção de algo inovador e sólido", "value": 1 },
        { "label": "Manutenção da qualidade e desempenho estável", "value": 2 },
        { "label": "Crescimento acelerado e superação de metas", "value": 3 }
      ]
    },
    {
      "id": "q8",
      "question": "Seu time está com baixo desempenho, o que você faz?",
      "options": [
        { "label": "Mudo a estratégia completamente e começo de novo", "value": 1 },
        { "label": "Identifico erros e corrijo sem grandes mudanças", "value": 2 },
        { "label": "Aumento metas e aplico estratégias mais agressivas", "value": 3 }
      ]
    },
    {
      "id": "q9",
      "question": "Se tivesse que escolher um desafio, qual preferiria?",
      "options": [
        { "label": "Criar um setor comercial do zero", "value": 1 },
        { "label": "Gerenciar uma operação existente e mantê-la eficiente", "value": 2 },
        { "label": "Escalar um time com bons resultados para crescer mais rápido", "value": 3 }
      ]
    },
    {
      "id": "q10",
      "question": "Qual sua relação com metas e crescimento?",
      "options": [
        { "label": "Criar base antes de definir metas agressivas", "value": 1 },
        { "label": "Metas progressivas e alcançáveis", "value": 2 },
        { "label": "Crescimento acelerado e metas desafiadoras", "value": 3 }
      ]
    }
  ],
  "scoring": {
    "method": "sum",
    "field": "value"
  },
  "results": [
    {
      "range": { "min": 10, "max": 16 },
      "label": "Builder",
      "description": "Você é o arquiteto de oportunidades. Líder Builder é movido pela criação — vê um terreno baldio e já começa a imaginar a planta baixa do futuro. Sente prazer em colocar ordem no caos, definir processos e construir estruturas sólidas onde antes havia improviso. Seu pensamento é estratégico, quase artesanal: gosta de ver as coisas tomando forma, ganhar vida, evoluir. É o tipo de líder que chega antes da luz acender e sai depois que o alicerce está firme.\n\n**Pontos Fortes:** visão de longo prazo, criatividade estruturada, alta capacidade de resolver problemas complexos, consistência no início das operações, cria bases que sustentam grandes crescimentos.\n\n**Pontos de Atenção:** pode se frustrar com ambientes que mudam rápido demais, tende a demorar mais para tomar decisões quando não tem clareza, pode se sobrecarregar assumindo muitas frentes no início.\n\n**Onde você brilha:** projetos zero a um, times em construção, empresas que precisam de fundação sólida antes de acelerar.\n\n**Seu superpoder:** transformar caos em sistema.\n\n**Seu risco oculto:** virar o 'fazedor oficial' que carrega tudo nas costas se não delegar cedo.\n\n**Frase que te representa:** “Primeiro estrutura, depois velocidade.”"
    },
    {
      "range": { "min": 17, "max": 23 },
      "label": "Farmer",
      "description": "Você é o guardião da previsibilidade. Líder Farmer cultiva eficiência como quem cuida de uma plantação: prepara o solo, mantém o ritmo, corrige pragas e garante colheitas consistentes. Seu foco é estabilidade, qualidade e performance contínua. Gosta de rotinas bem definidas, processos maduros e times que funcionam como engrenagens precisas.\n\n**Pontos Fortes:** estabilidade operacional, gestão eficiente de times, manutenção de performance, redução de riscos, criação de cadências previsíveis, visão realista e equilibrada.\n\n**Pontos de Atenção:** pode evitar mudanças necessárias por cautela, pode ser mais lento para tomar riscos estratégicos, às vezes precisa de um empurrão para inovar.\n\n**Onde você brilha:** operações já estruturadas, times maduros, empresas que precisam reduzir desperdícios, organizar processos e manter alta performance.\n\n**Seu superpoder:** transformar operação em máquina.\n\n**Seu risco oculto:** manter processos demais quando o mercado exige velocidade.\n\n**Frase que te representa:** “Consistência é poder.”"
    },
    {
      "range": { "min": 24, "max": 30 },
      "label": "Scale",
      "description": "Você é o acelerador. Líder Scale pensa grande, rápido e em ciclos curtos. Seu combustível é crescimento — metas desafiadoras, operações de alta velocidade e times preparados para escalar. Não tem medo de arriscar, testar, ajustar e tentar novamente. É visionário, agressivo quando necessário e tem instinto de crescimento exponencial.\n\n**Pontos Fortes:** velocidade de execução, foco em resultados, capacidade de enxergar oportunidades antes dos outros, mentalidade orientada a metas e expansão.\n\n**Pontos de Atenção:** pode queimar energia e equipes se a base não estiver sólida, corre risco de escalar problemas não resolvidos, pode atropelar processos importantes.\n\n**Onde você brilha:** times de alta performance, empresas em estágio de crescimento acelerado, operações prontas para multiplicar resultados.\n\n**Seu superpoder:** causar saltos quânticos de crescimento.\n\n**Seu risco oculto:** crescer rápido demais sem estrutura — o famoso “escalei o que não deveria ter escalado”.\n\n**Frase que te representa:** “Velocidade é minha vantagem competitiva.”"
    }
  ]
}

```