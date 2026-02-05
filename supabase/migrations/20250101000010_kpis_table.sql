-- Migration: KPIs Catalog Table
-- Description: Creates kpis table with RLS policies and seeds initial data

-- Create table
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  benchmark VARCHAR(255) NOT NULL,
  formula TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_kpis_category ON kpis(category);
CREATE INDEX idx_kpis_active ON kpis(is_active);
CREATE INDEX idx_kpis_display_order ON kpis(display_order);

-- Enable RLS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active KPIs
CREATE POLICY "KPIs são visíveis para todos autenticados"
ON kpis FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Policy: Only system_owner can manage KPIs
CREATE POLICY "Apenas system_owner pode gerenciar KPIs"
ON kpis FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN users u ON u.id = wm.user_id
    WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    AND wm.role = 'owner'
  )
);

-- Seed Data: 30 KPIs across 4 categories

-- Funil Venda Direta (10 KPIs)
INSERT INTO kpis (name, description, category, benchmark, formula, display_order) VALUES
('SQL''s', 'Leads qualificados para vendas', 'Funil Venda Direta', 'até 20/dia', 'Número de Leads Qualificados para Venda', 1),
('Contatados', 'Percentual de SQL''s contatados', 'Funil Venda Direta', '95%', '(Número de SQL''s Contatados / Número Total de SQL''s) * 100', 2),
('Sessões Abertas', 'Percentual de sessões de venda abertas', 'Funil Venda Direta', '60%', '(Número de Sessões Abertas / Número Total de Tentativas de Sessão) * 100', 3),
('Vendas', 'Total de vendas concluídas', 'Funil Venda Direta', 'Valor Meta', 'Número de Negócios Fechados', 4),
('Conversão', 'Taxa de conversão de SQL para Vendas', 'Funil Venda Direta', '8% / 20%', '(Número de Vendas / Número de SQL''s) * 100', 5),
('Ticket Médio', 'Valor médio das vendas', 'Funil Venda Direta', 'Valor Ideal', 'Receita Total de Vendas / Número de Vendas', 6),
('Forma de Pagamento', 'Percentual de pagamentos recorrentes', 'Funil Venda Direta', 'até 30% recorrente', '(Receita de Pagamentos Recorrentes / Receita Total de Vendas) * 100', 7),
('Early Churn', 'Taxa de cancelamento inicial', 'Funil Venda Direta', 'até 5%', '(Número de Cancelamentos em X Período Inicial / Número Total de Clientes) * 100', 8),
('CAC', 'Custo de Aquisição de Cliente', 'Funil Venda Direta', 'até 15%', 'Custo Total de Marketing e Vendas / Número de Novos Clientes', 9),
('ROI', 'Retorno sobre o Investimento', 'Funil Venda Direta', 'à partir de 4', '(Receita Gerada - Custo de Investimento) / Custo de Investimento', 10);

-- Funil Sessão Estratégica (12 KPIs)
INSERT INTO kpis (name, description, category, benchmark, formula, display_order) VALUES
('Lead', 'Contato inicial de interesse', 'Funil Sessão Estratégica', 'Número Meta', 'Número de Interessados / Contatos Gerados', 1),
('MQL', 'Lead Qualificado por Marketing', 'Funil Sessão Estratégica', '40%', '(Número de MQL''s / Número de Leads) * 100', 2),
('SQL', 'Lead Qualificado para Venda', 'Funil Sessão Estratégica', '50%', '(Número de SQL''s / Número de MQL''s) * 100', 3),
('Oportunidades / Agendamento', 'Percentual de oportunidades que viram agendamento', 'Funil Sessão Estratégica', '60%', '(Número de Agendamentos / Número de Oportunidades) * 100', 4),
('Agendamento', 'Percentual de agendamentos realizados', 'Funil Sessão Estratégica', '60%', '(Número de Agendamentos Realizados / Número de SQL''s) * 100', 5),
('Comparecimento', 'Percentual de comparecimento nas sessões', 'Funil Sessão Estratégica', '75%', '(Número de Comparecimentos / Número de Agendamentos) * 100', 6),
('Vendas', 'Total de vendas pós sessão estratégica', 'Funil Sessão Estratégica', 'Valor Meta', 'Número de Negócios Fechados Pós Sessão', 7),
('Conversão / Call', 'Taxa de conversão da sessão para venda', 'Funil Sessão Estratégica', '20 ~ 25%', '(Número de Vendas / Número de Comparecimentos) * 100', 8),
('Forma de Pagamento', 'Percentual de pagamentos recorrentes', 'Funil Sessão Estratégica', 'até 70% recorrente', '(Receita Recorrente de Sessão / Receita Total de Sessão) * 100', 9),
('Ticket Médio', 'Valor médio das vendas pós sessão', 'Funil Sessão Estratégica', 'Valor Ideal', 'Receita Total Pós Sessão / Número de Vendas Pós Sessão', 10),
('CAC', 'Custo de Aquisição de Cliente', 'Funil Sessão Estratégica', 'até 6%', 'Custo Total Pós Sessão / Número de Novos Clientes Pós Sessão', 11),
('ROI', 'Retorno sobre o Investimento', 'Funil Sessão Estratégica', 'à partir 5', '(Receita Sessão - Custo Sessão) / Custo Sessão', 12);

-- Marketing (5 KPIs)
INSERT INTO kpis (name, description, category, benchmark, formula, display_order) VALUES
('CTR', 'Taxa de Cliques', 'Marketing', '> 1%', '(Cliques / Impressões) * 100', 1),
('Conect Rate', 'Taxa de Conexão', 'Marketing', '> 80%', '(Conexões Realizadas / Tentativas de Conexão) * 100', 2),
('Conversão / Venda', 'Taxa de Conversão para Venda', 'Marketing', '> 20%', '(Número de Vendas / Interações de Marketing) * 100', 3),
('Conversão / Cadastro', 'Taxa de Conversão para Cadastro', 'Marketing', '> 40%', '(Número de Cadastros / Cliques ou Acessos) * 100', 4),
('Conversão / Checkout', 'Taxa de Conversão para Checkout', 'Marketing', '> 20%', '(Número de Checkouts / Cliques ou Acessos na Página do Produto) * 100', 5);

-- Financeiro (3 KPIs)
INSERT INTO kpis (name, description, category, benchmark, formula, display_order) VALUES
('CAC Comercial Bruto', 'Custo de Aquisição Comercial Bruto', 'Financeiro', 'Valor Meta', 'Total Folha dividido pelo faturamento bruto', 1),
('CAC Comercial Líquido', 'Custo de Aquisição Comercial Líquido', 'Financeiro', 'Valor Meta', 'Total Folha dividido pelo faturamento líquido', 2),
('ROI Comercial', 'Retorno sobre o Investimento Comercial', 'Financeiro', 'Valor Meta', 'Total faturado menos folha, dividido pela folha', 3);
