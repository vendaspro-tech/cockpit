-- Seed for Competency Frameworks - ALL 10 Job Titles
-- Creates global templates (is_template = true, workspace_id = NULL)
-- Requires: job_titles seed to be executed first
-- Requires: migration 103 (global templates) to be executed first

DO $$
DECLARE
    role_sdr_id UUID;
    role_social_seller_id UUID;
    role_inside_sales_id UUID;
    role_closer_id UUID;
    role_supervisor_id UUID;
    role_coordinator_id UUID;
    role_manager_id UUID;
    role_sales_ops_id UUID;
    role_sales_enablement_id UUID;
    role_customer_success_id UUID;

    -- Common competency definitions
    comp_behavioral_base JSONB;
    comp_technical_def_base JSONB;

    -- Process competencies by role type
    comp_process_prospector JSONB;  -- SDR, Social Seller
    comp_process_closer JSONB;      -- Inside Sales, Closer
    comp_process_leader JSONB;      -- Supervisor
    comp_process_coordinator JSONB; -- Coordinator
    comp_process_manager JSONB;     -- Manager
    comp_process_ops JSONB;         -- Sales Operations
    comp_process_enablement JSONB;  -- Sales Enablement
    comp_process_cs JSONB;          -- Customer Success
BEGIN

-- Get Job Title IDs
SELECT id INTO role_sdr_id FROM job_titles WHERE slug = 'sdr' LIMIT 1;
SELECT id INTO role_social_seller_id FROM job_titles WHERE slug = 'social-seller' LIMIT 1;
SELECT id INTO role_inside_sales_id FROM job_titles WHERE slug = 'inside-sales' LIMIT 1;
SELECT id INTO role_closer_id FROM job_titles WHERE slug = 'closer' LIMIT 1;
SELECT id INTO role_supervisor_id FROM job_titles WHERE slug = 'supervisor-comercial' LIMIT 1;
SELECT id INTO role_coordinator_id FROM job_titles WHERE slug = 'coordenador-comercial' LIMIT 1;
SELECT id INTO role_manager_id FROM job_titles WHERE slug = 'gerente-comercial' LIMIT 1;
SELECT id INTO role_sales_ops_id FROM job_titles WHERE slug = 'sales-operations' LIMIT 1;
SELECT id INTO role_sales_enablement_id FROM job_titles WHERE slug = 'sales-enablement' LIMIT 1;
SELECT id INTO role_customer_success_id FROM job_titles WHERE slug = 'customer-success' LIMIT 1;

-- Common Behavioral Competencies (16 items - used by all roles)
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

-- Common Technical DEF Competencies (5 items - Sales methodology)
comp_technical_def_base := '[
  {"id": 1, "name": "Etapa 0 - WhatsApp", "description": "Abordagem inicial, Recuo, Framework de Perguntas, Jab-Direto."},
  {"id": 2, "name": "Etapa 1 - Descoberta", "description": "Conexão, SMI, Red Flags, Limiar de Dor, Acordo."},
  {"id": 3, "name": "Etapa 2 - Encantamento", "description": "Estrutura de Diálogo, CTAs, Analogias, Racional/Emocional."},
  {"id": 4, "name": "Etapa 3 - Fechamento", "description": "Ancoragem, CTA de Preço, Fechamento Presumido e Acompanhado."},
  {"id": 5, "name": "Contorno de Objeção", "description": "Empatia, Alteração de Voz, Perguntas Reflexivas, Repertório."}
]'::jsonb;

-- Process: Prospectors (SDR, Social Seller)
comp_process_prospector := '[
  {"id": 1, "name": "Execução de Cadência", "description": "% de leads contatados conforme playbook."},
  {"id": 2, "name": "Execução de Follow", "description": "Organização e pontualidade nos follow-ups."},
  {"id": 3, "name": "SLA (Tempo de Resposta)", "description": "Velocidade no primeiro contato."},
  {"id": 4, "name": "Atualização do CRM", "description": "Qualidade e constância dos dados inseridos."},
  {"id": 5, "name": "Qualidade de Ligações", "description": "Adesão aos scripts e cordialidade."},
  {"id": 6, "name": "Agendamentos Realizados", "description": "Volume de reuniões agendadas."},
  {"id": 7, "name": "Constância de Resultado", "description": "Manutenção da performance ao longo do tempo."}
]'::jsonb;

-- Process: Closers (Inside Sales, Closer)
comp_process_closer := '[
  {"id": 1, "name": "Execução de Cadência", "description": "Gestão do pipeline e tentativas de contato."},
  {"id": 2, "name": "Execução de Follow", "description": "Recuperação de deals e follow-up estruturado."},
  {"id": 3, "name": "SLA (Tempo de Resposta)", "description": "Agilidade com leads quentes."},
  {"id": 4, "name": "Atualização do CRM", "description": "Pipeline limpo e atualizado."},
  {"id": 5, "name": "Qualidade de Ligações", "description": "Postura consultiva e técnica."},
  {"id": 6, "name": "Taxa de Conversão", "description": "Eficiência de fechamento."},
  {"id": 7, "name": "Constância de Resultado", "description": "Consistência de batimento de meta."}
]'::jsonb;

