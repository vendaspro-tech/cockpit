-- Create assessment_responses table
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, question_id)
);

-- Enable RLS
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view responses of their workspace"
    ON public.assessment_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            JOIN public.workspace_members wm ON a.workspace_id = wm.workspace_id
            WHERE a.id = assessment_responses.assessment_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert responses for their assessments"
    ON public.assessment_responses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_responses.assessment_id
            AND (a.evaluator_user_id = auth.uid() OR a.evaluated_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their responses"
    ON public.assessment_responses
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_responses.assessment_id
            AND (a.evaluator_user_id = auth.uid() OR a.evaluated_user_id = auth.uid())
        )
    );
