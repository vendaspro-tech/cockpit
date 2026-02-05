-- Add order_index column to pdi_items table
ALTER TABLE pdi_items ADD COLUMN order_index INTEGER DEFAULT 0;
