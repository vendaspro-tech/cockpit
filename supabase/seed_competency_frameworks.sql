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


-- 6. Insert/Update for SDR (Global Template)
IF role_sdr_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges, is_template, is_active, published_at)
    VALUES (
        role_sdr_id,
        'Matriz de Competências - SDR',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        comp_behavioral_base,
        comp_technical_def_base,
        comp_process_sdr,
        '{
            "behavioral": {"junior": [16,27], "pleno": [28,37], "senior": [38,48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [7, 10], "pleno": [11, 16], "senior": [17, 21]},
            "global": {"junior": [28, 47], "pleno": [48, 66], "senior": [67, 84]}
        }'::jsonb,
        true,
        true,
        NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 7. Insert/Update for Closer (Global Template)
IF role_closer_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges, is_template, is_active, published_at)
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
        true,
        true,
        NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

-- 8. Insert/Update for Supervisor (Global Template - Different weights/ranges)
-- Note: For supervisor, "Process" is actually "Management" in doc, but we map to process column
-- Technical DEF is "Vision of Leader" - same items but evaluated as capacity to evaluate
-- Management ranges calculated: Jr (10-14), Pl (15-23), Sr (24-30) based on 10 items with max 30 points
IF role_supervisor_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (job_title_id, name, weights, behavioral_competencies, technical_def_competencies, process_competencies, scoring_ranges, is_template, is_active, published_at)
    VALUES (
        role_supervisor_id,
        'Matriz de Competências - Supervisor',
        '{"behavioral": 0.52, "technical_def": 0.16, "process": 0.32}'::jsonb,
        comp_behavioral_base,
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
            "behavioral": {"junior": [16, 27], "pleno": [28, 37], "senior": [38, 48]},
            "technical_def": {"junior": [5, 6.5], "pleno": [6.6, 11], "senior": [12, 15]},
            "process": {"junior": [10, 14], "pleno": [15, 23], "senior": [24, 30]},
            "global": {"junior": [31, 51], "pleno": [52, 72], "senior": [73, 93]}
        }'::jsonb,
        true,
        true,
        NOW()
    )
    ON CONFLICT (job_title_id) WHERE is_template = true AND is_active = true DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges,
        published_at = NOW();
END IF;

END $$;
