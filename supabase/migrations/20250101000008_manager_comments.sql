-- Add manager_comments column to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS manager_comments TEXT;

-- Add comment
COMMENT ON COLUMN assessments.manager_comments IS 'Comentários do gestor sobre a avaliação';
