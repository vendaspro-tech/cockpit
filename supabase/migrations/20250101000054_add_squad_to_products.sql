-- Add optional squad assignment to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_squad ON public.products(squad_id);
