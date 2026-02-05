-- ==================================================================================
-- SEED 2: Competency Frameworks (FIXED)
-- Execute APÓS o seed de Job Titles
-- ==================================================================================

DO $$
DECLARE
    role_sdr_id UUID;
    role_closer_id UUID;
    role_supervisor_id UUID;
BEGIN

-- 1. Get Job IDs
SELECT id INTO role_sdr_id FROM job_titles
WHERE slug = 'sdr' OR LOWER(TRIM(name)) = 'sdr' LIMIT 1;

SELECT id INTO role_closer_id FROM job_titles
WHERE slug = 'closer' OR LOWER(TRIM(name)) = 'closer' LIMIT 1;

SELECT id INTO role_supervisor_id FROM job_titles
WHERE slug = 'supervisor-comercial' OR LOWER(TRIM(name)) = 'supervisor comercial' LIMIT 1;

-- 2. SDR Competency Framework
IF role_sdr_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        workspace_id,
        job_title_id,
        name,
        weights,
        behavioral_competencies,
        technical_def_competencies,
        process_competencies,
        scoring_ranges
    )
    SELECT
        jt.workspace_id,
        role_sdr_id,
        'SDR Competency Matrix',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        -- 16 Behavioral Competencies
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Controle Emocional'),
            jsonb_build_object('id', 2, 'name', 'Proatividade (Problemas)'),
            jsonb_build_object('id', 3, 'name', 'Propositivo (Ideias)'),
            jsonb_build_object('id', 4, 'name', 'Autonomia (Playbook)'),
            jsonb_build_object('id', 5, 'name', 'Conhecimento Produto/Mercado'),
            jsonb_build_object('id', 6, 'name', 'Responsabilidade (Resultados)'),
            jsonb_build_object('id', 7, 'name', 'Coachability (Feedback)'),
            jsonb_build_object('id', 8, 'name', 'Comprometimento'),
            jsonb_build_object('id', 9, 'name', 'Comunicacao com Lider'),
            jsonb_build_object('id', 10, 'name', 'Desenvolvimento Continuo'),
            jsonb_build_object('id', 11, 'name', 'Feedback Tecnico (Pares)'),
            jsonb_build_object('id', 12, 'name', 'Colaboracao'),
            jsonb_build_object('id', 13, 'name', 'Mentoria'),
            jsonb_build_object('id', 14, 'name', 'Participacao (Ritos)'),
            jsonb_build_object('id', 15, 'name', 'Comunicacao Nao Violenta'),
            jsonb_build_object('id', 16, 'name', 'Integridade')
        ),
        -- 5 DEF Technical Competencies
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Etapa 0 - WhatsApp'),
            jsonb_build_object('id', 2, 'name', 'Etapa 1 - Descoberta'),
            jsonb_build_object('id', 3, 'name', 'Etapa 2 - Encantamento'),
            jsonb_build_object('id', 4, 'name', 'Etapa 3 - Fechamento'),
            jsonb_build_object('id', 5, 'name', 'Contorno de Objecao')
        ),
        -- 7 Process Competencies (SDR)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Execucao de Cadencia'),
            jsonb_build_object('id', 2, 'name', 'Execucao de Follow'),
            jsonb_build_object('id', 3, 'name', 'SLA (Tempo de Resposta)'),
            jsonb_build_object('id', 4, 'name', 'Atualizacao do CRM'),
            jsonb_build_object('id', 5, 'name', 'Ligacoes (Qualidade)'),
            jsonb_build_object('id', 6, 'name', 'Agendamentos Atendidos'),
            jsonb_build_object('id', 7, 'name', 'Constancia de Resultado')
        ),
        -- Scoring Ranges
        jsonb_build_object(
            'behavioral', jsonb_build_object('junior', ARRAY[16, 27], 'pleno', ARRAY[28, 39], 'senior', ARRAY[40, 48]),
            'technical_def', jsonb_build_object('junior', ARRAY[5, 7], 'pleno', ARRAY[8, 11], 'senior', ARRAY[12, 15]),
            'process', jsonb_build_object('junior', ARRAY[7, 11], 'pleno', ARRAY[12, 16], 'senior', ARRAY[17, 21]),
            'global', jsonb_build_object('junior', ARRAY[28, 45], 'pleno', ARRAY[46, 66], 'senior', ARRAY[67, 84])
        )
    FROM job_titles jt
    WHERE jt.id = role_sdr_id
    ON CONFLICT (workspace_id, job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;

    RAISE NOTICE 'SDR Competency Framework criado/atualizado';
END IF;

-- 3. Closer Competency Framework
IF role_closer_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        workspace_id,
        job_title_id,
        name,
        weights,
        behavioral_competencies,
        technical_def_competencies,
        process_competencies,
        scoring_ranges
    )
    SELECT
        jt.workspace_id,
        role_closer_id,
        'Closer Competency Matrix',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        -- 16 Behavioral (same as SDR)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Controle Emocional'),
            jsonb_build_object('id', 2, 'name', 'Proatividade (Problemas)'),
            jsonb_build_object('id', 3, 'name', 'Propositivo (Ideias)'),
            jsonb_build_object('id', 4, 'name', 'Autonomia (Playbook)'),
            jsonb_build_object('id', 5, 'name', 'Conhecimento Produto/Mercado'),
            jsonb_build_object('id', 6, 'name', 'Responsabilidade (Resultados)'),
            jsonb_build_object('id', 7, 'name', 'Coachability (Feedback)'),
            jsonb_build_object('id', 8, 'name', 'Comprometimento'),
            jsonb_build_object('id', 9, 'name', 'Comunicacao com Lider'),
            jsonb_build_object('id', 10, 'name', 'Desenvolvimento Continuo'),
            jsonb_build_object('id', 11, 'name', 'Feedback Tecnico (Pares)'),
            jsonb_build_object('id', 12, 'name', 'Colaboracao'),
            jsonb_build_object('id', 13, 'name', 'Mentoria'),
            jsonb_build_object('id', 14, 'name', 'Participacao (Ritos)'),
            jsonb_build_object('id', 15, 'name', 'Comunicacao Nao Violenta'),
            jsonb_build_object('id', 16, 'name', 'Integridade')
        ),
        -- 5 DEF Technical (same)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Etapa 0 - WhatsApp'),
            jsonb_build_object('id', 2, 'name', 'Etapa 1 - Descoberta'),
            jsonb_build_object('id', 3, 'name', 'Etapa 2 - Encantamento'),
            jsonb_build_object('id', 4, 'name', 'Etapa 3 - Fechamento'),
            jsonb_build_object('id', 5, 'name', 'Contorno de Objecao')
        ),
        -- 7 Process Competencies (Closer)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Execucao de Cadencia'),
            jsonb_build_object('id', 2, 'name', 'Execucao de Follow'),
            jsonb_build_object('id', 3, 'name', 'SLA (Tempo de Resposta)'),
            jsonb_build_object('id', 4, 'name', 'Atualizacao do CRM'),
            jsonb_build_object('id', 5, 'name', 'Ligacoes (Qualidade)'),
            jsonb_build_object('id', 6, 'name', 'Taxa de Conversao'),
            jsonb_build_object('id', 7, 'name', 'Constancia de Resultado')
        ),
        -- Scoring Ranges (same as SDR)
        jsonb_build_object(
            'behavioral', jsonb_build_object('junior', ARRAY[16, 27], 'pleno', ARRAY[28, 39], 'senior', ARRAY[40, 48]),
            'technical_def', jsonb_build_object('junior', ARRAY[5, 7], 'pleno', ARRAY[8, 11], 'senior', ARRAY[12, 15]),
            'process', jsonb_build_object('junior', ARRAY[7, 11], 'pleno', ARRAY[12, 16], 'senior', ARRAY[17, 21]),
            'global', jsonb_build_object('junior', ARRAY[28, 45], 'pleno', ARRAY[46, 66], 'senior', ARRAY[67, 84])
        )
    FROM job_titles jt
    WHERE jt.id = role_closer_id
    ON CONFLICT (workspace_id, job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;

    RAISE NOTICE 'Closer Competency Framework criado/atualizado';
END IF;

-- 4. Supervisor Competency Framework
IF role_supervisor_id IS NOT NULL THEN
    INSERT INTO competency_frameworks (
        workspace_id,
        job_title_id,
        name,
        weights,
        behavioral_competencies,
        technical_def_competencies,
        process_competencies,
        scoring_ranges
    )
    SELECT
        jt.workspace_id,
        role_supervisor_id,
        'Supervisor Competency Matrix',
        '{"behavioral": 0.50, "technical_def": 0.30, "process": 0.20}'::jsonb,
        -- 16 Behavioral (same)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Controle Emocional'),
            jsonb_build_object('id', 2, 'name', 'Proatividade (Problemas)'),
            jsonb_build_object('id', 3, 'name', 'Propositivo (Ideias)'),
            jsonb_build_object('id', 4, 'name', 'Autonomia (Playbook)'),
            jsonb_build_object('id', 5, 'name', 'Conhecimento Produto/Mercado'),
            jsonb_build_object('id', 6, 'name', 'Responsabilidade (Resultados)'),
            jsonb_build_object('id', 7, 'name', 'Coachability (Feedback)'),
            jsonb_build_object('id', 8, 'name', 'Comprometimento'),
            jsonb_build_object('id', 9, 'name', 'Comunicacao com Lider'),
            jsonb_build_object('id', 10, 'name', 'Desenvolvimento Continuo'),
            jsonb_build_object('id', 11, 'name', 'Feedback Tecnico (Pares)'),
            jsonb_build_object('id', 12, 'name', 'Colaboracao'),
            jsonb_build_object('id', 13, 'name', 'Mentoria'),
            jsonb_build_object('id', 14, 'name', 'Participacao (Ritos)'),
            jsonb_build_object('id', 15, 'name', 'Comunicacao Nao Violenta'),
            jsonb_build_object('id', 16, 'name', 'Integridade')
        ),
        -- 5 DEF Technical (same)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Etapa 0 - WhatsApp'),
            jsonb_build_object('id', 2, 'name', 'Etapa 1 - Descoberta'),
            jsonb_build_object('id', 3, 'name', 'Etapa 2 - Encantamento'),
            jsonb_build_object('id', 4, 'name', 'Etapa 3 - Fechamento'),
            jsonb_build_object('id', 5, 'name', 'Contorno de Objecao')
        ),
        -- 10 Process Competencies (Management)
        jsonb_build_array(
            jsonb_build_object('id', 1, 'name', 'Gestao de Pessoas'),
            jsonb_build_object('id', 2, 'name', 'Desenvolvimento de Time'),
            jsonb_build_object('id', 3, 'name', 'Gestao de Performance'),
            jsonb_build_object('id', 4, 'name', 'Comunicacao Organizacional'),
            jsonb_build_object('id', 5, 'name', 'Tomada de Decisao'),
            jsonb_build_object('id', 6, 'name', 'Planejamento e Organizacao'),
            jsonb_build_object('id', 7, 'name', 'Resolucao de Conflitos'),
            jsonb_build_object('id', 8, 'name', 'Delegacao'),
            jsonb_build_object('id', 9, 'name', 'Accountability do Time'),
            jsonb_build_object('id', 10, 'name', 'Visao Estrategica')
        ),
        -- Scoring Ranges (Supervisor has 10 process items instead of 7)
        jsonb_build_object(
            'behavioral', jsonb_build_object('junior', ARRAY[16, 27], 'pleno', ARRAY[28, 39], 'senior', ARRAY[40, 48]),
            'technical_def', jsonb_build_object('junior', ARRAY[5, 7], 'pleno', ARRAY[8, 11], 'senior', ARRAY[12, 15]),
            'process', jsonb_build_object('junior', ARRAY[10, 14], 'pleno', ARRAY[15, 23], 'senior', ARRAY[24, 30]),
            'global', jsonb_build_object('junior', ARRAY[31, 51], 'pleno', ARRAY[52, 72], 'senior', ARRAY[73, 93])
        )
    FROM job_titles jt
    WHERE jt.id = role_supervisor_id
    ON CONFLICT (workspace_id, job_title_id) DO UPDATE SET
        weights = EXCLUDED.weights,
        behavioral_competencies = EXCLUDED.behavioral_competencies,
        technical_def_competencies = EXCLUDED.technical_def_competencies,
        process_competencies = EXCLUDED.process_competencies,
        scoring_ranges = EXCLUDED.scoring_ranges;

    RAISE NOTICE 'Supervisor Competency Framework criado/atualizado';
END IF;

RAISE NOTICE 'Competency Frameworks seed concluido!';

END $$;

-- Verificacao
SELECT
    cf.name,
    jt.name as job_title,
    jsonb_array_length(cf.behavioral_competencies) as behavioral_count,
    jsonb_array_length(cf.technical_def_competencies) as technical_count,
    jsonb_array_length(cf.process_competencies) as process_count
FROM competency_frameworks cf
JOIN job_titles jt ON cf.job_title_id = jt.id
ORDER BY jt.name;
