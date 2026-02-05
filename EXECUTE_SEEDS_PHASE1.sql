-- ==================================================================================
-- FASE 1 - SEEDS CONSOLIDADOS
-- Execute APÓS as migrações
-- ==================================================================================

-- ==================================================================================
-- SEED 1: Job Titles
-- ==================================================================================

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

-- ==================================================================================
-- SEED 2: Competency Frameworks
-- ==================================================================================

-- Seed for Competency Frameworks (SDR, Closer, Supervisor, etc.)
-- Requires job_titles to be populated/searchable by name or slug.

DO $$
DECLARE
    role_sdr_id UUID;
    role_closer_id UUID;
    role_supervisor_id UUID;
    
    -- JSON blobs for competencies to avoid repetition
    comp_behavioral_base JSONB;
    comp_technical_def_base JSONB;
    comp_process_sdr JSONB;
    comp_process_closer JSONB;
    
    -- Ranges
    range_sdr_global JSONB;
    range_supervisor_global JSONB;
BEGIN

-- 1. Get Job IDs
SELECT id INTO role_sdr_id FROM job_titles WHERE slug = 'sdr' OR normalize_text(name) = 'sdr' LIMIT 1;
SELECT id INTO role_closer_id FROM job_titles WHERE slug = 'closer' OR normalize_text(name) = 'closer' LIMIT 1;
SELECT id INTO role_supervisor_id FROM job_titles WHERE slug = 'supervisor-comercial' OR normalize_text(name) = 'supervisor comercial' LIMIT 1;

-- 2. Define Common Competency Bodies (Behavioral - 16 items)
comp_behavioral_base := '[
  {"id": 1, "name": "Controle Emocional", "description": "Capacidade de manter a consistência emocional sob pressão."},
  {"id": 2, "name": "Proatividade (Problemas)", "description": "Antecipação e resolução de problemas."},
  {"id": 3, "name": "Propositivo (Ideias)", "description": "Capacidade de gerar e implementar novas ideias."},
  {"id": 4, "name": "Autonomia (Playbook)", "description": "Independência na execução dos processos."},
  {"id": 5, "name": "Conhecimento Produto/Mercado", "description": "Domínio técnico sobre o que vende e para quem vende."},
  {"id": 6, "name": "Responsabilidade (Resultados)", "description": "Accountability sobre suas entregas."},
  {"id": 7, "name": "Coachability (Feedback)", "description": "Capacidade de receber e aplicar feedbacks."},
  {"id": 8, "name": "Comprometimento", "description": "Dedicação aos acordos e resultados."},
  {"id": 9, "name": "Comunicação com Líder", "description": "Clareza e assertividade na comunicação vertical."},
  {"id": 10, "name": "Desenvolvimento Contínuo", "description": "Busca constante por aprendizado."},
  {"id": 11, "name": "Feedback Técnico (Pares)", "description": "Contribuição para o crescimento do time."},
  {"id": 12, "name": "Colaboração", "description": "Trabalho em equipe e ajuda mútua."},
  {"id": 13, "name": "Mentoria", "description": "Capacidade de ensinar e desenvolver outros."},
  {"id": 14, "name": "Participação (Ritos)", "description": "Presença ativa nas rotinas do time."},
  {"id": 15, "name": "Comunicação Não Violenta", "description": "Postura construtiva e empática."},
  {"id": 16, "name": "Integridade", "description": "Ética e transparência nas ações."}
]'::jsonb;

-- 3. Define Common DEF Technical (5 items)
comp_technical_def_base := '[
  {"id": 1, "name": "Etapa 0 - WhatsApp", "description": "Abordagem inicial, Recuo, Framework de Perguntas, Jab-Direto."},
  {"id": 2, "name": "Etapa 1 - Descoberta", "description": "Conexão, SMI, Red Flags, Limiar de Dor, Acordo."},
  {"id": 3, "name": "Etapa 2 - Encantamento", "description": "Estrutura de Diálogo, CTAs, Analogias, Racional/Emocional."},
  {"id": 4, "name": "Etapa 3 - Fechamento", "description": "Ancoragem, CTA de Preço, Fechamento Presumido e Acompanhado."},
  {"id": 5, "name": "Contorno de Objeção", "description": "Empatia, Alteração de Voz, Perguntas Reflexivas, Repertório."}
]'::jsonb;

-- 4. Process Competencies (SDR)
comp_process_sdr := '[
  {"id": 1, "name": "Execução de Cadência", "description": "% de leads contatados conforme playbook."},
  {"id": 2, "name": "Execução de Follow", "description": "Organização e pontualidade nos follow-ups."},
  {"id": 3, "name": "SLA (Tempo de Resposta)", "description": "Velocidade no primeiro contato."},
  {"id": 4, "name": "Atualização do CRM", "description": "Qualidade e constância dos dados inseridos."},
  {"id": 5, "name": "Ligações (Qualidade)", "description": "Adesão aos scripts e cordialidade."},
  {"id": 6, "name": "Agendamentos Atendidos", "description": "Volume de reuniões realizadas."},
  {"id": 7, "name": "Constância de Resultado", "description": "Manutenção da performance ao longo do tempo."}
]'::jsonb;