-- Process: Supervisor (Operational Leader)
comp_process_leader := '[
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
]'::jsonb;

-- Process: Coordinator (Tactical Leader)
comp_process_coordinator := '[
  {"id": 1, "name": "Gestão Multi-Squad", "description": "Coordenação de múltiplos times."},
  {"id": 2, "name": "Desdobramento Estratégico", "description": "Tradução de metas para o operacional."},
  {"id": 3, "name": "Desenvolvimento de Líderes", "description": "Coaching de supervisores."},
  {"id": 4, "name": "Projetos Táticos", "description": "Implementação de iniciativas."},
  {"id": 5, "name": "Análise de Performance", "description": "Dashboard e métricas consolidadas."},
  {"id": 6, "name": "Gestão de Recursos", "description": "Alocação e redistribuição."},
  {"id": 7, "name": "Processos e Playbooks", "description": "Documentação e padronização."},
  {"id": 8, "name": "Comunicação Vertical", "description": "Ponte entre estratégia e operação."},
  {"id": 9, "name": "Resolução de Conflitos", "description": "Mediação entre times."},
  {"id": 10, "name": "Budget e Forecast", "description": "Planejamento financeiro tático."}
]'::jsonb;

-- Process: Manager (Strategic Leader)
comp_process_manager := '[
  {"id": 1, "name": "Visão Estratégica", "description": "Definição de direção e prioridades."},
  {"id": 2, "name": "Planejamento Estratégico", "description": "OKRs, metas anuais e trimestrais."},
  {"id": 3, "name": "Desenvolvimento de Líderes", "description": "Formação de coordenadores e supervisores."},
  {"id": 4, "name": "Gestão Orçamentária", "description": "Budget, forecast e ROI."},
  {"id": 5, "name": "Inovação e Projetos", "description": "Novas iniciativas e pilots."},
  {"id": 6, "name": "Stakeholder Management", "description": "Relacionamento com C-Level."},
  {"id": 7, "name": "Cultura e Engajamento", "description": "Clima organizacional e retenção."},
  {"id": 8, "name": "Analytics e BI", "description": "Data-driven decision making."},
  {"id": 9, "name": "Processos Comerciais", "description": "Arquitetura de vendas."},
  {"id": 10, "name": "Go-to-Market Strategy", "description": "Posicionamento e segmentação."}
]'::jsonb;

-- Process: Sales Operations
comp_process_ops := '[
  {"id": 1, "name": "Gestão de CRM", "description": "Administração e otimização do sistema."},
  {"id": 2, "name": "Automação de Processos", "description": "Workflows e integrações."},
  {"id": 3, "name": "Data Quality", "description": "Limpeza e higienização de dados."},
  {"id": 4, "name": "Relatórios e Dashboards", "description": "BI e visualização de dados."},
  {"id": 5, "name": "Forecasting", "description": "Previsão de vendas e pipeline."},
  {"id": 6, "name": "Territórios e Quotas", "description": "Distribuição e balanceamento."},
  {"id": 7, "name": "Stack de Ferramentas", "description": "Seleção e gestão de tech stack."},
  {"id": 8, "name": "Processos Comerciais", "description": "Documentação e melhoria contínua."},
  {"id": 9, "name": "Compliance e Governança", "description": "Políticas e auditoria."},
  {"id": 10, "name": "Suporte ao Time", "description": "Troubleshooting e treinamento."}
]'::jsonb;

-- Process: Sales Enablement
comp_process_enablement := '[
  {"id": 1, "name": "Onboarding Comercial", "description": "Trilha de integração de novos vendedores."},
  {"id": 2, "name": "Treinamentos Técnicos", "description": "Produto, metodologia e ferramentas."},
  {"id": 3, "name": "Conteúdo de Vendas", "description": "Playbooks, scripts e materiais."},
  {"id": 4, "name": "Certificações", "description": "Programas de capacitação estruturados."},
  {"id": 5, "name": "Coaching e Mentoria", "description": "Desenvolvimento individualizado."},
  {"id": 6, "name": "Battle Cards", "description": "Competitores e objeções."},
  {"id": 7, "name": "Product Knowledge", "description": "Atualizações e lançamentos."},
  {"id": 8, "name": "Sales Methodology", "description": "Implementação de frameworks."},
  {"id": 9, "name": "Gestão de Conhecimento", "description": "Base de conhecimento e FAQs."},
  {"id": 10, "name": "Métricas de Enablement", "description": "ROI de treinamentos e impacto."}
]'::jsonb;

-- Process: Customer Success
comp_process_cs := '[
  {"id": 1, "name": "Onboarding de Clientes", "description": "Implementação e time to value."},
  {"id": 2, "name": "Health Score", "description": "Monitoramento de saúde da conta."},
  {"id": 3, "name": "QBRs (Business Reviews)", "description": "Revisões periódicas estratégicas."},
  {"id": 4, "name": "Gestão de Renovações", "description": "Retenção e prevenção de churn."},
  {"id": 5, "name": "Upsell e Cross-sell", "description": "Expansão de contas."},
  {"id": 6, "name": "Gestão de Escalações", "description": "Resolução de crises e insatisfações."},
  {"id": 7, "name": "Advocacy e Referências", "description": "Cases de sucesso e NPS."},
  {"id": 8, "name": "Product Adoption", "description": "Uso e engajamento na plataforma."},
  {"id": 9, "name": "Success Plans", "description": "Planejamento conjunto com cliente."},
  {"id": 10, "name": "VOC (Voice of Customer)", "description": "Feedback para produto."}
]'::jsonb;

