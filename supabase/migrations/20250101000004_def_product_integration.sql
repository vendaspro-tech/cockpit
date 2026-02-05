-- Migration: Add product relationship to assessments
-- This allows DEF Method assessments to be associated with specific products

-- Add product_id column to assessments table
ALTER TABLE public.assessments 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_assessments_product_id 
ON public.assessments(product_id);

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.assessments.product_id IS 
'Product being evaluated (optional, primarily for DEF Method assessments)';