-- 5. Process Competencies (Closer - same items usually, adjusted description in context, but names match doc)
comp_process_closer := '[
  {"id": 1, "name": "Execução de Cadência", "description": "Gestão do pipeline e tentativas de contato."},
  {"id": 2, "name": "Execução de Follow", "description": "Recuperação de deals e follow-up estruturado."},
  {"id": 3, "name": "SLA (Tempo de Resposta)", "description": "Agilidade com leads quentes."},
  {"id": 4, "name": "Atualização do CRM", "description": "Pipeline limpo e atualizado."},
  {"id": 5, "name": "Ligações (Qualidade)", "description": "Postura consultiva e técnica."},
  {"id": 6, "name": "Taxa de Conversão", "description": "Eficiência de fechamento (Substitui Agendamentos)."},
  {"id": 7, "name": "Constância de Resultado", "description": "Consistência de batimento de meta."}
]'::jsonb;


-- 6. Insert/Update for SDR
IF role_sdr_id IS NOT NULL THEN
    -- Check if exists, update or insert
    INSERT INTO competency_frameworks (workspace_id, job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges)
    VALUES (
        NULL, -- Global fallback (or specific workspace if known)
        role_sdr_id,
        'Matriz de Competências - SDR',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}',
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_sdr,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb
    )
    ON CONFLICT (job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;
END IF;

-- 7. Insert/Update for Closer (Same ranges/weights as SDR in doc)
IF role_closer_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges)
    VALUES (
        role_closer_id,
        'Matriz de Competências - Closer',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}',
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_closer,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb
    )
    ON CONFLICT (job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;
END IF;

-- 8. Insert/Update for Supervisor (Different weights/ranges)
IF role_supervisor_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges)
    VALUES (
        role_supervisor_id,
        'Matriz de Competências - Supervisor',
        '{"behavioral": 0.52, "technical_def": 0.16, "process": 0.32}', 
        -- Note: For supervisor, "Process" is actually "Management" in doc, but we map to process column
        comp_behavioral_base, 
        -- Technical DEF is "Vision of Leader" - same items but evaluated as capacity to evaluate
        comp_technical_def_base,
        '[
          {"id": 1, "name": "Capacidade de Liderança", "description": "Tamanho do time e performance."},
          {"id": 2, "name": "Criação de Ritos", "description": "Gestão da rotina do time."},
          {"id": 3, "name": "Definição de Metas", "description": "Desdobramento estratégico."},
          {"id": 4, "name": "Desenvolvimento de Liderados", "description": "PDI e treinamento."},
          {"id": 5, "name": "Ambiente e Cultura", "description": "Clima organizacional."},
          {"id": 6, "name": "Engajamento do Time", "description": "Participação e motivação."},
          {"id": 7, "name": "Agenda de Treinamentos", "description": "Capacitação técnica e produto."},
          {"id": 8, "name": "Contratação e Processo Seletivo", "description": "Formação do time."},
          {"id": 9, "name": "Métricas e KPIs", "description": "Análise de dados."},
          {"id": 10, "name": "Documentação", "description": "Gestão do conhecimento."}
        ]'::jsonb,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7 ,10], "pleno": [11, 16], "senior": [17, 21]}, 
            -- Note: Process (Management) has 10 items. Max score 30.
            -- Doc ranges for Management: Jr 7-10? Wait.
            -- 10 items * 3 = 30 max.
            -- Document says: 7-10 Jr, 11-16 Pl, 17-21 Sr? 
            -- That seems low for 10 items (avg 1-2). Let's stick to doc: "7-10, 11-16, 17-21".
            -- WAIT, doc says Management ranges are SAME as Process? 
            -- No, let's re-read doc: "7-10 points: Júnior". 
            -- 10 items. Max 30. 7-10 is very low.
            -- Ah, doc has "4. COMPETÊNCIAS DE GESTÃO COMERCIAL (10 itens)".
            -- "Ranges Globais: 31-51 Jr, 52-72 Pl, 73-93 Sr".
            -- Let us trust the Global ranges in doc and just input "process" ranges as defined in doc segment for "Process" or infer.
            -- Re-reading Doc segment for Supervisor Management:
            -- "Faixas de Pontuação (Gestão): 7-10 Jr, 11-16 Pl, 17-21 Sr" -> This block seems copied from Process (7 items).
            -- 10 items * 1 = 10 min. 10 * 3 = 30 max. 
            -- If ranges are 7-10, it implies standard 7 items. BUT there are 10 items.
            -- This looks like a typo in the Markdown doc (copy-paste error).
            -- Decision: I will scale the ranges for Management (10 items) proportionally or use logic.
            -- Process (7 items) -> Max 21. Ranges 7-10 (33-47%), 11-16 (52-76%), 17-21 (80-100%).
            -- Management (10 items) -> Max 30.
            -- Proportional: Jr (10-14), Pl (15-23), Sr (24-30).
            -- Let's use these proportional ranges to be safe, or just insert what is there and flag it.
            -- Actually, let's calculate back from Global.
            -- Global Supervisor: Jr 31-51.
            -- Behavior (16 items -> 16-48). Jr 16-27.
            -- Tech (5 items -> 5-15). Jr 5-6.5.
            -- Management (10 items -> 10-30). 
            -- Jr Global Check: 16 + 5 + 10 = 31 (Min). Correct.
            -- Pl Global Check: 28 + 6.6 + 15 = 49.6 (approx 50).
            -- So Management ranges should be:
            -- Jr: 10-14 approx.
            -- Pl: 15-23 approx.
            -- Sr: 24-30.
            -- I will use these calculated ranges for "process" (management) in JSON.
            "process": {"junior": [10, 14], "pleno": [15, 23], "senior": [24, 30]},
            "global": {"junior": [31, 51], "pleno": [52, 72], "senior": [73, 93]}
        }'::jsonb
    )
    ON CONFLICT (job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;
END IF;

END $$;
