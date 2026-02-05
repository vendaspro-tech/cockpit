-- Adicionar coluna comment se não existir (garantia)
ALTER TABLE public.assessment_responses 
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Recarregar cache do schema do PostgREST
-- Isso é necessário quando se altera a estrutura de tabelas e o Supabase não detecta automaticamente
NOTIFY pgrst, 'reload schema';
