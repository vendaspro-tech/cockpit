-- Seed for Job Titles (Upsert based on slug or name)
-- We use a DO block to ensure clean upserts

DO $$
DECLARE
    workspace_id uuid;
BEGIN
    -- NOTE: In a real seed, you might want to specify the workspace. 
    -- For now, we will update ALL matching job titles across all workspaces 
    -- OR insert into a default workspace if referenced. 
    -- However, RLS usually requires a workspace_id. 
    -- This specific seed might need to be run per workspace or assume a single tenant context for the user.
    -- To keep it safe and generic for the migration tool:
    -- We will try to update existing Job Titles by Name/Slug if they exist.
    -- If they don't exist, we can't easily insert without a workspace_id.
    -- STRATEGY: Update existing based on slug/name normalization. Creates missing ones requires a workspace context.
    -- Assuming this is run manually or via an onboarding flow.
    -- For the purpose of this task, we will create a function or standard INSERTs that placeholders can be replaced,
    -- or simply update known titles.
    
    -- Let's assume we are updating the "Standard" job titles.
    
    ---------------------------------------------------------------------------
    -- 1. SDR - Sales Development Representative
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'sdr',
        hierarchy_level = 3,
        subordination = 'Supervisor Comercial',
        mission = 'Gerar e qualificar oportunidades de vendas por meio da prospecção ativa e nutrição de leads, garantindo que apenas potenciais clientes alinhados ao perfil ideal avancem para o time de Closers.',
        remuneration = '{
            "junior": {"fixed": 1800, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"},
            "pleno": {"fixed": 2000, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"},
            "senior": {"fixed": 2700, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Formação Closer Pro", "Livro: Receita Previsível"],
            "key_competencies": ["Comunicação clara e eficaz", "Proatividade e resiliência", "Gestão do tempo e organização"]
        }'::jsonb,
        kpis = '["Número de leads abordados", "Taxa de conexão", "Número de leads qualificados (SQLs)", "Taxa de qualificação", "Reuniões agendadas", "Show rate", "Passagem de bastão", "Taxa de conversão SQL -> Cliente", "Tempo médio de resposta", "Taxa de follow-up", "Pipeline", "Feedback Closers", "Taxa de rejeição", "Aderência ao processo"]'::jsonb,
        main_activities = '["Prospecção ativa", "Executar cadências", "Qualificar leads (ICP)", "Pesquisa de empresas", "Atualizar CRM", "Agendar reuniões", "Confirmar reuniões", "Reativar leads", "Nutrir leads", "Relatórios semanais", "Feedback ao marketing", "Feedback aos Closers", "Reuniões de alinhamento", "Estudo de mercado", "Treinamentos internos"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'sdr' OR name ILIKE 'SDR%' OR slug = 'sdr';

    ---------------------------------------------------------------------------
    -- 2. Social Seller
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'social-seller',
        hierarchy_level = 3,
        subordination = 'Supervisor Comercial',
        mission = 'Construir relacionamentos estratégicos e gerar oportunidades de vendas por meio das redes sociais, criando conexões e fortalecendo autoridade.',
        remuneration = '{
            "junior": {"fixed": 2000, "variable_description": "Comissão sobre reuniões + Bônus"},
            "pleno": {"fixed": 2500, "variable_description": "Comissão sobre reuniões + Bônus"},
            "senior": {"fixed": 3000, "variable_description": "Comissão sobre reuniões + Bônus"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Formação Closer Pro", "SS Academy"],
            "key_competencies": ["Comunicação clara e eficaz", "Proatividade e resiliência", "Gestão do tempo", "Boa gramática"]
        }'::jsonb,
        kpis = '["Conexões novas", "Taxa de aceitação", "Interações em posts", "Mensagens enviadas", "Taxa de resposta", "Conversas qualificadas", "Leads identificados", "Taxa de conversão contatos -> reuniões", "Reuniões realizadas", "Receita originada"]'::jsonb,
        main_activities = '["Identificar perfis ICP", "Enviar convites conexão", "Monitorar interações", "Produzir conteúdo", "Interagir cometários", "Iniciar conversas DM", "Cadência social", "Nutrir leads", "Registrar CRM", "Qualificar leads", "Agendar reuniões"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'social seller' OR slug = 'social-seller';

    ---------------------------------------------------------------------------
    -- 3. Inside Sales
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'inside-sales',
        hierarchy_level = 3,
        subordination = 'Supervisor Comercial',
        mission = 'Identificar e qualificar potenciais clientes, conduzir processos de vendas consultivas e gerenciar relacionamentos iniciais.',
        remuneration = '{
            "junior": {"fixed": 2000, "variable_description": "Comissão sobre vendas + Bônus"},
            "pleno": {"fixed": 2500, "variable_description": "Comissão sobre vendas + Bônus"},
            "senior": {"fixed": 3000, "variable_description": "Comissão sobre vendas + Bônus"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Formação Closer Pro"],
            "key_competencies": ["Coachability", "Comunicação clara", "Proatividade", "Gestão do tempo"]
        }'::jsonb,
        kpis = '["Taxa de conversão", "Faturamento mensal", "Qualidade CRM", "Engajamento", "Ciclo de vendas"]'::jsonb,
        main_activities = '["Cumprimento SLA", "Atualizar CRM", "Apresentação consultiva", "Propostas comerciais", "Qualificação", "Upsell/Cross-sell", "Cadências", "Negociação", "Reuniões daily"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'inside sales' OR slug = 'inside-sales';

    ---------------------------------------------------------------------------
    -- 4. Closer
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'closer',
        hierarchy_level = 3,
        subordination = 'Supervisor Comercial',
        mission = 'Transformar leads qualificados em clientes por meio de uma abordagem consultiva, conduzindo negociações até o fechamento.',
        remuneration = '{
            "junior": {"fixed": 3000, "variable_description": "Comissão sobre vendas + Bônus"},
            "pleno": {"fixed": 3500, "variable_description": "Comissão sobre vendas + Bônus"},
            "senior": {"fixed": 4000, "variable_description": "Comissão sobre vendas + Bônus"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Formação Closer Pro"],
            "key_competencies": ["Coachability", "Comunicação clara", "Proatividade", "Gestão do tempo"]
        }'::jsonb,
        kpis = '["Taxa de fechamento", "Receita gerada", "Ticket médio", "% Meta batida", "Calls realizadas", "Velocidade follow-up", "Ciclo de vendas", "NPS", "Churn inicial"]'::jsonb,
        main_activities = '["Conduzir calls 1:1", "Venda consultiva", "Método DEF", "Apresentar solução", "Contornar objeções", "Negociar", "Fechar contratos", "Atualizar CRM", "Follow-ups estratégicos"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'closer' OR slug = 'closer';

    ---------------------------------------------------------------------------
    -- 5. Supervisor Comercial (Operational Leader)
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'supervisor-comercial',
        hierarchy_level = 2,
        subordination = 'Coordenador Comercial',
        mission = 'Garantir a produtividade e eficiência do time de Inside Sales, promovendo alinhamento estratégico e apoio individualizado.',
        remuneration = '{
            "junior": {"fixed": 4000, "variable_description": "Bônus por metas coletivas"},
            "pleno": {"fixed": 5000, "variable_description": "Bônus por metas coletivas"},
            "senior": {"fixed": 6000, "variable_description": "Bônus por metas coletivas"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo + Experiência",
            "mandatory_courses": ["Liderança e Gestão", "CRM Avançado"],
            "key_competencies": ["Análise de indicadores", "Liderança", "Resolução de conflitos"]
        }'::jsonb,
        kpis = '["Metas atingidas equipe", "Qualidade CRM", "Conversão coletiva", "Engajamento", "Rampagem novos"]'::jsonb,
        main_activities = '["Reuniões diárias", "Treinamento contínuo", "Acompanhamento individual", "Feedbacks", "Análise de KPIs", "Estratégias recuperação", "Supervisão processos"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'supervisor comercial' OR slug = 'supervisor-comercial';

    ---------------------------------------------------------------------------
    -- 6. Coordenador Comercial (Tactical Leader)
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'coordenador-comercial',
        hierarchy_level = 1,
        subordination = 'Gerente Comercial',
        mission = 'Desenvolver e implementar estratégias para o alcance das metas comerciais, liderando equipes e promovendo sinergia.',
        remuneration = '{
            "junior": {"fixed": 7000, "variable_description": "Bônus semestral"},
            "pleno": {"fixed": 8000, "variable_description": "Bônus semestral"},
            "senior": {"fixed": 10000, "variable_description": "Bônus semestral"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo + Experiência",
            "mandatory_courses": ["Planejamento Estratégico", "Inteligência de Mercado"],
            "key_competencies": ["Análise de métricas", "Estratégia comercial"]
        }'::jsonb,
        kpis = '["Metas organizacionais", "Faturamento setor", "Conversão equipe", "Ciclo de vendas", "Retenção clientes"]'::jsonb,
        main_activities = '["Planejar estratégias", "Gerenciar KPIs", "Supervisão supervisores", "Campanhas com marketing", "Treinamentos avançados", "Negociações estratégicas"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'coordenador comercial' OR slug = 'coordenador-comercial';

    ---------------------------------------------------------------------------
    -- 7. Gerente Comercial (Strategic Leader)
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'gerente-comercial',
        hierarchy_level = 0,
        subordination = 'Diretor',
        mission = 'Definir, implementar e monitorar estratégias comerciais que garantam o crescimento sustentável da empresa.',
        remuneration = '{
            "junior": {"fixed": 10000, "variable_description": "Bônus anual"},
            "pleno": {"fixed": 15000, "variable_description": "Bônus anual"},
            "senior": {"fixed": 20000, "variable_description": "Bônus anual"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo + Experiência",
            "mandatory_courses": ["Liderança Avançada", "Planejamento Estratégico"],
            "key_competencies": ["Gestão financeira", "Negociação avançada", "Tomada de decisão"]
        }'::jsonb,
        kpis = '["Crescimento receita", "Margem lucro", "Conversão grandes contas", "Funil vendas", "Retenção"]'::jsonb,
        main_activities = '["Estratégias comerciais", "Metas KP", "Performance time", "Negociações grandes contas", "Novos produtos"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'gerente comercial' OR slug = 'gerente-comercial';

    ---------------------------------------------------------------------------
    -- 8. Sales Operations
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'sales-operations',
        hierarchy_level = 3,
        subordination = 'Gerente Comercial',
        mission = 'Garantir a eficiência dos processos comerciais, analisando dados e desenvolvendo insights estratégicos.',
        remuneration = '{
            "junior": {"fixed": 4000, "variable_description": "Bônus semestral"},
            "pleno": {"fixed": 6000, "variable_description": "Bônus semestral"},
            "senior": {"fixed": 8000, "variable_description": "Bônus semestral"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Data Analytics", "Automação Processos"],
            "key_competencies": ["SQL", "Excel", "Power BI", "Analytical Skills"]
        }'::jsonb,
        kpis = '["Tempo resposta demandas", "Precisão análises", "Uso CRM", "Redução gargalos", "Eficiência campanhas"]'::jsonb,
        main_activities = '["Coletar dados", "Dashboards", "Métricas performance", "Análise tendências", "Automatizar relatórios"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'sales operations' OR slug = 'sales-operations';

    ---------------------------------------------------------------------------
    -- 9. Sales Enablement
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'sales-enablement',
        hierarchy_level = 3,
        subordination = 'Gerente Comercial',
        mission = 'Garantir que o time comercial tenha acesso a conteúdos, processos e ferramentas para aumentar eficiência.',
        remuneration = '{
            "junior": {"fixed": 4000, "variable_description": "OTE por meta time"},
            "pleno": {"fixed": 6000, "variable_description": "OTE por meta time"},
            "senior": {"fixed": 8000, "variable_description": "OTE por meta time"}
        }'::jsonb,
        requirements = '{
            "education": "Experiência prévia como vendedor",
            "mandatory_courses": ["Formação Closer Pro", "Gestão Projetos"],
            "key_competencies": ["Andragogia", "Design Instrucional", "DISC"]
        }'::jsonb,
        kpis = '["Rampagem novos", "Engajamento materiais", "Adoção ferramentas", "Produtividade time", "Retenção"]'::jsonb,
        main_activities = '["Playbook vendas", "Materiais comerciais", "Onboarding", "Roleplays", "Feedbacks", "Gestão CRM"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'sales enablement' OR slug = 'sales-enablement';

    ---------------------------------------------------------------------------
    -- 10. Customer Success
    ---------------------------------------------------------------------------
    UPDATE job_titles
    SET 
        slug = 'customer-success',
        hierarchy_level = 3,
        subordination = 'Gerente de Relacionamento',
        mission = 'Promover o sucesso do cliente por meio de acompanhamento proativo e identificação de oportunidades.',
        remuneration = '{
            "junior": {"fixed": 1800, "variable_description": "Comissão Upsell/Cross-sell"},
            "pleno": {"fixed": 2500, "variable_description": "Comissão Upsell/Cross-sell"},
            "senior": {"fixed": 3500, "variable_description": "Comissão Upsell/Cross-sell"}
        }'::jsonb,
        requirements = '{
            "education": "Ensino Médio Completo",
            "mandatory_courses": ["Gestão Relacionamento", "Técnicas Retenção"],
            "key_competencies": ["Empatia", "Comunicação", "Gestão conflitos"]
        }'::jsonb,
        kpis = '["Taxa retencão", "NPS", "Receita Upsell", "Tempo resposta", "Satisfação suporte"]'::jsonb,
        main_activities = '["Gerenciar carteira", "Monitorar progresso", "Propor melhorias", "Reuniões acompanhamento", "Coletar feedbacks"]'::jsonb,
        last_reviewed_at = '2025-08-18'
    WHERE normalize_text(name) = 'customer success' OR slug = 'customer-success';

END $$;
