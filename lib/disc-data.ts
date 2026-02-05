export const DISC_PROFILES: Record<string, {
  name: string
  description: string
  strengths: string[]
  development_areas: string[]
  ideal_roles: string[]
}> = {
  // Single Profiles (High Dominance)
  'D': {
    name: "O Competidor (Dominância)",
    description: "Foco em resultados e atingimento de metas. Decisões rápidas e abordagem direta. Gosta de desafios e competição.",
    strengths: [
      "Alta performance sob pressão",
      "Excelente em fechamento de vendas",
      "Ótimo para deals complexos que exigem assertividade",
      "Assume riscos calculados"
    ],
    development_areas: [
      "Pode parecer agressivo ou impaciente com prospects",
      "Tende a pular etapas do processo de vendas",
      "Pode ter dificuldade em ouvir objeções",
      "Precisa desenvolver empatia e paciência"
    ],
    ideal_roles: ["Closer", "Hunter", "Vendas Transacionais"]
  },
  'I': {
    name: "O Networker (Influência)",
    description: "Excelente em construir relacionamentos. Comunicação entusiasmada e persuasiva. Usa storytelling e conexão emocional.",
    strengths: [
      "Ótimo em networking e geração de indicações",
      "Excelente apresentador e comunicador",
      "Cria experiências memoráveis para clientes",
      "Alto engajamento em redes sociais"
    ],
    development_areas: [
      "Pode focar demais no relacionamento e pouco na venda",
      "Dificuldade em ser direto sobre dinheiro e fechamento",
      "Pode evitar conflitos necessários",
      "Precisa de mais disciplina e organização"
    ],
    ideal_roles: ["SDR", "Vendas Consultivas", "Account Management"]
  },
  'S': {
    name: "O Consultor (Estabilidade)",
    description: "Abordagem paciente e consultiva. Excelente ouvinte das necessidades do cliente. Confiável e consistente na performance.",
    strengths: [
      "Alta retenção de clientes e baixo churn",
      "Excelente em vendas de ciclo longo",
      "Constrói confiança duradoura",
      "Performance estável e previsível"
    ],
    development_areas: [
      "Pode ter dificuldade com metas agressivas",
      "Evita confronto e objeções difíceis",
      "Pode ser muito lento no processo de vendas",
      "Precisa de mais assertividade no fechamento"
    ],
    ideal_roles: ["Customer Success", "Vendas Enterprise", "Farming"]
  },
  'C': {
    name: "O Especialista (Conformidade)",
    description: "Abordagem técnica e baseada em dados. Preparação meticulosa antes das reuniões. Domínio profundo do produto/solução.",
    strengths: [
      "Excelente em vendas técnicas e complexas",
      "Credibilidade com prospects analíticos",
      "Apresentações e propostas impecáveis",
      "Ótimo em prever e mitigar objeções"
    ],
    development_areas: [
      "Pode ser excessivamente detalhista",
      "Dificuldade em adaptar-se a mudanças rápidas",
      "Pode parecer frio ou distante",
      "Precisa desenvolver mais conexão emocional"
    ],
    ideal_roles: ["Vendas Técnicas", "Engenharia de Vendas", "Consultoria"]
  },

  // Combined Profiles
  'DI': {
    name: "O Influenciador Competitivo",
    description: "Combina assertividade com carisma. Fecha vendas rapidamente enquanto cria conexão emocional. Ideal para vendas de alto volume com relacionamento.",
    strengths: ["Fechamento rápido", "Carisma", "Assertividade", "Networking"],
    development_areas: ["Paciência", "Detalhes técnicos", "Escuta ativa"],
    ideal_roles: ["Closer", "BDR", "Líder Comercial"]
  },
  'ID': {
    name: "O Influenciador Competitivo",
    description: "Combina assertividade com carisma. Fecha vendas rapidamente enquanto cria conexão emocional. Ideal para vendas de alto volume com relacionamento.",
    strengths: ["Fechamento rápido", "Carisma", "Assertividade", "Networking"],
    development_areas: ["Paciência", "Detalhes técnicos", "Escuta ativa"],
    ideal_roles: ["Closer", "BDR", "Líder Comercial"]
  },
  'DC': {
    name: "O Estrategista de Resultados",
    description: "Foco em dados e performance. Toma decisões rápidas baseadas em análise. Ideal para vendas técnicas que exigem fechamento rápido.",
    strengths: ["Análise rápida", "Foco em ROI", "Objetividade", "Precisão"],
    development_areas: ["Empatia", "Flexibilidade", "Relacionamento"],
    ideal_roles: ["Vendas Técnicas", "Closer Enterprise"]
  },
  'CD': {
    name: "O Estrategista de Resultados",
    description: "Foco em dados e performance. Toma decisões rápidas baseadas em análise. Ideal para vendas técnicas que exigem fechamento rápido.",
    strengths: ["Análise rápida", "Foco em ROI", "Objetividade", "Precisão"],
    development_areas: ["Empatia", "Flexibilidade", "Relacionamento"],
    ideal_roles: ["Vendas Técnicas", "Closer Enterprise"]
  },
  'DS': {
    name: "O Líder Confiável",
    description: "Equilibra assertividade com paciência. Fecha vendas mantendo relacionamentos de longo prazo. Ideal para gestão comercial.",
    strengths: ["Liderança", "Consistência", "Foco no longo prazo", "Resolução de conflitos"],
    development_areas: ["Inovação rápida", "Adaptação a mudanças bruscas"],
    ideal_roles: ["Gestão Comercial", "Key Account Manager"]
  },
  'SD': {
    name: "O Líder Confiável",
    description: "Equilibra assertividade com paciência. Fecha vendas mantendo relacionamentos de longo prazo. Ideal para gestão comercial.",
    strengths: ["Liderança", "Consistência", "Foco no longo prazo", "Resolução de conflitos"],
    development_areas: ["Inovação rápida", "Adaptação a mudanças bruscas"],
    ideal_roles: ["Gestão Comercial", "Key Account Manager"]
  },
  'IS': {
    name: "O Construtor de Relacionamentos",
    description: "Excelente em criar conexões profundas e duradouras. Venda consultiva com alto foco no cliente. Ideal para account management.",
    strengths: ["Empatia", "Comunicação", "Trabalho em equipe", "Lealdade"],
    development_areas: ["Fechamento agressivo", "Foco em metas de curto prazo"],
    ideal_roles: ["Account Management", "Customer Success", "SDR"]
  },
  'SI': {
    name: "O Construtor de Relacionamentos",
    description: "Excelente em criar conexões profundas e duradouras. Venda consultiva com alto foco no cliente. Ideal para account management.",
    strengths: ["Empatia", "Comunicação", "Trabalho em equipe", "Lealdade"],
    development_areas: ["Fechamento agressivo", "Foco em metas de curto prazo"],
    ideal_roles: ["Account Management", "Customer Success", "SDR"]
  },
  'IC': {
    name: "O Comunicador Técnico",
    description: "Combina entusiasmo com expertise. Explica conceitos complexos de forma envolvente. Ideal para vendas técnicas B2B.",
    strengths: ["Didática", "Persuasão técnica", "Criatividade", "Precisão"],
    development_areas: ["Foco", "Gestão de tempo", "Rotina"],
    ideal_roles: ["Vendas Técnicas", "Pré-vendas", "Treinamento"]
  },
  'CI': {
    name: "O Comunicador Técnico",
    description: "Combina entusiasmo com expertise. Explica conceitos complexos de forma envolvente. Ideal para vendas técnicas B2B.",
    strengths: ["Didática", "Persuasão técnica", "Criatividade", "Precisão"],
    development_areas: ["Foco", "Gestão de tempo", "Rotina"],
    ideal_roles: ["Vendas Técnicas", "Pré-vendas", "Treinamento"]
  },
  'SC': {
    name: "O Analista Paciente",
    description: "Abordagem metódica e confiável. Processos estruturados com foco em qualidade. Ideal para vendas enterprise complexas.",
    strengths: ["Organização", "Paciência", "Qualidade", "Segurança"],
    development_areas: ["Velocidade", "Risco", "Improvisação"],
    ideal_roles: ["Vendas Enterprise", "Operações de Vendas", "CS Ops"]
  },
  'CS': {
    name: "O Analista Paciente",
    description: "Abordagem metódica e confiável. Processos estruturados com foco em qualidade. Ideal para vendas enterprise complexas.",
    strengths: ["Organização", "Paciência", "Qualidade", "Segurança"],
    development_areas: ["Velocidade", "Risco", "Improvisação"],
    ideal_roles: ["Vendas Enterprise", "Operações de Vendas", "CS Ops"]
  }
}
