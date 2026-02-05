-- Enhanced Job Titles Seed with UPSERT
-- This script will INSERT job titles into ALL workspaces if they don't exist
-- Or UPDATE them if they already exist

DO $$
DECLARE
    v_workspace record;
    v_job_title_data jsonb;
BEGIN
    -- Array of job titles to upsert
    v_job_title_data := '[
        {
            "name": "SDR",
            "slug": "sdr",
            "hierarchy_level": 3,
            "subordination": "Supervisor Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Gerar e qualificar oportunidades de vendas por meio da prospecção ativa e nutrição de leads, garantindo que apenas potenciais clientes alinhados ao perfil ideal avancem para o time de Closers.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 1800}, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"},
                "pleno": {"fixed": {"type": "value", "value": 2000}, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"},
                "senior": {"fixed": {"type": "value", "value": 2700}, "variable_description": "Comissão sobre reuniões realizadas + Bônus por metas excedidas"}
            },
            "requirements": {
                "education": "Ensino Médio Completo",
                "mandatory_courses": ["Formação Closer Pro", "Livro: Receita Previsível"],
                "key_competencies": ["Comunicação clara e eficaz", "Proatividade e resiliência", "Gestão do tempo e organização"]
            },
            "kpis": ["Número de leads abordados", "Taxa de conexão", "Número de leads qualificados (SQLs)", "Taxa de qualificação", "Reuniões agendadas", "Show rate", "Passagem de bastão", "Taxa de conversão SQL -> Cliente", "Tempo médio de resposta", "Taxa de follow-up", "Pipeline", "Feedback Closers", "Taxa de rejeição", "Aderência ao processo"],
            "main_activities": ["Prospecção ativa", "Executar cadências", "Qualificar leads (ICP)", "Pesquisa de empresas", "Atualizar CRM", "Agendar reuniões", "Confirmar reuniões", "Reativar leads", "Nutrir leads", "Relatórios semanais", "Feedback ao marketing", "Feedback aos Closers", "Reuniões de alinhamento", "Estudo de mercado", "Treinamentos internos"],
            "common_challenges": []
        },
        {
            "name": "Social Seller",
            "slug": "social-seller",
            "hierarchy_level": 3,
            "subordination": "Supervisor Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Construir relacionamentos estratégicos e gerar oportunidades de vendas por meio das redes sociais, criando conexões e fortalecendo autoridade.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 2000}, "variable_description": "Comissão sobre reuniões + Bônus"},
                "pleno": {"fixed": {"type": "value", "value": 2500}, "variable_description": "Comissão sobre reuniões + Bônus"},
                "senior": {"fixed": {"type": "value", "value": 3000}, "variable_description": "Comissão sobre reuniões + Bônus"}
            },
            "requirements": {
                "education": "Ensino Médio Completo",
                "mandatory_courses": ["Formação Closer Pro", "SS Academy"],
                "key_competencies": ["Comunicação clara e eficaz", "Proatividade e resiliência", "Gestão do tempo", "Boa gramática"]
            },
            "kpis": ["Conexões novas", "Taxa de aceitação", "Interações em posts", "Mensagens enviadas", "Taxa de resposta", "Conversas qualificadas", "Leads identificados", "Taxa de conversão contatos -> reuniões", "Reuniões realizadas", "Receita originada"],
            "main_activities": ["Identificar perfis ICP", "Enviar convites conexão", "Monitorar interações", "Produzir conteúdo", "Interagir cometários", "Iniciar conversas DM", "Cadência social", "Nutrir leads", "Registrar CRM", "Qualificar leads", "Agendar reuniões"],
            "common_challenges": []
        },
        {
            "name": "Inside Sales",
            "slug": "inside-sales",
            "hierarchy_level": 3,
            "subordination": "Supervisor Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Identificar e qualificar potenciais clientes, conduzir processos de vendas consultivas e gerenciar relacionamentos iniciais.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 2000}, "variable_description": "Comissão sobre vendas + Bônus"},
                "pleno": {"fixed": {"type": "value", "value": 2500}, "variable_description": "Comissão sobre vendas + Bônus"},
                "senior": {"fixed": {"type": "value", "value": 3000}, "variable_description": "Comissão sobre vendas + Bônus"}
            },
            "requirements": {
                "education": "Ensino Médio Completo",
                "mandatory_courses": ["Formação Closer Pro"],
                "key_competencies": ["Coachability", "Comunicação clara", "Proatividade", "Gestão do tempo"]
            },
            "kpis": ["Taxa de conversão", "Faturamento mensal", "Qualidade CRM", "Engajamento", "Ciclo de vendas"],
            "main_activities": ["Cumprimento SLA", "Atualizar CRM", "Apresentação consultiva", "Propostas comerciais", "Qualificação", "Upsell/Cross-sell", "Cadências", "Negociação", "Reuniões daily"],
            "common_challenges": []
        },
        {
            "name": "Closer",
            "slug": "closer",
            "hierarchy_level": 3,
            "subordination": "Supervisor Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Conduzir negociações comerciais de alto valor, fechar contratos e garantir o atingimento de metas de receita, transformando oportunidades qualificadas em clientes.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 2000}, "variable_description": "Comissão sobre vendas + Bônus por metas"},
                "pleno": {"fixed": {"type": "value", "value": 2500}, "variable_description": "Comissão sobre vendas + Bônus por metas"},
                "senior": {"fixed": {"type": "value", "value": 3500}, "variable_description": "Comissão sobre vendas + Bônus por metas"}
            },
            "requirements": {
                "education": "Ensino Médio Completo",
                "mandatory_courses": ["Formação Closer Pro", "Técnicas Negociação"],
                "key_competencies": ["Comunicação persuasiva", "Negociação avançada", "Resiliência", "Gestão pipeline"]
            },
            "kpis": ["Taxa conversão SQL -> Cliente", "Faturamento mensal", "Ticket médio", "Ciclo vendas médio", "Taxa reativação"],
            "main_activities": ["Realizar reuniões comerciais", "Apresentar propostas", "Negociar contratos", "Fechar vendas", "Atualizar CRM", "Reativar propostas", "Upsell/Cross-sell", "Forecast semanal"],
            "common_challenges": []
        },
        {
            "name": "Supervisor Comercial",
            "slug": "supervisor-comercial",
            "hierarchy_level": 2,
            "subordination": "Coordenador Comercial",
            "allows_seniority": false,
            "sector": "Vendas",
            "mission": "Liderar e desenvolver a equipe de vendas, garantindo o atingimento de metas operacionais e a qualidade do processo comercial.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 4000}, "variable_description": "Bônus por performance da equipe"},
                "pleno": {"fixed": {"type": "value", "value": 5000}, "variable_description": "Bônus por performance da equipe"},
                "senior": {"fixed": {"type": "value", "value": 6500}, "variable_description": "Bônus por performance da equipe"}
            },
            "requirements": {
                "education": "Ensino Superior Completo ou em andamento",
                "mandatory_courses": ["Líder Pro", "Gestão de Equipes"],
                "key_competencies": ["Liderança", "Gestão de pessoas", "Análise de dados", "Comunicação"]
            },
            "kpis": ["Performance da equipe", "Taxa conversão geral", "Churn vendedores", "Desenvolvimento time"],
            "main_activities": ["Reuniões 1:1", "Daily comercial", "Análise métricas", "Treinamentos", "Contratação", "Feedback contínuo"],
            "common_challenges": []
        },
        {
            "name": "Coordenador Comercial",
            "slug": "coordenador-comercial",
            "hierarchy_level": 1,
            "subordination": "Gerente Comercial",
            "allows_seniority": false,
            "sector": "Vendas",
            "mission": "Coordenar a operação comercial, desenvolvendo estratégias táticas, processos e garantindo a execução alinhada aos objetivos estratégicos.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 6000}, "variable_description": "Bônus por atingimento de metas estratégicas"},
                "pleno": {"fixed": {"type": "value", "value": 8000}, "variable_description": "Bônus por atingimento de metas estratégicas"},
                "senior": {"fixed": {"type": "value", "value": 10000}, "variable_description": "Bônus por atingimento de metas estratégicas"}
            },
            "requirements": {
                "education": "Ensino Superior Completo",
                "mandatory_courses": ["Gestão Comercial", "Planejamento Estratégico"],
                "key_competencies": ["Planejamento", "Análise estratégica", "Liderança", "Gestão de projetos"]
            },
            "kpis": ["Atingimento meta área", "Eficiência operacional", "Desenvolvimento líderes", "Qualidade processos"],
            "main_activities": ["Planejamento tático", "Gestão supervisores", "Análise indicadores", "Projetos melhoria", "Forecast"],
            "common_challenges": []
        },
        {
            "name": "Gerente Comercial",
            "slug": "gerente-comercial",
            "hierarchy_level": 0,
            "subordination": null,
            "allows_seniority": false,
            "sector": "Vendas",
            "mission": "Definir e executar a estratégia comercial da organização, garantindo crescimento sustentável e atingimento dos objetivos de negócio.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 10000}, "variable_description": "Bônus por resultados estratégicos + PLR"},
                "pleno": {"fixed": {"type": "value", "value": 15000}, "variable_description": "Bônus por resultados estratégicos + PLR"},
                "senior": {"fixed": {"type": "value", "value": 20000}, "variable_description": "Bônus por resultados estratégicos + PLR"}
            },
            "requirements": {
                "education": "Ensino Superior Completo + MBA/Pós",
                "mandatory_courses": ["Gestão Estratégica", "Liderança Executiva"],
                "key_competencies": ["Visão estratégica", "Liderança executiva", "Gestão de resultados", "Negociação"]
            },
            "kpis": ["Receita total", "Crescimento MRR/ARR", "CAC", "LTV", "Eficiência geral"],
            "main_activities": ["Planejamento estratégico", "Definição metas", "Gestão coordenadores", "Board estratégico", "Budget"],
            "common_challenges": []
        },
        {
            "name": "Sales Operations",
            "slug": "sales-operations",
            "hierarchy_level": 2,
            "subordination": "Coordenador Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Otimizar processos comerciais, ferramentas e dados, garantindo eficiência operacional e suporte analítico para tomada de decisão.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 3500}, "variable_description": "Bônus por projetos entregues"},
                "pleno": {"fixed": {"type": "value", "value": 5000}, "variable_description": "Bônus por projetos entregues"},
                "senior": {"fixed": {"type": "value", "value": 7000}, "variable_description": "Bônus por projetos entregues"}
            },
            "requirements": {
                "education": "Ensino Superior em Administração, Engenharia ou áreas correlatas",
                "mandatory_courses": ["CRM Avançado", "Análise de Dados"],
                "key_competencies": ["Análise de dados", "Gestão de processos", "Ferramentas CRM", "Excel/BI avançado"]
            },
            "kpis": ["Qualidade dados CRM", "Tempo processos", "Adoção ferramentas", "Projetos entregues"],
            "main_activities": ["Gestão CRM", "Análise dados", "Automações", "Dashboards", "Processos", "Treinamento ferramentas"],
            "common_challenges": []
        },
        {
            "name": "Sales Enablement",
            "slug": "sales-enablement",
            "hierarchy_level": 2,
            "subordination": "Coordenador Comercial",
            "allows_seniority": true,
            "sector": "Vendas",
            "mission": "Desenvolver e capacitar o time comercial através de treinamentos, conteúdos e recursos que acelerem a performance.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 4000}, "variable_description": "Bônus por performance time"},
                "pleno": {"fixed": {"type": "value", "value": 5500}, "variable_description": "Bônus por performance time"},
                "senior": {"fixed": {"type": "value", "value": 7000}, "variable_description": "Bônus por performance time"}
            },
            "requirements": {
                "education": "Ensino Superior Completo",
                "mandatory_courses": ["Treinamento e Desenvolvimento", "Metodologias de Vendas"],
                "key_competencies": ["Didática", "Conhecimento vendas", "Comunicação", "Gestão conhecimento"]
            },
            "kpis": ["Ramp-up time", "Performance pós-treinamento", "NPS treinamentos", "Utilização recursos"],
            "main_activities": ["Criar treinamentos", "Onboarding", "Playbooks", "Battle cards", "Certificações internas", "Coaching"],
            "common_challenges": []
        },
        {
            "name": "Customer Success",
            "slug": "customer-success",
            "hierarchy_level": 3,
            "subordination": "Supervisor Comercial",
            "allows_seniority": true,
            "sector": "Customer Success",
            "mission": "Garantir o sucesso dos clientes através do acompanhamento pós-venda, reduzindo churn e maximizando retenção e expansão.",
            "remuneration": {
                "junior": {"fixed": {"type": "value", "value": 2000}, "variable_description": "Comissão Upsell/Cross-sell"},
                "pleno": {"fixed": {"type": "value", "value": 2500}, "variable_description": "Comissão Upsell/Cross-sell"},
                "senior": {"fixed": {"type": "value", "value": 3500}, "variable_description": "Comissão Upsell/Cross-sell"}
            },
            "requirements": {
                "education": "Ensino Médio Completo",
                "mandatory_courses": ["Gestão Relacionamento", "Técnicas Retenção"],
                "key_competencies": ["Empatia", "Comunicação", "Gestão conflitos", "Proatividade"]
            },
            "kpis": ["Taxa retenção", "NPS", "Receita Upsell", "Tempo resposta", "Satisfação suporte", "Churn rate"],
            "main_activities": ["Gerenciar carteira", "Monitorar progresso", "Propor melhorias", "Reuniões acompanhamento", "Coletar feedbacks", "Onboarding clientes", "Health score"],
            "common_challenges": []
        }
    ]'::jsonb;

    -- Loop through each workspace
    FOR v_workspace IN SELECT id FROM workspaces LOOP
        -- Loop through each job title in the array
        FOR i IN 0..jsonb_array_length(v_job_title_data)-1 LOOP
            DECLARE
                v_title jsonb := v_job_title_data->i;
                v_slug text := v_title->>'slug';
            BEGIN
                -- Upsert: Insert or Update based on workspace_id and slug
                INSERT INTO job_titles (
                    workspace_id,
                    name,
                    slug,
                    hierarchy_level,
                    subordination,
                    allows_seniority,
                    sector,
                    mission,
                    remuneration,
                    requirements,
                    kpis,
                    main_activities,
                    common_challenges
                )
                VALUES (
                    v_workspace.id,
                    v_title->>'name',
                    v_slug,
                    (v_title->>'hierarchy_level')::int,
                    v_title->>'subordination',
                    (v_title->>'allows_seniority')::boolean,
                    v_title->>'sector',
                    v_title->>'mission',
                    v_title->'remuneration',
                    v_title->'requirements',
                    v_title->'kpis',
                    v_title->'main_activities',
                    v_title->'common_challenges'
                )
                ON CONFLICT (workspace_id, slug)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    hierarchy_level = EXCLUDED.hierarchy_level,
                    subordination = EXCLUDED.subordination,
                    allows_seniority = EXCLUDED.allows_seniority,
                    sector = EXCLUDED.sector,
                    mission = EXCLUDED.mission,
                    remuneration = EXCLUDED.remuneration,
                    requirements = EXCLUDED.requirements,
                    kpis = EXCLUDED.kpis,
                    main_activities = EXCLUDED.main_activities,
                    common_challenges = EXCLUDED.common_challenges,
                    updated_at = NOW();
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error upserting job title % for workspace %: %', v_slug, v_workspace.id, SQLERRM;
            END;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Successfully upserted % job titles across all workspaces', jsonb_array_length(v_job_title_data);
END $$;