-----------------------------------------------------------------------
-- INSERT/UPDATE FRAMEWORKS FOR ALL 10 ROLES
-----------------------------------------------------------------------

-- 1. SDR
IF role_sdr_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_sdr_id,
        'Matriz de Competências - SDR',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_prospector,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 2. Social Seller (same as SDR)
IF role_social_seller_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_social_seller_id,
        'Matriz de Competências - Social Seller',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_prospector,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 3. Inside Sales
IF role_inside_sales_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_inside_sales_id,
        'Matriz de Competências - Inside Sales',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_closer,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 4. Closer
IF role_closer_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_closer_id,
        'Matriz de Competências - Closer',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_closer,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 5. Supervisor Comercial
IF role_supervisor_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_supervisor_id,
        'Matriz de Competências - Supervisor',
        '{"behavioral": 0.52, "technical_def": 0.16, "process": 0.32}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_leader,
        '{
            "behavioral": {"junior": [16, 27], "pleno": [28, 37], "senior": [38, 48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [10, 14], "pleno": [15, 23], "senior": [24, 30]},
            "global": {"junior": [31, 51], "pleno": [52, 72], "senior": [73, 93]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 6. Coordenador Comercial
IF role_coordinator_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_coordinator_id,
        'Matriz de Competências - Coordenador',
        '{"behavioral": 0.48, "technical_def": 0.14, "process": 0.38}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_coordinator,
        '{
            "behavioral": {"junior": [16, 27], "pleno": [28, 37], "senior": [38, 48]},
            "technical_def": {"junior": [4, 5], "pleno": [6, 9], "senior": [10, 12]},
            "process": {"junior": [10, 15], "pleno": [16, 24], "senior": [25, 30]},
            "global": {"junior": [30, 50], "pleno": [51, 73], "senior": [74, 90]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 7. Gerente Comercial
IF role_manager_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_manager_id,
        'Matriz de Competências - Gerente',
        '{"behavioral": 0.45, "technical_def": 0.10, "process": 0.45}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_manager,
        '{
            "behavioral": {"junior": [16, 27], "pleno": [28, 37], "senior": [38, 48]},
            "technical_def": {"junior": [3, 4], "pleno": [5, 7], "senior": [8, 10]},
            "process": {"junior": [11, 18], "pleno": [19, 28], "senior": [29, 36]},
            "global": {"junior": [30, 52], "pleno": [53, 75], "senior": [76, 94]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 8. Sales Operations
IF role_sales_ops_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_sales_ops_id,
        'Matriz de Competências - Sales Operations',
        '{"behavioral": 0.40, "technical_def": 0.10, "process": 0.50}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_ops,
        '{
            "behavioral": {"junior": [14, 23], "pleno": [24, 33], "senior": [34, 42]},
            "technical_def": {"junior": [2, 3], "pleno": [4, 6], "senior": [7, 9]},
            "process": {"junior": [12, 19], "pleno": [20, 29], "senior": [30, 39]},
            "global": {"junior": [28, 48], "pleno": [49, 71], "senior": [72, 90]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 9. Sales Enablement
IF role_sales_enablement_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_sales_enablement_id,
        'Matriz de Competências - Sales Enablement',
        '{"behavioral": 0.45, "technical_def": 0.15, "process": 0.40}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_enablement,
        '{
            "behavioral": {"junior": [15, 25], "pleno": [26, 35], "senior": [36, 45]},
            "technical_def": {"junior": [3, 5], "pleno": [6, 9], "senior": [10, 13]},
            "process": {"junior": [10, 16], "pleno": [17, 25], "senior": [26, 33]},
            "global": {"junior": [28, 49], "pleno": [50, 72], "senior": [73, 91]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 10. Customer Success
IF role_customer_success_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        job_title_id, name, weights,
        behavioral_competencies, technical_def_competencies, process_competencies,
        scoring_ranges, is_template, is_active, published_at
    )
    VALUES (
        role_customer_success_id,
        'Matriz de Competências - Customer Success',
        '{"behavioral": 0.48, "technical_def": 0.12, "process": 0.40}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_cs,
        '{
            "behavioral": {"junior": [15, 26], "pleno": [27, 36], "senior": [37, 46]},
            "technical_def": {"junior": [3, 4], "pleno": [5, 7], "senior": [8, 10]},
            "process": {"junior": [10, 16], "pleno": [17, 25], "senior": [26, 33]},
            "global": {"junior": [28, 49], "pleno": [50, 71], "senior": [72, 89]}
        }'::jsonb,
        true, true, NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        name = EXCLUDED.name,
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

END $$;
