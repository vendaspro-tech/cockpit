-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS value_ladder_level text CHECK (value_ladder_level IN ('Front End', 'Back End', 'High End')),
ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('Curso', 'Comunidade', 'Mentoria', 'Consultoria', 'Ebook', 'SaaS')),
ADD COLUMN IF NOT EXISTS sales_page_url text,
ADD COLUMN IF NOT EXISTS checkout_url text,
ADD COLUMN IF NOT EXISTS my_sales_url text;

-- Create product_sales_scripts table
CREATE TABLE IF NOT EXISTS product_sales_scripts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    version integer NOT NULL,
    content text,
    editor_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_sales_scripts_product_id ON product_sales_scripts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_scripts_version ON product_sales_scripts(product_id, version DESC);

-- Enable RLS
ALTER TABLE product_sales_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for product_sales_scripts
CREATE POLICY "Users can view sales scripts of their workspace products"
    ON product_sales_scripts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
            WHERE p.id = product_sales_scripts.product_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sales scripts for their workspace products"
    ON product_sales_scripts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p
            JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
            WHERE p.id = product_sales_scripts.product_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );
