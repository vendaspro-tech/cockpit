-- Migration: Add new operational roles
-- Description: Adds BDR, Social Seller, and CS to the roles table

INSERT INTO roles (slug, name, description, is_system_role) VALUES
('bdr', 'BDR', 'Pré-vendedor focado em prospecção ativa (outbound)', TRUE),
('social_seller', 'Social Seller', 'Vendedor focado em social selling e networking', TRUE),
('cs', 'Customer Success', 'Focado em retenção e sucesso do cliente', TRUE)
ON CONFLICT (slug) DO NOTHING;
